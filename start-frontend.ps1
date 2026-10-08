# LankaStay Local Development - Start Frontend Server
$frontendUrl = 'http://localhost:5174/'
$existingPage = $null
try {
    $existingPage = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
} catch {
    # Let Vite report startup errors if there is no healthy frontend here.
}
if ($existingPage -and $existingPage.Content -match '<title>LankaStay Hotels' -and
        $existingPage.Content -match '/@vite/client') {
    Write-Host "Frontend running at: $frontendUrl" -ForegroundColor Green
    Write-Host 'LankaStay is already running; open the link above.'
    return
}
Write-Host 'Starting LankaStay frontend on port 5174. Vite will print the Local URL below.' -ForegroundColor Green
Push-Location "$PSScriptRoot\frontend"
try {
    & npm.cmd run dev
    if ($LASTEXITCODE -ne 0) { throw "Frontend startup failed (exit code $LASTEXITCODE). See the output above." }
} finally {
    Pop-Location
}
