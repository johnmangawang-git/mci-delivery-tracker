# MCI Delivery Tracker - Project Cleanup Script
# Removes all debug, test, and development files while keeping production essentials

Write-Host "🧹 Starting MCI Delivery Tracker cleanup..." -ForegroundColor Green

# Define files to KEEP (production essentials)
$keepFiles = @(
    "README.md",
    "LICENSE", 
    "package.json",
    "package-lock.json",
    "server.js",
    ".gitignore",
    ".env",
    ".env.example",
    "start-dev.bat",
    "start-dev.sh",
    "netlify.toml",
    "favicon.ico"
)

# Define directories to KEEP
$keepDirs = @(
    "public",
    "node_modules",
    ".git",
    ".vscode"
)

# Get all files in root directory
$allFiles = Get-ChildItem -Path "." -File | Where-Object { $_.Name -notlike "cleanup-project.ps1" }
$allDirs = Get-ChildItem -Path "." -Directory

Write-Host "📊 Found $($allFiles.Count) files and $($allDirs.Count) directories" -ForegroundColor Yellow

# Remove files not in keep list
$removedFiles = 0
foreach ($file in $allFiles) {
    if ($file.Name -notin $keepFiles) {
        Write-Host "🗑️  Removing file: $($file.Name)" -ForegroundColor Red
        Remove-Item $file.FullName -Force
        $removedFiles++
    } else {
        Write-Host "✅ Keeping file: $($file.Name)" -ForegroundColor Green
    }
}

# Remove directories not in keep list
$removedDirs = 0
foreach ($dir in $allDirs) {
    if ($dir.Name -notin $keepDirs) {
        Write-Host "🗑️  Removing directory: $($dir.Name)" -ForegroundColor Red
        Remove-Item $dir.FullName -Recurse -Force
        $removedDirs++
    } else {
        Write-Host "✅ Keeping directory: $($dir.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Cleanup completed!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   - Files removed: $removedFiles" -ForegroundColor Red
Write-Host "   - Directories removed: $removedDirs" -ForegroundColor Red
Write-Host "   - Files kept: $($keepFiles.Count)" -ForegroundColor Green
Write-Host "   - Directories kept: $($keepDirs.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Your project is now clean and production-ready!" -ForegroundColor Green
Write-Host "🚀 Essential files preserved:" -ForegroundColor Cyan
foreach ($file in $keepFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    }
}

# Self-destruct this cleanup script
Write-Host ""
Write-Host "🗑️  Removing cleanup script..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Remove-Item "cleanup-project.ps1" -Force

Write-Host "✨ Cleanup complete! Your project is now clean and ready for production." -ForegroundColor Green