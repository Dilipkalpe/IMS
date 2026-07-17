# Run in PowerShell from repo root to prepare IMS for Coolify Git deploy
# Usage: .\deploy\coolify\prepare-git-for-coolify.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

if (-not (Test-Path ".git")) {
    git init
    Write-Host "Git initialized." -ForegroundColor Green
}

# Minimal files needed for Coolify Docker Compose deploy
$paths = @(
    "api",
    "ims-web",
    "docker-compose.coolify.yml",
    "deploy/coolify",
    ".gitignore"
)

if (-not (Test-Path ".gitignore")) {
    @"
node_modules/
dist/
.env
api/.env
deploy/contabo/publish/
deploy/iis/publish/
*.log
.DS_Store
"@ | Set-Content ".gitignore" -Encoding UTF8
}

git add docker-compose.coolify.yml api/Dockerfile api/.dockerignore api/package.json api/package-lock.json api/src
git add ims-web/Dockerfile ims-web/.dockerignore ims-web/nginx.conf ims-web/nginx.production.conf ims-web/.env.production ims-web/package.json ims-web/package-lock.json ims-web/index.html ims-web/vite.config.ts ims-web/tsconfig.json ims-web/src
git add .env.example docker-compose.coolify.yml
git add deploy/coolify .gitignore 2>$null

Write-Host "`nStaged files for Coolify deploy. Next:" -ForegroundColor Cyan
Write-Host "  1. git commit -m `"IMS Coolify deploy`""
Write-Host "  2. Create GitHub repo and: git remote add origin <url> && git push -u origin main"
Write-Host "  3. Follow deploy/coolify/CREATE-IMS-PROJECT.md in Coolify UI"
Write-Host ""
git status -sb
