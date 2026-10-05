# Uses a separate loopback-only MySQL process; never migrates the live database.
# Requires the installed MySQL 8 binaries and the private root .env.
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskBackend = Join-Path $taskRoot 'backend'
$taskConfig = @{}
Get-Content -LiteralPath (Join-Path $taskRoot '.env') | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
        $taskConfig[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
}
$taskLivePassword = $env:DB_PASSWORD
if (-not $taskLivePassword) { $taskLivePassword = $taskConfig['DB_PASSWORD'] }
$taskLiveUser = $env:DB_USER
if (-not $taskLiveUser) { $taskLiveUser = $taskConfig['DB_USER'] }
if (-not $taskLiveUser) { $taskLiveUser = $taskConfig['DB_USERNAME'] }
$taskLiveUrl = $env:DB_URL
if (-not $taskLiveUrl) { $taskLiveUrl = $taskConfig['DB_URL'] }
if (-not $taskLiveUrl) { $taskLiveUrl = 'jdbc:mysql://localhost:3306/lankastay_db' }
if (-not $taskLivePassword -or -not $taskLiveUser) { throw 'Private DB configuration missing.' }
$taskBinary = (Get-Command mysqld.exe -ErrorAction Stop).Source
$taskBase = Split-Path (Split-Path $taskBinary)
$taskBuildRoot = [IO.Path]::GetFullPath((Join-Path $taskBackend 'target'))
$taskWork = [IO.Path]::GetFullPath((Join-Path $taskBuildRoot ('mysql-precommit-' + [guid]::NewGuid().ToString('N'))))
if (-not $taskWork.StartsWith($taskBuildRoot + [IO.Path]::DirectorySeparatorChar)) {
    throw 'Refusing a non-build-output sandbox path.'
}
New-Item -ItemType Directory -Path $taskWork | Out-Null
$taskData = Join-Path $taskWork 'data'
New-Item -ItemType Directory -Path $taskData | Out-Null
$taskListener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$taskListener.Start()
$taskPort = $taskListener.LocalEndpoint.Port
$taskListener.Stop()
if ($taskPort -eq 3306) { throw 'Refusing the production MySQL port.' }
$taskRandom = New-Object byte[] 32
$taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$taskRng.GetBytes($taskRandom)
$taskRng.Dispose()
$taskIsolatedPassword = [Convert]::ToBase64String($taskRandom)
$taskNames = @('MYSQL_PWD','MIGRATION_TEST_ALLOW_FRESH','MIGRATION_TEST_URL',
    'MIGRATION_TEST_USER','MIGRATION_TEST_PASSWORD','MIGRATION_EXISTING_URL',
    'MIGRATION_EXISTING_USER','MIGRATION_EXISTING_PASSWORD')
$taskSaved = @{}
foreach ($taskName in $taskNames) { $taskSaved[$taskName] = [Environment]::GetEnvironmentVariable($taskName, 'Process') }
$taskServer = $null
try {
    $taskInit = Start-Process -FilePath $taskBinary -WindowStyle Hidden -PassThru -Wait -ArgumentList @(
        '--no-defaults','--initialize-insecure',"--basedir=`"$taskBase`"", "--datadir=`"$taskData`""
    ) -RedirectStandardOutput (Join-Path $taskWork 'init.log') -RedirectStandardError (Join-Path $taskWork 'init.err.log')
    if ($taskInit.ExitCode -ne 0) { throw 'Isolated MySQL initialization failed; inspect ignored initialization logs.' }
    $taskServer = Start-Process -FilePath $taskBinary -WindowStyle Hidden -PassThru -ArgumentList @(
        '--no-defaults',"--basedir=`"$taskBase`"", "--datadir=`"$taskData`"",
        "--port=$taskPort", '--bind-address=127.0.0.1','--mysqlx=OFF',
        '--skip-log-bin','--general-log=OFF','--slow-query-log=OFF','--secure-file-priv=NULL',
        "--log-error=`"$(Join-Path $taskWork 'server.log')`""
    )
    $taskReady = $false
    $ErrorActionPreference = 'Continue' # Native readiness failures are expected while booting.
    for ($taskAttempt = 0; $taskAttempt -lt 100; $taskAttempt++) {
        & mysql --protocol=TCP --host=127.0.0.1 --port=$taskPort --user=root --skip-password --batch --execute='SELECT 1' 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $taskReady = $true; break }
        if ($taskServer.HasExited) { break }
        Start-Sleep -Milliseconds 200
    }
    $ErrorActionPreference = 'Stop'
    if (-not $taskReady) { throw 'Isolated MySQL did not become ready.' }
    # Initialize ONLY the new sandbox root identity. No live account is altered.
    # Secret travels through stdin, not --execute or command-line arguments.
    $taskSetupSql = "CREATE DATABASE lankastay_precommit_fresh CHARACTER SET utf8mb4; ALTER USER 'root'@'localhost' IDENTIFIED BY '$taskIsolatedPassword';"
    $ErrorActionPreference = 'Continue'
    $taskSetupSql | & mysql --protocol=TCP --host=127.0.0.1 --port=$taskPort --user=root --skip-password --batch 2>$null | Out-Null
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0) { throw 'Isolated database setup failed.' }
    $env:MYSQL_PWD = $taskIsolatedPassword
    $env:MIGRATION_TEST_ALLOW_FRESH = 'true'
    $env:MIGRATION_TEST_URL = "jdbc:mysql://127.0.0.1:$taskPort/lankastay_precommit_fresh?useSSL=false&allowPublicKeyRetrieval=true"
    $env:MIGRATION_TEST_USER = 'root'
    $env:MIGRATION_TEST_PASSWORD = $taskIsolatedPassword
    $env:MIGRATION_EXISTING_URL = $taskLiveUrl
    $env:MIGRATION_EXISTING_USER = $taskLiveUser
    $env:MIGRATION_EXISTING_PASSWORD = $taskLivePassword
    Push-Location $taskBackend
    try {
        $ErrorActionPreference = 'Continue'
        & .\mvnw.cmd -o '-Dmaven.repo.local=.m2/repository' '-Dtest=MySqlMigrationIT' test 2>&1 |
            ForEach-Object { "$_".Replace($taskLivePassword, '[REDACTED]').Replace($taskIsolatedPassword, '[REDACTED]') }
        if ($LASTEXITCODE -ne 0) { throw 'Real MySQL migration verification failed.' }
    } finally { $ErrorActionPreference = 'Stop'; Pop-Location }
} finally {
    if ($taskServer -and -not $taskServer.HasExited) {
        $env:MYSQL_PWD = $taskIsolatedPassword
        $ErrorActionPreference = 'Continue'
        & mysqladmin --protocol=TCP --host=127.0.0.1 --port=$taskPort --user=root shutdown 2>$null | Out-Null
        if (-not $taskServer.WaitForExit(5000)) { $taskServer.Kill(); $taskServer.WaitForExit() }
        $ErrorActionPreference = 'Stop'
    }
    foreach ($taskName in $taskNames) { [Environment]::SetEnvironmentVariable($taskName, $taskSaved[$taskName], 'Process') }
    Write-Output 'Isolated MySQL stopped; ignored sandbox files retained. Live schema was not migrated.'
}
