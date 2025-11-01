#!/bin/bash

# Verification script for macOS build

echo "🔍 VEO3 Automation - Build Verification"
echo "========================================"
echo ""

# Check current architecture
ARCH=$(uname -m)
echo "Your Mac architecture: $ARCH"
if [[ "$ARCH" == "arm64" ]]; then
    echo "   You should use: VEO3 Automation-1.0.0-arm64.dmg"
    RECOMMENDED_DMG="VEO3 Automation-1.0.0-arm64.dmg"
else
    echo "   You should use: VEO3 Automation-1.0.0.dmg"
    RECOMMENDED_DMG="VEO3 Automation-1.0.0.dmg"
fi
echo ""

# Check macOS version
OS_VERSION=$(sw_vers -productVersion)
echo "Your macOS version: $OS_VERSION"
MAJOR_VERSION=$(echo $OS_VERSION | cut -d. -f1)
if [[ $MAJOR_VERSION -ge 11 ]]; then
    echo "   ✅ Compatible (requires macOS 11.0+)"
else
    echo "   ❌ Not compatible (requires macOS 11.0+, you have $OS_VERSION)"
fi
echo ""

# Check if release directory exists
if [[ ! -d "release" ]]; then
    echo "❌ Release directory not found!"
    echo "   Run: npm run package:mac"
    exit 1
fi

echo "📦 Build Artifacts:"
echo "-------------------"
cd release

# List DMG files
if ls *.dmg 1> /dev/null 2>&1; then
    for dmg in *.dmg; do
        if [[ "$dmg" == "$RECOMMENDED_DMG" ]]; then
            echo "   ⭐ $dmg ($(du -h "$dmg" | cut -f1)) <- Recommended for your Mac"
        else
            echo "      $dmg ($(du -h "$dmg" | cut -f1))"
        fi
    done
else
    echo "   ❌ No DMG files found!"
fi

echo ""

# List ZIP files
if ls *.zip 1> /dev/null 2>&1; then
    echo "📎 ZIP Archives:"
    echo "-------------------"
    for zip in *.zip; do
        echo "   $zip ($(du -h "$zip" | cut -f1))"
    done
    echo ""
fi

# Check if app bundles exist
echo "🎯 App Bundles:"
echo "-------------------"
if [[ -d "mac/VEO3 Automation.app" ]]; then
    echo "   ✅ Intel build: mac/VEO3 Automation.app"
else
    echo "   ❌ Intel build not found"
fi

if [[ -d "mac-arm64/VEO3 Automation.app" ]]; then
    echo "   ✅ Apple Silicon build: mac-arm64/VEO3 Automation.app"
else
    echo "   ❌ Apple Silicon build not found"
fi

echo ""
echo "✅ Build verification complete!"
echo ""
echo "📖 Next Steps:"
echo "   1. Open: $RECOMMENDED_DMG"
echo "   2. Drag VEO3 Automation to Applications"
echo "   3. Right-click and select 'Open' (first time only)"
echo ""
echo "📚 Documentation:"
echo "   - Quick guide: QUICK_BUILD.md"
echo "   - Full guide: BUILD_MACOS.md"
echo "   - Summary: BUILD_SUMMARY.md"
echo ""
