# Troubleshooting 404 Error

This document provides steps to diagnose and resolve the 404 error when loading the MCI Delivery Tracker application.

## Current Server Status

The server is running on port 8086 and should be accessible at:
```
http://localhost:8086
```

## Steps to Diagnose the Issue

### 1. Verify Server is Running
Check if the server is running properly:
- Open your browser and navigate to `http://localhost:8086/test-server.html`
- You should see a "Server is working correctly!" message

### 2. Check Individual Files
Test if specific files can be accessed:
- `http://localhost:8086/` - Main application
- `http://localhost:8086/login.html` - Login page
- `http://localhost:8086/favicon.ico` - Favicon
- `http://localhost:8086/manifest.json` - Manifest file

### 3. Check Browser Console
Open the browser's developer tools (F12) and check the Console tab for any error messages:
- Look for JavaScript errors
- Check for failed resource loading (404 errors)
- Check for CORS or security errors

### 4. Check Network Tab
In the browser's developer tools, check the Network tab:
- Reload the page
- Look for any requests that return 404 status
- Check if all required files are being loaded correctly

## Common Causes and Solutions

### 1. Authentication Redirect Loop
The application redirects unauthenticated users to the login page. If there's an issue with the authentication flow:
- Try accessing `http://localhost:8086/login.html` directly
- Check if you can create an account and log in

### 2. Missing Files
If any required files are missing:
- Verify that all files listed in the HTML exist in the correct locations
- Check the browser's Network tab to see which files are returning 404 errors

### 3. Incorrect Paths
If file paths are incorrect:
- Check that all relative paths in the HTML files are correct
- Ensure that the directory structure matches the expected paths

### 4. Server Configuration
If the server is not configured correctly:
- Make sure you're running the server from the `public` directory
- Verify that the server is configured to serve static files

## Testing Steps

### 1. Access Test Pages
1. Open `http://localhost:8086/test-server.html`
2. Click on the links to navigate to the main application and login page

### 2. Check Authentication Flow
1. Go to `http://localhost:8086/login.html`
2. Try to create an account
3. Try to log in with the account
4. Check if you're redirected to the main application

### 3. Check Console for Errors
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Reload the page
4. Look for any error messages

### 4. Check Network Requests
1. Open browser developer tools (F12)
2. Go to the Network tab
3. Reload the page
4. Look for any failed requests (red entries or 404 status)

## Additional Debugging

### Check Supabase Configuration
The application uses Supabase for authentication. If there are issues with Supabase:
1. Check the browser console for Supabase-related errors
2. Verify that the Supabase URL and anon key are correctly configured in the HTML files
3. Check that the Supabase project is active and accessible

### Check JavaScript Files
If JavaScript files are not loading:
1. Check the Network tab for failed JavaScript requests
2. Verify that all required JavaScript files exist in the `assets/js` directory
3. Check the browser console for JavaScript errors

## Fallback Solutions

If you continue to experience issues:

### 1. Use Direct File Access
Instead of running a server, you can try opening the files directly in your browser:
1. Navigate to your project directory
2. Open `public/index.html` directly in your browser
3. Note: Some features may not work due to browser security restrictions

### 2. Try a Different Port
If port 8086 is already in use:
1. Stop the current server (Ctrl+C)
2. Try running the server on a different port:
   ```
   python -m http.server 8087
   ```
3. Access the application at `http://localhost:8087`

### 3. Check Firewall/Antivirus
Some firewall or antivirus software may block local servers:
1. Check if your firewall is blocking Python or the server
2. Try temporarily disabling firewall/antivirus to test

## Contact Support

If you're still experiencing issues after trying all the above steps:
1. Take a screenshot of the error
2. Copy any error messages from the browser console
3. Note which steps you've already tried
4. Contact support with this information

## Quick Fix Commands

To restart the server:
```bash
cd c:\Users\jmangawang\Documents\mci-delivery-tracker\public
python -m http.server 8086
```

To test if the server is working:
```bash
curl http://localhost:8086/test-server.html
```