@echo off
title Start IMS (MongoDB + API)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\iis\start-ims-local.ps1"
pause
