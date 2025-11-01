# Building for macOS

This guide explains how to build VEO3 Automation for macOS 11 (Big Sur) and above.

## Prerequisites

1. **macOS System**: You need to be running on macOS to build macOS apps
2. **Node.js**: Version 18 or higher
3. **Xcode Command Line Tools**: Install with `xcode-select --install`
4. **Dependencies**: Run `npm install` to install all required packages

## Build Commands

### Standard Build (Current Architecture)

```bash
npm run package:mac
```

This creates a DMG installer for your current architecture:

- On Intel Mac: x64 build
- On Apple Silicon Mac: arm64 build

### Universal Build (Both Intel and Apple Silicon)

```bash
npm run package:mac:universal
```

This creates a universal binary that works on both Intel and Apple Silicon Macs. **Note**: This takes longer and requires both architectures to be built.

### Build Output

After building, you'll find your installation files in the `release` directory:

- **VEO3 Automation-1.0.0-{arch}.dmg**: Disk image installer (recommended for distribution)
- **VEO3 Automation-1.0.0-mac.zip**: Zipped app bundle (for manual installation)

Where `{arch}` is:

- `x64` for Intel Macs
- `arm64` for Apple Silicon Macs
- `universal` for both architectures

## Installation

### For End Users

1. Download the `.dmg` file
2. Double-click to open
3. Drag the VEO3 Automation app to the Applications folder
4. Open from Applications folder

**Important**: On first launch, you may see a security warning. To open:

1. Right-click the app and select "Open"
2. Click "Open" in the security dialog
3. Or go to System Preferences > Security & Privacy and click "Open Anyway"

## Troubleshooting

### "App is damaged and can't be opened"

This happens because the app isn't code-signed. To fix:

```bash
# Remove quarantine attribute
xattr -cr /Applications/VEO3\ Automation.app
```

### Build Fails with Native Module Errors

Rebuild native modules:

```bash
npm run rebuild
```

### SQLite3 Issues

If you get sqlite3 errors:

```bash
npm rebuild sqlite3 --build-from-source
```

## Code Signing (Optional)

For production distribution, you should code-sign the app:

1. Get an Apple Developer account ($99/year)
2. Create a Developer ID Application certificate
3. Add to your environment or package.json:
   ```json
   "build": {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAM_ID)"
     }
   }
   ```

## Notarization (Optional)

For macOS 10.15+ without security warnings:

1. Code sign the app (see above)
2. Add Apple ID credentials:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   ```
3. Build with notarization:
   ```bash
   npm run package:mac
   ```

electron-builder will automatically notarize if credentials are present.

## System Requirements

- **Minimum**: macOS 11.0 (Big Sur)
- **Recommended**: macOS 12.0 (Monterey) or later
- **Architectures**: Intel (x64) and Apple Silicon (arm64)

## Distribution

### For Personal Use

Use the unsigned DMG file directly.

### For Public Distribution

1. Code sign the app
2. Notarize with Apple
3. Distribute the notarized DMG

### Via Direct Download

Upload the DMG to your website or GitHub releases.

### Via Homebrew Cask (Advanced)

Create a Homebrew cask formula for easier installation.
