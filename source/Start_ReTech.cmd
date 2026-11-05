@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Vui long cai Node.js 22.13 tro len truoc khi chay.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci
 if errorlevel 1 exit /b 1
)
call npm run setup:local
if errorlevel 1 exit /b 1
call npm run dev
