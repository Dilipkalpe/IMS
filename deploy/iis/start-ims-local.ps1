# Bring IMS online on this PC: MongoDB + Node API (port 3000) for WPF / IIS.
# Run PowerShell as Administrator (right-click -> Run as administrator).

param(
    [string]$ApiFolder = (Join-Path $PSScriptRoot "publish\IMSWebAPI"),
    [switch]$SkipMongo
)

$ErrorActionPreference = "Stop"

function Test-PortOpen([int]$Port) {
    return (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
}

function Wait-Port([int]$Port, [int]$TimeoutSec = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortOpen $Port) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Host "Re-launching as Administrator..." -ForegroundColor Yellow
    $argList = @(
        "-NoProfile", "-ExecutionPolicy", "Bypass",
        "-File", $PSCommandPath
    )
    if ($SkipMongo) { $argList += "-SkipMongo" }
    Start-Process powershell.exe -Verb RunAs -ArgumentList $argList
    exit 0
}

Write-Host "IMS local startup" -ForegroundColor Cyan
Write-Host ""

# --- MongoDB ---
if (-not $SkipMongo) {
    $mongo = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongo) {
        if ($mongo.Status -ne "Running") {
            Write-Host "[1/3] Starting MongoDB service..."
            try {
                Start-Service MongoDB
            } catch {
                Write-Warning "Could not start MongoDB service: $($_.Exception.Message)"
                Write-Host "Try manually: services.msc -> MongoDB Server -> Start"
            }
        } else {
            Write-Host "[1/3] MongoDB service already running."
        }
    } else {
        Write-Warning "MongoDB Windows service not found. Install MongoDB Community Server."
    }

    if (-not (Wait-Port 27017 45)) {
        Write-Host ""
        Write-Host "MongoDB is not listening on port 27017." -ForegroundColor Red
        Write-Host "Check log: C:\Program Files\MongoDB\Server\8.3\log\mongod.log"
        Write-Host "Or use MongoDB Atlas and set MONGODB_URI in api\.env"
        exit 1
    }
    Write-Host "      MongoDB OK (port 27017)" -ForegroundColor Green
} else {
    Write-Host "[1/3] Skipped MongoDB check."
}

# --- API folder ---
if (-not (Test-Path (Join-Path $ApiFolder "src\index.js"))) {
    $ApiFolder = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "api"
}
if (-not (Test-Path (Join-Path $ApiFolder "src\index.js"))) {
    throw "API not found. Run publish.ps1 first."
}

if (-not (Test-Path (Join-Path $ApiFolder "node_modules\dotenv\package.json"))) {
    Write-Host "Installing API dependencies in $ApiFolder ..."
    Push-Location $ApiFolder
    npm install --omit=dev
    Pop-Location
}

# --- Stop stale API on 3000 ---
$on3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($on3000) {
    Write-Host "[2/3] Port 3000 in use - stopping old API process..."
    $on3000 | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# --- Start API (hidden window) ---
Write-Host "[2/3] Starting IMS API on http://127.0.0.1:3000 ..."
$nodeExe = Join-Path ${env:ProgramFiles} "nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    throw "Node.js not found. Install Node.js LTS."
}

$runner = Join-Path $env:TEMP "ims-api-local.cmd"
$cmdLines = @(
    "@echo off",
    "cd /d `"$ApiFolder`"",
    "set PORT=3000",
    "set HOST=127.0.0.1",
    "set NODE_ENV=production",
    "`"$nodeExe`" src\index.js"
)
Set-Content -Path $runner -Value $cmdLines -Encoding ASCII

Start-Process -FilePath $runner -WindowStyle Minimized

if (-not (Wait-Port 3000 30)) {
    Write-Host "API did not start. Open the minimized console window for errors." -ForegroundColor Red
    exit 1
}

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/health" -TimeoutSec 15
    Write-Host "      API OK: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "API port open but health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# --- IIS proxy ---
Write-Host "[3/3] Testing IIS..."
try {
    $iis = Invoke-RestMethod -Uri "http://localhost/IMSWebAPI/api/health" -TimeoutSec 10
    Write-Host "      IIS proxy OK: $($iis | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Warning "IIS IMSWebAPI not reachable ($($_.Exception.Message)). WPF can still use http://127.0.0.1:3000"
}

Write-Host ""
Write-Host "IMS is online." -ForegroundColor Green
Write-Host "  WPF desktop : Settings -> API connection -> Local API (http://127.0.0.1:3000)"
Write-Host "  or IIS      : http://localhost/IMSWebAPI  (not https)"
Write-Host "  Web app     : http://localhost/IMSWebApp/"
Write-Host ""
Write-Host "Keep the minimized 'ims-api-local' console open. For auto-start at boot run:"
Write-Host "  .\register-ims-api-autostart.ps1"
