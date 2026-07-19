@echo off
setlocal
cd /d "%~dp0"

rem Prefer bundled Node from IMS installer layout (..\runtime\node)
set "NODE=%~dp0..\runtime\node\node.exe"
if exist "%NODE%" (
  "%NODE%" "%~dp0src\index.js"
  exit /b %ERRORLEVEL%
)

rem Development fallback: repo Runtime folder or PATH
if exist "%~dp0..\Runtime\node\node.exe" (
  "%~dp0..\Runtime\node\node.exe" "%~dp0src\index.js"
  exit /b %ERRORLEVEL%
)

where node >nul 2>&1
if %ERRORLEVEL%==0 (
  node "%~dp0src\index.js"
  exit /b %ERRORLEVEL%
)

echo IMS API: Node.js not found. Install IMS setup package or add Node.js to PATH.
exit /b 1
