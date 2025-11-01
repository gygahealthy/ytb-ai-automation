# Build Documentation

Complete documentation for building VEO3 Automation for macOS.

## 📚 Documentation Index

### Getting Started

1. **[Quick Build Reference](QUICK_BUILD.md)** - Fast reference for building
2. **[Installation Guide](INSTALL_MACOS.md)** - How to install the built app

### Comprehensive Guides

3. **[macOS Build Guide](BUILD_MACOS.md)** - Complete build documentation
4. **[Build Summary](BUILD_SUMMARY.md)** - Build artifacts and features overview

### Troubleshooting

5. **[SQLite3 Build Info](SQLITE3_BUILD_INFO.md)** - Understanding sqlite3 warnings
6. **[Build Warnings Explained](BUILD_WARNINGS_EXPLAINED.md)** - Detailed warning explanations

---

## 🚀 Quick Start

### For Your First Build

**1. Build the app:**

```bash
./scripts/build/build-macos.sh
```

**2. Verify the build:**

```bash
./scripts/build/verify-build.sh
```

**3. Install:**

```bash
open release/VEO3\ Automation-1.0.0-arm64.dmg  # Apple Silicon
open release/VEO3\ Automation-1.0.0.dmg        # Intel
```

---

## 📋 Build Outputs

After building, you'll find these files in the `release/` directory:

### For Apple Silicon (M1, M2, M3, M4)

- `VEO3 Automation-1.0.0-arm64.dmg` (111 MB) - DMG installer
- `VEO3 Automation-1.0.0-arm64-mac.zip` (107 MB) - ZIP archive

### For Intel Macs

- `VEO3 Automation-1.0.0.dmg` (116 MB) - DMG installer
- `VEO3 Automation-1.0.0-mac.zip` (112 MB) - ZIP archive

**Which one to use?** See [INSTALL_MACOS.md](INSTALL_MACOS.md)

---

## ⚠️ Common Questions

### "I see warnings during build"

**Normal!** See [SQLITE3_BUILD_INFO.md](SQLITE3_BUILD_INFO.md) for details.

### "The build took a long time"

**Expected.** First build compiles native modules. Subsequent builds are faster.

### "App won't open - security warning"

**Normal for unsigned apps.** See [INSTALL_MACOS.md](INSTALL_MACOS.md#first-time-security) for solution.

### "How do I create a universal binary?"

```bash
./scripts/build/build-macos.sh --universal
```

---

## 🔧 System Requirements

- **macOS**: 11.0 (Big Sur) or later
- **Node.js**: 18.0+
- **Xcode Command Line Tools**: `xcode-select --install`
- **Disk Space**: ~500 MB for build process

---

## 📖 Documentation Guide

### New to Building?

Start here → [Quick Build Reference](QUICK_BUILD.md)

### Want All Details?

Read → [macOS Build Guide](BUILD_MACOS.md)

### Have Build Warnings?

Check → [Build Warnings Explained](BUILD_WARNINGS_EXPLAINED.md)

### Ready to Install?

See → [Installation Guide](INSTALL_MACOS.md)

### Understanding SQLite3?

Read → [SQLite3 Build Info](SQLITE3_BUILD_INFO.md)

---

## 🎯 Build Checklist

- [ ] System has macOS 11.0+
- [ ] Node.js 18+ installed
- [ ] Xcode Command Line Tools installed
- [ ] At least 500 MB free disk space
- [ ] Ran `npm install`
- [ ] Executed build script
- [ ] Verified build artifacts exist
- [ ] Tested installation

---

## 💡 Tips

### Speed Up Builds

- Don't clean `node_modules` unless necessary
- Use architecture-specific builds instead of universal
- Keep dependencies up to date

### Distribution

- Share DMG files (easier for users)
- Include installation instructions
- Mention macOS 11.0+ requirement

### Code Signing (Optional)

For public distribution without security warnings:

1. Get Apple Developer account ($99/year)
2. Create Developer ID certificate
3. Sign and notarize the app

See [BUILD_MACOS.md](BUILD_MACOS.md#code-signing-optional) for details.

---

## 🔗 Related Resources

- [Build Scripts Documentation](../../scripts/build/README.md)
- [Main README](../../README.md)
- [Feature Documentation](../feature-note/)
- [Implementation Notes](../implement-note/)

---

**Need help?** Start with [QUICK_BUILD.md](QUICK_BUILD.md) for a fast overview!
