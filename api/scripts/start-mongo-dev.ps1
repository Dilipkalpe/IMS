# Start local MongoDB for IMS dev (no admin required when using api/data/mongo).
$ErrorActionPreference = 'Stop'
$apiRoot = Split-Path $PSScriptRoot -Parent
$mongod = 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
$cfg = Join-Path $apiRoot 'mongod.dev.cfg'
$dataDir = Join-Path $apiRoot 'data\mongo'
$logFile = Join-Path $apiRoot 'data\mongo.log'

function Test-Port27017 {
    return (Test-NetConnection 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
}

if (-not (Test-Path $mongod)) {
    Write-Host 'MongoDB not found. Install MongoDB Community Server 8.x:'
    Write-Host 'https://www.mongodb.com/try/download/community'
    exit 1
}

if (Test-Port27017) {
    Write-Host 'MongoDB already listening on 127.0.0.1:27017'
    exit 0
}

# Prefer Windows service when available (uses your main IMS database).
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService -and $mongoService.Status -ne 'Running') {
    try {
        Start-Service MongoDB -ErrorAction Stop
        Start-Sleep -Seconds 3
        if (Test-Port27017) {
            Write-Host 'Started MongoDB Windows service.'
            exit 0
        }
    } catch {
        Write-Host "Windows MongoDB service could not start (run as Administrator): $($_.Exception.Message)"
    }
}

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

Write-Host "Starting dev MongoDB (data: $dataDir)"
Push-Location $apiRoot
try {
    Start-Process -FilePath $mongod -ArgumentList @('--config', $cfg) -WorkingDirectory $apiRoot -WindowStyle Minimized
    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port27017) {
            Write-Host "Dev MongoDB OK on 127.0.0.1:27017 (log: $logFile)"
            exit 0
        }
        Start-Sleep -Seconds 2
    }
    Write-Host 'Dev MongoDB did not open port 27017. Check data\mongo.log'
    exit 1
} finally {
    Pop-Location
}
