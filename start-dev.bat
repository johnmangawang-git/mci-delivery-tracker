@echo off
echo Starting MCI Delivery System Development Server...
echo.
echo Choose your preferred method:
echo 1. Express Server (Recommended)
echo 2. Simple HTTP Server (serve)
echo 3. Python HTTP Server (if Python installed)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Starting Express server...
    node server.js
) else if "%choice%"=="2" (
    echo Starting serve...
    npx serve public -p 3000
) else if "%choice%"=="3" (
    echo Starting Python server...
    cd public
    python -m http.server 3000
) else (
    echo Invalid choice. Starting Express server by default...
    node server.js
)

pause