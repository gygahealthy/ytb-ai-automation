#!/bin/bash

# Build and Dev Script for macOS/Linux
# This script builds the Electron main process and then starts the dev server

set -e  # Exit on error

echo "======================================"
echo "🔨 Building Electron main process..."
echo "======================================"
npm run build:electron

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Build completed successfully!"
    echo "======================================"
    echo ""
    echo "======================================"
    echo "🚀 Starting development server..."
    echo "======================================"
    npm run dev
else
    echo ""
    echo "======================================"
    echo "❌ Build failed! Not starting dev server."
    echo "======================================"
    exit 1
fi
