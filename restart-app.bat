@echo off
echo Clearing browser cache and restarting MCI Delivery Tracker...

REM Kill any existing Python server processes
taskkill /f /im python.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Clear browser cache (Chrome)
echo Clearing Chrome cache...
REM This won't work without admin privileges, but we can try
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache2" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache" 2>nul

REM Clear browser cache (Edge)
echo Clearing Edge cache...
rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache2" 2>nul
rd /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\GPUCache" 2>nul

REM Change to the public directory and start the server
echo Starting server...
cd /d "c:\Users\jmangawang\Documents\mci-delivery-tracker\public"
python -m http.server 8000

pause