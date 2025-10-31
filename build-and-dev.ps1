# Build and Dev Script for Windows PowerShell
# This script builds the Electron main process and then starts the dev server

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🔨 Building Electron main process..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Run build command
npm run build:electron

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    
    # Run dev server
    npm run dev
} else {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Red
    Write-Host "❌ Build failed! Not starting dev server." -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
    exit 1
}
