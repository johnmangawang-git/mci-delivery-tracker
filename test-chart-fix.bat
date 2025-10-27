@echo off
echo.
echo ========================================
echo   Chart.js Fix - Isolated Testing
echo ========================================
echo.
echo 🔧 Starting isolated test server...
echo 🛡️ This will NOT affect your Supabase data
echo 📍 Server will run on http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

node test-chart-fix-server.js

pause