# LankaStay Local Development - Start Backend Server
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        $parts = $trimmed.Split('=', 2)
        if ($parts.Count -eq 2) {
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1], 'Process')
        }
    }
}

Write-Host 'Starting LankaStay Spring Boot backend...' -ForegroundColor Green
Push-Location "$PSScriptRoot\backend"
$mavenRepository = Join-Path $PSScriptRoot 'backend\.m2\repository'
try {
    & .\mvnw.cmd "-Dmaven.repo.local=$mavenRepository" spring-boot:run 2>&1 |
        ForEach-Object {
            Write-Host "$_"
            if ("$_" -match 'Tomcat started on port (\d+)') {
                Write-Host "Backend running at: http://localhost:$($Matches[1])" -ForegroundColor Green
            }
        }
    if ($LASTEXITCODE -ne 0) { throw "Backend startup failed (exit code $LASTEXITCODE). See the output above." }
} finally {
    Pop-Location
}
