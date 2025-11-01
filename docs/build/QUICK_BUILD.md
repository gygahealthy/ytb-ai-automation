# Quick Build Guide for macOS

## Prerequisites Check

```bash
# Verify you have the required tools
node --version          # Should be v18 or higher
npm --version           # Should be v9 or higher
xcode-select -p         # Should show Xcode path
```

## Build Commands

### Option 1: Use the Build Script (Recommended)

```bash
# For current architecture only (faster)
./build-macos.sh

# For universal binary (Intel + Apple Silicon)
./build-macos.sh --universal
```

### Option 2: Use npm Commands

```bash
# For current architecture
npm run package:mac

# For universal binary
npm run package:mac:universal
```

## What Gets Built

- **DMG File**: Disk image installer (double-click to install)
- **ZIP File**: Zipped app bundle (extract and copy to Applications)

Both files will be in the `release/` directory.

## Installation

1. Open the `.dmg` file
2. Drag "VEO3 Automation" to Applications
3. Eject the disk image
4. Open from Applications

## First-Time Security

macOS may show "App can't be opened because it is from an unidentified developer."

**Fix:**

1. Right-click the app in Applications
2. Click "Open"
3. Click "Open" in the security dialog

Or:

```bash
# Remove quarantine attribute
sudo xattr -cr /Applications/VEO3\ Automation.app
```

## Troubleshooting

### Build fails with "cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### SQLite3 errors

```bash
npm rebuild sqlite3 --build-from-source
```

### Electron rebuild issues

```bash
npm run rebuild
```

## Build Artifacts

After successful build, you'll find in `release/`:

- `VEO3 Automation-1.0.0-arm64.dmg` (Apple Silicon)
- `VEO3 Automation-1.0.0-x64.dmg` (Intel)
- `VEO3 Automation-1.0.0-universal.dmg` (Both, if using --universal)
- Corresponding `.zip` files

## System Requirements

- macOS 11.0 (Big Sur) or later
- 4 GB RAM minimum
- 200 MB disk space

## Distribution

### For yourself:

Just use the DMG file directly.

### For others:

Share the DMG file. Recipients will need to:

1. Allow apps from unidentified developers in Security & Privacy settings
2. Or you'll need to code-sign and notarize (requires Apple Developer account)

## Code Signing (For Public Distribution)

If you have an Apple Developer account:

1. Install your Developer ID certificate
2. Set environment variables:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export CSC_NAME="Developer ID Application: Your Name"
   ```
3. Build normally - electron-builder will auto-sign and notarize

## File Size

Expect final DMG to be around 200-400 MB due to:

- Electron framework
- Chromium
- Node.js runtime
- Puppeteer/Chrome
- Your app code

## Next Steps

See `BUILD_MACOS.md` for detailed documentation.
