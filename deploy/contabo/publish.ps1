# Build IMS for Contabo (Linux + nginx + PM2 + MongoDB)
# Run on Windows from repo root:
#   powershell -ExecutionPolicy Bypass -File deploy\contabo\publish.ps1

param(
    [string]$PublishRoot = "",
    [switch]$SkipWebBuild,
    [switch]$SkipApiInstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$RepoRoot = Split-Path (Split-Path $ScriptDir -Parent) -Parent
if (-not $PublishRoot) {
    $PublishRoot = Join-Path $ScriptDir "publish"
}

$ApiSource = Join-Path $RepoRoot "api"
$WebSource = Join-Path $RepoRoot "ims-web"
$ApiTarget = Join-Path $PublishRoot "api"
$WebTarget = Join-Path $PublishRoot "web"

Write-Host "IMS Contabo publish" -ForegroundColor Cyan
Write-Host "  Repo   : $RepoRoot"
Write-Host "  Output : $PublishRoot"

New-Item -ItemType Directory -Force -Path $PublishRoot, $ApiTarget, $WebTarget | Out-Null

# --- API ---
Write-Host "`n[1/4] Packaging API..."
if (Test-Path $ApiTarget) {
    Get-ChildItem $ApiTarget -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $ApiTarget | Out-Null

$apiItems = @("src", "package.json", "package-lock.json", ".env.example")
foreach ($item in $apiItems) {
    $from = Join-Path $ApiSource $item
    if (Test-Path $from) {
        Copy-Item $from -Destination $ApiTarget -Recurse -Force
    }
}

if (-not $SkipApiInstall) {
    Write-Host "Installing API production dependencies..."
    Push-Location $ApiTarget
    npm ci --omit=dev 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { npm install --omit=dev 2>&1 | Out-Host }
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Pop-Location
}

# --- Web ---
if (-not $SkipWebBuild) {
    Write-Host "`n[2/4] Building React app (Contabo production)..."
    Push-Location $WebSource
    if (-not (Test-Path "node_modules")) { npm install }
    $env:VITE_BASE_PATH = "/"
    $env:VITE_API_BASE_URL = ""
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "ims-web build failed" }
    Pop-Location
    Remove-Item Env:VITE_BASE_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue
}

$dist = Join-Path $WebSource "dist"
if (-not (Test-Path (Join-Path $dist "index.html"))) {
    throw "React dist missing. Run build first."
}

Write-Host "`n[3/4] Copying web build..."
if (Test-Path $WebTarget) {
    Get-ChildItem $WebTarget -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $WebTarget | Out-Null
Copy-Item (Join-Path $dist "*") -Destination $WebTarget -Recurse -Force

# --- Deploy configs ---
Write-Host "`n[4/4] Copying deploy configs..."
$configs = @(
    "api.env.production.example",
    "nginx-ims.conf",
    "pm2.ecosystem.cjs",
    "docker-compose.mongo.yml",
    "server-setup.sh",
    "deploy-on-server.sh",
    "README.md"
)
foreach ($cfg in $configs) {
    $from = Join-Path $ScriptDir $cfg
    if (Test-Path $from) {
        Copy-Item $from -Destination $PublishRoot -Force
    }
}

Write-Host "`nPublish complete." -ForegroundColor Green
Write-Host "Upload folder to Contabo:"
Write-Host "  $PublishRoot  ->  /var/www/ims/"
Write-Host ""
Write-Host "On server (first time):"
Write-Host "  sudo bash server-setup.sh"
Write-Host "  sudo cp api.env.production.example api/.env   # edit secrets"
Write-Host "  sudo bash deploy-on-server.sh"
