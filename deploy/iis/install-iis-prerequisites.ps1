# Check / install IIS modules needed for IMSWebAPI + IMSWebApp.
# Run PowerShell as Administrator.

param(
    [switch]$InstallHostingBundle
)

$ErrorActionPreference = "Continue"
Write-Host "IMS IIS prerequisites check" -ForegroundColor Cyan
Write-Host ""

function Test-IisModule($name) {
    $windir = $env:windir
    $appcmd = Join-Path $windir "system32\inetsrv\appcmd.exe"
    if (-not (Test-Path $appcmd)) {
        Write-Host "  [MISSING] IIS (appcmd not found)" -ForegroundColor Red
        return $false
    }
    $out = & $appcmd list modules 2>&1 | Out-String
    if ($out -match $name) {
        Write-Host "  [OK] $name" -ForegroundColor Green
        return $true
    }
    Write-Host "  [MISSING] $name" -ForegroundColor Yellow
    return $false
}

$hasRewrite = Test-IisModule "RewriteModule"
$hasHttpPlatform = Test-IisModule "httpPlatformHandler"
$nodePath = "${env:ProgramFiles}\nodejs\node.exe"
if (Test-Path $nodePath) {
    $ver = & $nodePath -v
    Write-Host "  [OK] Node.js $ver" -ForegroundColor Green
} else {
    Write-Host "  [MISSING] Node.js" -ForegroundColor Red
}

Write-Host ""
Write-Host "Deployment modes:" -ForegroundColor Cyan
Write-Host "  A) Reverse proxy (default web.config) - needs URL Rewrite + ARR proxy + API on port 3000"
Write-Host "     Start API: .\start-ims-api.ps1"
Write-Host "  B) HttpPlatformHandler (web.config.httpplatform) - needs Hosting Bundle, no separate npm start"
Write-Host ""

if (-not $hasRewrite) {
    Write-Host "Install URL Rewrite:" -ForegroundColor Yellow
    Write-Host "  https://www.iis.net/downloads/microsoft/url-rewrite"
    Write-Host "  Or: winget install Microsoft.IISUrlRewriteModule"
}

if (-not $hasHttpPlatform) {
    Write-Host "Install HttpPlatformHandler (optional, mode B):" -ForegroundColor Yellow
    Write-Host "  winget install Microsoft.DotNet.AspNetCore.HostingBundle"
    Write-Host "  Then copy IMSWebAPI\web.config.httpplatform to web.config"
}

if ($InstallHostingBundle -and -not $hasHttpPlatform) {
    Write-Host "Installing ASP.NET Core Hosting Bundle (includes HttpPlatformHandler)..." -ForegroundColor Cyan
    winget install --id Microsoft.DotNet.AspNetCore.HostingBundle -e --accept-source-agreements --accept-package-agreements
}

Write-Host ""
Write-Host "Enable ARR proxy (required for mode A):" -ForegroundColor Cyan
Write-Host "  IIS Manager -> server node -> Application Request Routing -> Server Proxy Settings -> Enable proxy"
Write-Host "  (Install ARR if missing: https://www.iis.net/downloads/microsoft/application-request-routing)"
Write-Host ""
Write-Host "After fixes, restart IIS site applications IMSWebAPI and IMSWebApp."
