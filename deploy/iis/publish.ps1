# Publish IMS API + React build for IIS applications IMSWebAPI and IMSWebApp.
# Run in PowerShell (Administrator recommended for inetpub copy).

param(
    [string]$PublishRoot = "C:\inetpub\ims",
    [ValidateSet("proxy", "httpplatform")]
    [string]$ApiMode = "proxy",
    [switch]$SkipWebBuild,
    [switch]$SkipApiInstall
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ApiSource = Join-Path $RepoRoot "api"
$WebSource = Join-Path $RepoRoot "ims-web"
$ApiTarget = Join-Path $PublishRoot "IMSWebAPI"
$WebTarget = Join-Path $PublishRoot "IMSWebApp"
$ApiWebConfig = if ($ApiMode -eq "httpplatform") {
    Join-Path $PSScriptRoot "IMSWebAPI\web.config.httpplatform"
} else {
    Join-Path $PSScriptRoot "IMSWebAPI\web.config"
}
$WebWebConfig = Join-Path $PSScriptRoot "IMSWebApp\web.config"

Write-Host "IMS IIS publish" -ForegroundColor Cyan
Write-Host "  Source repo : $RepoRoot"
Write-Host "  API IIS mode: $ApiMode"
Write-Host "  Publish root: $PublishRoot"
if (-not (Test-Path $WebSource)) { throw "Web folder not found: $WebSource" }

New-Item -ItemType Directory -Force -Path $PublishRoot, $ApiTarget, $WebTarget, (Join-Path $ApiTarget "iis-logs") | Out-Null

Write-Host "`n[1/4] Publishing API to $ApiTarget ..."
if (Test-Path $ApiTarget) {
    Get-ChildItem $ApiTarget -Force | Where-Object { $_.Name -ne 'iis-logs' } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

$apiCopyItems = @(
    "src",
    "package.json",
    "package-lock.json",
    ".env",
    ".env.example"
)
foreach ($item in $apiCopyItems) {
    $from = Join-Path $ApiSource $item
    if (Test-Path $from) {
        Copy-Item $from -Destination $ApiTarget -Recurse -Force
    }
}

Copy-Item $ApiWebConfig -Destination (Join-Path $ApiTarget "web.config") -Force

if (-not $SkipApiInstall) {
    Write-Host "Installing API dependencies (production)..."
    Push-Location $ApiTarget
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    npm ci --omit=dev 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        npm install --omit=dev 2>&1 | Out-Host
    }
    $ErrorActionPreference = $prevEap
    if ($LASTEXITCODE -ne 0) { throw "npm install failed in $ApiTarget" }
    Pop-Location
} elseif (-not (Test-Path (Join-Path $ApiTarget "node_modules\dotenv\package.json"))) {
    Write-Host "node_modules missing - running npm install..."
    Push-Location $ApiTarget
    npm install --omit=dev 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "npm install failed in $ApiTarget" }
    Pop-Location
}

if (-not (Test-Path (Join-Path $ApiTarget ".env"))) {
    Copy-Item (Join-Path $ApiSource ".env.example") (Join-Path $ApiTarget ".env") -Force
    Write-Warning "Created .env in $ApiTarget from .env.example - edit MONGODB_URI before go-live."
}

if (-not $SkipWebBuild) {
    Write-Host "`n[2/4] Building React web app..."
    Push-Location $WebSource
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "ims-web build failed." }
    Pop-Location
}

$dist = Join-Path $WebSource "dist"
if (-not (Test-Path (Join-Path $dist "index.html"))) {
    throw "React build output missing. Run: cd ims-web; npm run build"
}

Write-Host "`n[3/4] Publishing web app to $WebTarget ..."
if (Test-Path $WebTarget) {
    Get-ChildItem $WebTarget -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $WebTarget | Out-Null
Copy-Item (Join-Path $dist "*") -Destination $WebTarget -Recurse -Force
Copy-Item $WebWebConfig -Destination (Join-Path $WebTarget "web.config") -Force

Write-Host "`n[4/4] Done." -ForegroundColor Green
Write-Host ""
Write-Host "Point IIS applications to these folders:"
Write-Host "  IMSWebAPI  ->  $ApiTarget"
Write-Host "  IMSWebApp  ->  $WebTarget"
Write-Host ""
Write-Host "Test URLs:"
Write-Host "  http://localhost/IMSWebAPI/api/health"
Write-Host "  http://localhost/IMSWebApp/"
Write-Host ""
$logDir = Join-Path $ApiTarget "iis-logs"
Write-Host "API logs: $logDir"
