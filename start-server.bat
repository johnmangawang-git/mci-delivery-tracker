@echo off
echo Starting local server for MCI Delivery Tracker...
echo.
echo Open your browser and go to one of these pages:
echo http://localhost:8000/verify-supabase.html - General Supabase verification
echo http://localhost:8000/check-tables.html - Database tables check
echo http://localhost:8000/public/login.html - Login page
echo.
python -m http.server 8000