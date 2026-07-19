# Register IMS API to start automatically (required for IIS reverse-proxy mode).
# Run PowerShell as Administrator.

param(
    [string]$ApiFolder = (Join-Path $PSScriptRoot "publish\IMSWebAPI"),
    [string]$TaskName = "IMS-Api-Port3000"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $ApiFolder "src\index.js"))) {
    throw "API folder not found: $ApiFolder. Run publish.ps1 first."
}

if (-not (Test-Path (Join-Path $ApiFolder "node_modules\dotenv\package.json"))) {
    Write-Host "Installing API dependencies..."
    Push-Location $ApiFolder
    npm install --omit=dev
    Pop-Location
}

$nodeExe = Join-Path ${env:ProgramFiles} "nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    throw "Node.js not found at $nodeExe"
}

$scriptPath = Join-Path $env:TEMP "ims-api-runner.cmd"
$cmdContent = @"
@echo off
cd /d "$ApiFolder"
set PORT=3000
set HOST=127.0.0.1
set NODE_ENV=production
"$nodeExe" src\index.js
"@
Set-Content -Path $scriptPath -Value $cmdContent -Encoding ASCII

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Description "IMS Node API on port 3000 for IIS IMSWebAPI" | Out-Null

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 6

try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "API is running: $($health.Content)" -ForegroundColor Green
} catch {
    Write-Warning "Task registered but API not responding yet. Check MongoDB is running and $ApiFolder\.env"
}

Write-Host ""
Write-Host "Scheduled task '$TaskName' will start the API at every boot."
Write-Host "Test IIS: http://localhost/IMSWebAPI/api/health"
