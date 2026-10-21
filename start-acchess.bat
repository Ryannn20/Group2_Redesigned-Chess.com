@echo off
setlocal
cd /d "%~dp0"
set PORT=5188
set PY=python
where py >nul 2>nul && set PY=py
where %PY% >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python from https://www.python.org/downloads/ and run this file again.
  pause
  exit /b 1
)
echo Starting AcChess on http://localhost:%PORT%/ ...
start "AcChess local server (close this window to stop)" /min %PY% -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%/index.html"
echo.
echo AcChess is open in your browser.
echo Chrome and Edge remember the microphone choice for http://localhost, so you are asked only once.
echo To stop the server, close the minimized "AcChess local server" window.
echo.
pause
