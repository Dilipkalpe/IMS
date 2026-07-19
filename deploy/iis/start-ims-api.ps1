# Start IMS Node API on port 3000 for IIS reverse-proxy mode (web.config).
# IIS 502.3 means this API is not running — start it before using IMSWebAPI.

param(
    [string]$ApiFolder = (Join-Path $PSScriptRoot "publish\IMSWebAPI"),
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $ApiFolder "src\index.js"))) {
    $ApiFolder = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "api"
}

if (-not (Test-Path (Join-Path $ApiFolder "src\index.js"))) {
    throw "API not found. Run publish.ps1 first or set -ApiFolder."
}

if (-not (Test-Path (Join-Path $ApiFolder "node_modules\dotenv\package.json"))) {
    Write-Host "Installing dependencies in $ApiFolder ..."
    Push-Location $ApiFolder
    npm install --omit=dev
    Pop-Location
}

Write-Host "Starting IMS API from $ApiFolder on http://127.0.0.1:$Port"
Write-Host "Keep this window open. For auto-start at boot, run register-ims-api-autostart.ps1 as Administrator."
Write-Host ""

$env:PORT = "$Port"
$env:HOST = "127.0.0.1"
$env:NODE_ENV = "production"

Push-Location $ApiFolder
node src/index.js
Pop-Location
