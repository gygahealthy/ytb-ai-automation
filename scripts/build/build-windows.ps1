#!/usr/bin/env pwsh

# Build script for Windows
# This script builds the VEO3 Automation app for Windows

$ErrorActionPreference = "Stop"

Write-Host "Building VEO3 Automation for Windows..." -ForegroundColor Cyan
Write-Host ""

# Check if we're on Windows
if ($IsLinux -or $IsMacOS) {
    Write-Host "Error: This script must be run on Windows" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "Dependencies already installed" -ForegroundColor Green
    Write-Host "Note: electron-builder will automatically rebuild native modules during packaging" -ForegroundColor Gray
}

# Clean previous builds (but not dist folder - we need it for packaging)
if (Test-Path "release") {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force release -ErrorAction Stop
    } catch {
        Write-Host "Warning: Could not clean release folder (files may be in use). Continuing anyway..." -ForegroundColor Yellow
    }
}

# Fix winCodeSign cache issue (symbolic link privilege error workaround)
Write-Host "Checking winCodeSign cache..." -ForegroundColor Yellow
$winCodeSignCache = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"

if (Test-Path "$winCodeSignCache\*.7z") {
    Write-Host "Found winCodeSign archive, extracting manually to avoid symbolic link errors..." -ForegroundColor Gray
    
    $archivePath = Get-ChildItem "$winCodeSignCache\*.7z" | Select-Object -First 1
    
    if ($archivePath) {
        $extractPath = Join-Path $winCodeSignCache "extracted"
        $sevenZipPath = ".\node_modules\7zip-bin\win\x64\7za.exe"
        
        if (Test-Path $sevenZipPath) {
            & $sevenZipPath x -aoa "$($archivePath.FullName)" "-o$extractPath" 2>&1 | Out-Null
            
            if (Test-Path $extractPath) {
                Remove-Item "$winCodeSignCache\*.7z" -Force -ErrorAction SilentlyContinue
                
                if (!(Test-Path "$winCodeSignCache\winCodeSign-2.6.0")) {
                    Move-Item $extractPath "$winCodeSignCache\winCodeSign-2.6.0" -Force
                    Write-Host "winCodeSign cache prepared successfully" -ForegroundColor Green
                } else {
                    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
                    Write-Host "winCodeSign cache already exists" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "Warning: 7zip not found in node_modules. Cache fix skipped." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "winCodeSign cache OK" -ForegroundColor Green
}

# Build the application
Write-Host "Building application..." -ForegroundColor Cyan
npm run build
npm run build:electron

# Package for Windows
Write-Host "Packaging for Windows..." -ForegroundColor Cyan
Write-Host "Creating unpacked application..." -ForegroundColor Gray

npx electron-builder --win --dir

if ($LASTEXITCODE -eq 0) {
    Write-Host "Creating NSIS installer..." -ForegroundColor Gray
    npx electron-builder --win nsis
} else {
    Write-Host "Error: Packaging failed" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "Build Complete!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output location: .\release" -ForegroundColor Cyan
    Write-Host ""
    
    # List output files
    if (Test-Path "release") {
        Write-Host "Unpacked Application:" -ForegroundColor Yellow
        if (Test-Path "release\win-unpacked\VEO3 Automation.exe") {
            Write-Host "  Location: release\win-unpacked\" -ForegroundColor White
            Write-Host "  Executable: VEO3 Automation.exe" -ForegroundColor White
            $unpackedSize = [math]::Round((Get-Item "release\win-unpacked\VEO3 Automation.exe").Length / 1MB, 2)
            Write-Host "  Size: $unpackedSize MB" -ForegroundColor White
        }
        Write-Host ""
        
        $exeFiles = Get-ChildItem -Path "release" -Filter "*.exe" -ErrorAction SilentlyContinue
        
        if ($exeFiles) {
            Write-Host "Windows Installer (NSIS):" -ForegroundColor Yellow
            $exeFiles | ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  File: $($_.Name)" -ForegroundColor White
                Write-Host "  Size: $size MB" -ForegroundColor White
                Write-Host "  Location: $($_.FullName)" -ForegroundColor White
            }
        } else {
            Write-Host "No installer files found" -ForegroundColor Gray
        }
    } else {
        Write-Host "No release directory found" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Installation Notes:" -ForegroundColor Cyan
    Write-Host "  - The installer is NOT code-signed (requires admin rights to sign)" -ForegroundColor Gray
    Write-Host "  - Users may see a Windows SmartScreen warning on first run" -ForegroundColor Gray
    Write-Host "  - The unpacked version can be run directly without installation" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Red
    Write-Host "Build Failed!" -ForegroundColor Red
    Write-Host "======================================" -ForegroundColor Red
    exit 1
}
