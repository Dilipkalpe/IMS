@echo off
REM Upload IMS to Contabo via SSH + Docker Compose (parallel to Coolify TMS)
REM Usage: deploy\coolify\upload-and-deploy.bat USER@144.91.98.218

setlocal
if "%~1"=="" (
  echo Usage: %~nx0 USER@144.91.98.218
  exit /b 1
)

set SERVER=%~1
set REPO=%~dp0..\..

echo Uploading IMS source to %SERVER%:/opt/ims ...
ssh %SERVER% "mkdir -p /opt/ims"
scp -r "%REPO%\api" "%REPO%\ims-web" "%REPO%\docker-compose.coolify.yml" "%SERVER%:/opt/ims/"
ssh %SERVER% "mkdir -p /opt/ims/deploy/coolify"
scp "%REPO%\deploy\coolify\nginx-full.conf" "%REPO%\deploy\coolify\.env.coolify.example" %SERVER%:/opt/ims/deploy/coolify/

echo Starting IMS Docker stack...
ssh %SERVER% "cd /opt/ims && cp deploy/coolify/.env.coolify.example .env 2>nul || true && docker compose -f docker-compose.coolify.yml up -d --build"

echo.
echo Next in Coolify: create IMS project, point ims.144.91.98.218.nip.io to the web container.
echo Or configure Traefik manually. Seed: docker exec -it ims-api-1 node src/seed.js

