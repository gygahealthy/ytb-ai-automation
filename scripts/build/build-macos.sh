#!/bin/bash

# Build script for macOS
# This script builds the VEO3 Automation app for macOS

set -e  # Exit on error

echo "🚀 Building VEO3 Automation for macOS..."
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "❌ Error: This script must be run on macOS"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "📦 Dependencies already installed"
  echo "   Note: electron-builder will automatically rebuild native modules during packaging"
fi

# Clean previous builds
if [ -d "release" ]; then
  echo "🧹 Cleaning previous builds..."
  rm -rf release
fi

if [ -d "dist" ]; then
  echo "🧹 Cleaning previous dist..."
  rm -rf dist
fi

# Build the application
echo "🏗️  Building application..."
npm run build
npm run build:electron

# Package for macOS
echo "📦 Packaging for macOS..."

# Check if --universal flag is passed
if [[ "$1" == "--universal" ]]; then
  echo "   Creating universal binary (Intel + Apple Silicon)..."
  npm run package:mac:universal
else
  echo "   Creating native binary for current architecture..."
  npm run package:mac
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Output location: ./release"
echo ""
ls -lh release/*.dmg 2>/dev/null || echo "   No DMG files found"
ls -lh release/*.zip 2>/dev/null || echo "   No ZIP files found"
echo ""
echo "💡 To install: Open the .dmg file and drag the app to Applications"
echo ""
