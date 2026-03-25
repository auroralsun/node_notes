@echo off
setlocal

cd /d "%~dp0"

set "APP_URL=http://localhost:3000"
set "NODE_DIR=C:\Program Files\nodejs"
set "NPM_CMD="

if exist "%NODE_DIR%\npm.cmd" (
  set "NPM_CMD=%NODE_DIR%\npm.cmd"
) else (
  for /f "delims=" %%i in ('where npm.cmd 2^>nul') do (
    set "NPM_CMD=%%i"
    goto found_npm
  )
)

:found_npm
if not defined NPM_CMD (
  echo [ERROR] No npm installation was found.
  echo Please install Node.js first: https://nodejs.org/
  pause
  exit /b 1
)

if /i "%~1"=="__runserver" goto run_server

call :check_running
if "%SERVER_READY%"=="1" goto open_browser

if not exist "node_modules" (
  echo [ERROR] Dependencies are missing: "%cd%\node_modules"
  echo Please run "npm install" first.
  pause
  exit /b 1
)

echo Starting web app...
start "Knowledge Graph Notes Web" cmd /k ""%~f0" __runserver"

echo Waiting for %APP_URL% ...
for /l %%n in (1,1,60) do (
  call :check_running
  if "%SERVER_READY%"=="1" goto open_browser
  timeout /t 1 /nobreak >nul
)

echo [WARN] The app did not become ready within 60 seconds.
echo Check the "Knowledge Graph Notes Web" window for errors.
pause
exit /b 1

:open_browser
echo Opening %APP_URL%
start "" "%APP_URL%"
exit /b 0

:run_server
set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0"
"%NPM_CMD%" run dev
exit /b %errorlevel%

:check_running
set "SERVER_READY=0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing '%APP_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 set "SERVER_READY=1"
exit /b 0
