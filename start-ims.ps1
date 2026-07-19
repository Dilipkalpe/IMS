# Start IMS API + build desktop app (frees port 3000 first)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Stopping anything on port 3000..." -ForegroundColor Yellow
Set-Location "$root\api"
npm run stop

Write-Host "Seeding database (optional)..." -ForegroundColor Yellow
npm run seed

Write-Host "Starting API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\api'; npm run dev:once"

Start-Sleep -Seconds 3

Write-Host "Building WPF app..." -ForegroundColor Green
Set-Location "$root\IMS"
dotnet build

Write-Host "Launching desktop app..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\IMS'; dotnet run"

Write-Host "Done. API: http://localhost:3000/api/health" -ForegroundColor Cyan
