# VEO3 Automation

> An Electron-based desktop application for automating VEO3 profile creation and management using Puppeteer.

[![Electron](https://img.shields.io/badge/Electron-28.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![macOS](https://img.shields.io/badge/macOS-11.0+-success.svg)](https://www.apple.com/macos/)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## 📦 Build for macOS

```bash
# Build for your current architecture (Intel or Apple Silicon)
./scripts/build/build-macos.sh

# Build universal binary (both architectures)
./scripts/build/build-macos.sh --universal
```

📖 **See full build documentation**: [docs/build/](docs/build/)

## Features

- 🚀 **Automation Engine**: Powerful browser automation using Puppeteer
- 🎨 **Modern UI**: Beautiful admin interface with dark mode and customizable color schemes
- 📦 **Domain-Driven Design**: Clean architecture with separated concerns
- 🔧 **TypeScript**: Full type safety across the entire codebase
- 🎯 **Profile Management**: Create and manage multiple browser profiles
- 📊 **Dashboard**: Real-time monitoring of automation tasks
- ⚙️ **Settings**: Customizable theme and color schemes

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Lucide React** for icons
- **Vite** for fast development

### Backend

- **Electron** for desktop app framework
- **Puppeteer** for browser automation (lightweight alternative to Playwright)
- **TypeScript** for type safety
- **Domain-Driven Design** architecture

## Project Structure

```
veo3-automation/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Main process entry point
│   │   └── preload.ts          # Preload script for IPC
│   │
│   ├── renderer/                # React renderer process
│   │   ├── components/         # React components
│   │   │   ├── Sidebar.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AutomationPage.tsx
│   │   │   └── ProfilesPage.tsx
│   │   ├── store/              # State management
│   │   │   └── settings.store.ts
│   │   ├── App.tsx             # Main React component
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   ├── index.html          # HTML template
│   │   └── vite-env.d.ts       # Vite types
│   │
│   ├── domain/                  # Domain models and entities (DDD)
│   │   ├── automation/         # Automation domain
│   │   │   └── automation.entity.ts
│   │   └── profile/            # Profile domain
│   │       └── profile.entity.ts
│   │
│   ├── services/                # Business logic services
│   │   ├── browser.service.ts  # Puppeteer browser automation
│   │   ├── file.service.ts     # File operations
│   │   └── string.service.ts   # String utilities
│   │
│   ├── api/                     # API layer
│   │   └── controllers/        # API controllers
│   │       └── automation.controller.ts
│   │
│   └── common/                  # Common utilities
│       └── utils/              # Utility functions
│           ├── logger.util.ts
│           └── validation.util.ts
│
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
├── vite.config.ts
└── tailwind.config.js
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- macOS 11.0+ (for macOS builds)
- Xcode Command Line Tools (for native modules)

### Setup

1. **Clone and install:**

   ```bash
   git clone <repository-url>
   cd ytb-ai-automation
   npm install
   ```

2. **Development mode:**

   ```bash
   npm run dev
   ```

   Or use the convenience scripts:

   **macOS/Linux:**

   ```bash
   ./build-and-dev.sh    # Build and run dev server
   ./run-dev.sh          # Just run dev server
   ```

   **Windows PowerShell:**

   ```powershell
   .\build-and-dev.ps1   # Build and run dev server
   .\run-dev.ps1         # Just run dev server
   ```

3. **Build for production:**

   ```bash
   # macOS
   npm run package:mac

   # Or use the build script
   ./scripts/build/build-macos.sh
   ```

📖 **Detailed build guides**:

- [macOS Build Guide](docs/build/BUILD_MACOS.md)
- [Quick Build Reference](docs/build/QUICK_BUILD.md)
- [Build Summary](docs/build/BUILD_SUMMARY.md)
- [SQLite3 Info](docs/build/SQLITE3_BUILD_INFO.md)

## Development Scripts

### Core Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build entire application for production
- `npm run package` - Package app for distribution
- `npm run lint` - Run ESLint

### Development Only

- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron:watch` - Watch compile Electron main process
- `npm run dev:electron:run` - Run Electron process
- `npm run build:electron` - Build Electron main process

### macOS Packaging

- `npm run package:mac` - Build for current architecture
- `npm run package:mac:universal` - Build universal binary (Intel + Apple Silicon)

### Helper Scripts

### Helper Scripts

- `./build-and-dev.sh` - Build and run dev (macOS/Linux) ← **In root for easy access**
- `./build-and-dev.ps1` - Build and run dev (Windows) ← **In root for easy access**
- `./run-dev.sh` - Quick dev start (macOS/Linux) ← **In root for easy access**
- `./run-dev.ps1` - Quick dev start (Windows) ← **In root for easy access**
- `./scripts/build/build-macos.sh` - Automated macOS build
- `./scripts/build/verify-build.sh` - Verify build artifacts

### Utilities

- `npm run copy:sql` - Copy SQL schema to dist
- `npm run copy:assets` - Copy assets to dist
- `npm run copy:manifests` - Copy module manifests to dist
- `npm run rebuild` - Rebuild native modules (sqlite3)

## Features in Detail

### Automation Engine

- Execute complex browser automation workflows
- Support for multiple actions: click, type, navigate, wait, screenshot
- Real-time progress monitoring
- Error handling and logging

### Profile Management

- Create and manage browser profiles
- Configure proxies per profile
- Manage browser extensions
- Store profile-specific settings

### Settings

- **Theme**: Light/Dark mode
- **Color Schemes**: Blue, Purple, Green, Orange
- Persistent settings using localStorage

### Domain Services

#### Browser Service

- Launch headless/headful browsers
- Execute automation actions
- Manage browser lifecycle
- Take screenshots

#### File Service

- Read/write files
- JSON file operations
- Directory management
- File stats and operations

#### String Service

- String formatting utilities
- Case conversions (camelCase, snake_case, kebab-case)
- Slugify, truncate, sanitize
- Template string formatting

## API

### Automation API

```typescript
// Start automation
window.electronAPI.automation.start(config);

// Stop automation
window.electronAPI.automation.stop(taskId);

// Get task status
window.electronAPI.automation.status(taskId);

// List all tasks
window.electronAPI.automation.list();
```

### Settings API

```typescript
// Get settings
window.electronAPI.settings.get();

// Save settings
window.electronAPI.settings.save(settings);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Feature Documentation](docs/feature-note/) - Implementation notes for features
- [Feature Plans](docs/feature-plan/) - Planned features and roadmap
- [Implementation Notes](docs/implement-note/) - Technical implementation details
- [Build Documentation](docs/build/) - macOS build guides and troubleshooting
- [VEO3 APIs](docs/ve03-apis/) - VEO3 API documentation

## 🗂️ Project Structure

```
ytb-ai-automation/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── modules/            # Feature modules (DDD)
│   │   ├── storage/            # Database and migrations
│   │   ├── handlers/           # IPC handlers
│   │   └── utils/              # Main process utilities
│   ├── renderer/               # React application
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   └── store/              # State management
│   ├── core/                   # Core utilities
│   │   ├── ipc/                # IPC type definitions
│   │   └── logging/            # Logging utilities
│   └── shared/                 # Shared code
│       ├── types/              # Shared TypeScript types
│       └── constants/          # Shared constants
├── scripts/                    # Build and utility scripts
│   ├── build/                  # Build scripts
│   ├── copy-*/                 # Asset copy scripts
│   ├── debug/                  # Debug utilities
│   └── sync-db/                # Database sync tools
├── docs/                       # Documentation
│   ├── build/                  # Build documentation
│   ├── feature-note/           # Feature notes
│   ├── feature-plan/           # Feature plans
│   └── implement-note/         # Implementation notes
├── build/                      # Build configuration
│   └── entitlements.mac.plist  # macOS entitlements
└── release/                    # Build output (gitignored)
```

## License

MIT License - see LICENSE file for details

## Author

VEO3 Team

---

**Note**: This is an automation tool for VEO3. Please ensure you comply with the terms of service of any websites you automate.
