# Build Scripts

This directory contains scripts for building the VEO3 Automation application.

> **Note:** Development scripts (`build-and-dev.sh`, `run-dev.sh`, etc.) are in the **project root** for easy access during development.

## 📁 Files

### macOS Build Scripts

#### `build-macos.sh`

Main build script for creating macOS installers.

**Usage:**

```bash
# Build for current architecture (Intel or Apple Silicon)
./scripts/build/build-macos.sh

# Build universal binary (both architectures)
./scripts/build/build-macos.sh --universal
```

**What it does:**

1. Checks system requirements
2. Installs dependencies if needed
3. Cleans previous builds
4. Builds the application
5. Packages as DMG and ZIP

**Output:** `release/` directory with DMG and ZIP files

---

#### `verify-build.sh`

Verifies build artifacts and shows system compatibility.

**Usage:**

```bash
./scripts/build/verify-build.sh
```

**What it checks:**

- Your Mac's architecture (Intel vs Apple Silicon)
- macOS version compatibility
- Build artifacts existence
- Recommends correct installer for your system

---

## Development Scripts (Located in Root)

The following scripts are in the **project root directory** for convenient access during development:

### `build-and-dev.sh` / `build-and-dev.ps1`

Convenience scripts for development workflow.

**Usage:**

```bash
./build-and-dev.sh        # macOS/Linux
.\build-and-dev.ps1       # Windows
```

**What it does:**

1. Builds Electron main process
2. Starts Vite dev server
3. Launches Electron with hot reload

---

### `run-dev.sh` / `run-dev.ps1`

Quick start scripts for development mode.

**Usage:**

```bash
./run-dev.sh              # macOS/Linux
.\run-dev.ps1             # Windows
```

Runs `npm run dev` with proper environment setup.

---

## 🚀 Quick Reference

### First Time Build

```bash
# 1. Install dependencies
npm install

# 2. Build for macOS
./scripts/build/build-macos.sh

# 3. Verify the build
./scripts/build/verify-build.sh

# 4. Install
open release/VEO3\ Automation-1.0.0-arm64.dmg  # Apple Silicon
open release/VEO3\ Automation-1.0.0.dmg        # Intel
```

### Development Workflow

```bash
# Quick start dev server (from project root)
./run-dev.sh

# Or full build + dev (from project root)
./build-and-dev.sh
```

### Rebuild After Changes

```bash
# Rebuild native modules
npm run rebuild

# Full rebuild and package
./scripts/build/build-macos.sh
```

---

## 🔧 Script Requirements

### System Requirements

- **macOS**: 11.0 (Big Sur) or later
- **Node.js**: 18.0 or later
- **Xcode Command Line Tools**: Required for native module compilation

### Install Xcode Tools

```bash
xcode-select --install
```

---

## 📝 Notes

### About Native Modules

The build process compiles sqlite3 from source if prebuilt binaries aren't available. This is normal and expected - see [SQLite3 Build Info](../../docs/build/SQLITE3_BUILD_INFO.md) for details.

### Build Warnings

Warnings during build about N-API versions are informational only. See [Build Warnings Explained](../../docs/build/BUILD_WARNINGS_EXPLAINED.md) for detailed explanations.

### Universal Builds

Universal builds contain both Intel and Apple Silicon binaries, making them larger (~230 MB) but compatible with all modern Macs.

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clean and retry
rm -rf node_modules dist release
npm install
./scripts/build/build-macos.sh
```

### SQLite3 Errors

```bash
# Rebuild native modules
npm rebuild sqlite3 --build-from-source
```

### Permission Denied

```bash
# Make scripts executable
chmod +x scripts/build/*.sh
```

---

## 📚 Related Documentation

- [macOS Build Guide](../../docs/build/BUILD_MACOS.md) - Complete build documentation
- [Quick Build Reference](../../docs/build/QUICK_BUILD.md) - Fast reference guide
- [Build Summary](../../docs/build/BUILD_SUMMARY.md) - Build artifacts summary
- [Installation Guide](../../docs/build/INSTALL_MACOS.md) - How to install the built app

---

**Tip**: All scripts should be run from the project root directory, not from the scripts/build/ directory.

```bash
# ✅ Correct
./scripts/build/build-macos.sh

# ❌ Incorrect
cd scripts/build
./build-macos.sh
```
