# PowerShell script to clear browser caches and service workers

Write-Host "Clearing browser caches and service workers..." -ForegroundColor Green

# Function to kill browser processes
function Stop-Browsers {
    Write-Host "Closing browser processes..." -ForegroundColor Yellow
    Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process firefox -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Function to clear Chrome cache
function Clear-ChromeCache {
    Write-Host "Clearing Chrome cache..." -ForegroundColor Yellow
    $chromePaths = @(
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache2",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\GPUCache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker"
    )
    
    foreach ($path in $chromePaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "Cleared: $path" -ForegroundColor Cyan
            } catch {
                Write-Host "Failed to clear: $path" -ForegroundColor Red
            }
        }
    }
}

# Function to clear Edge cache
function Clear-EdgeCache {
    Write-Host "Clearing Edge cache..." -ForegroundColor Yellow
    $edgePaths = @(
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache2",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\GPUCache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker"
    )
    
    foreach ($path in $edgePaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "Cleared: $path" -ForegroundColor Cyan
            } catch {
                Write-Host "Failed to clear: $path" -ForegroundColor Red
            }
        }
    }
}

# Main execution
Stop-Browsers
Clear-ChromeCache
Clear-EdgeCache

Write-Host "Cache clearing completed!" -ForegroundColor Green
Write-Host "You can now restart your browser and the application." -ForegroundColor Yellow

# Keep window open
Read-Host "Press Enter to exit"