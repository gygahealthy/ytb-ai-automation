# Project Structure

This document provides an overview of the VEO3 Automation project organization.

## 📂 Root Directory

```
ytb-ai-automation/
├── 📄 README.md                    # Main project documentation
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 📄 package.json                 # Project configuration & dependencies
├── 📄 .gitignore                   # Git ignore patterns
│
├── 🚀 Development Scripts (Quick Access)
│   ├── build-and-dev.sh            # Build & run dev (macOS/Linux)
│   ├── build-and-dev.ps1           # Build & run dev (Windows)
│   ├── run-dev.sh                  # Quick dev start (macOS/Linux)
│   └── run-dev.ps1                 # Quick dev start (Windows)
│
├── 🔧 TypeScript Configuration
│   ├── tsconfig.json               # Renderer (React) TS config
│   ├── tsconfig.electron.json      # Main process TS config
│   └── tsconfig.node.json          # Node.js TS config
│
├── 🎨 Build & Style Configuration
│   ├── vite.config.ts              # Vite bundler config
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config
│   └── .eslintrc.cjs               # ESLint config
│
├── 📂 src/                         # Application source code
├── 📂 docs/                        # Documentation
├── 📂 scripts/                     # Build & utility scripts
├── 📂 build/                       # Build configuration
│
└── 📂 Generated (gitignored)
    ├── node_modules/               # Dependencies
    ├── dist/                       # Compiled code
    └── release/                    # Built installers
```

---

## 📂 Source Code (`src/`)

```
src/
├── main/                           # Electron Main Process
│   ├── main.ts                     # Entry point
│   ├── preload.ts                  # Preload script (IPC bridge)
│   ├── modules/                    # Feature modules (DDD architecture)
│   │   ├── profile-management/
│   │   ├── gemini-apis/
│   │   ├── ai-video-creation/
│   │   └── common/
│   ├── storage/                    # Database & migrations
│   │   ├── sqlite-database.ts
│   │   ├── schema.sql
│   │   └── migrations/
│   ├── handlers/                   # IPC handlers
│   └── utils/                      # Main process utilities
│
├── renderer/                       # React Renderer Process
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root component
│   ├── index.html                  # HTML template
│   ├── components/                 # React components
│   ├── pages/                      # Page components
│   ├── contexts/                   # React contexts
│   ├── hooks/                      # Custom React hooks
│   ├── store/                      # State management (Zustand)
│   ├── assets/                     # Images, icons, etc.
│   └── utils/                      # Renderer utilities
│
├── core/                           # Core Utilities
│   ├── ipc/                        # IPC type definitions
│   └── logging/                    # Logging utilities
│
├── shared/                         # Shared Code
│   ├── types/                      # Shared TypeScript types
│   ├── constants/                  # Shared constants
│   └── utils/                      # Shared utilities
│
└── platform/                       # Platform-specific code
    └── windows/                    # Windows-specific features
```

---

## 📂 Documentation (`docs/`)

```
docs/
├── README.md                       # Docs overview
│
├── build/                          # Build Documentation
│   ├── README.md                   # Build docs index
│   ├── BUILD_MACOS.md              # Complete macOS build guide
│   ├── QUICK_BUILD.md              # Quick reference
│   ├── BUILD_SUMMARY.md            # Build artifacts summary
│   ├── INSTALL_MACOS.md            # Installation guide
│   ├── SQLITE3_BUILD_INFO.md       # SQLite3 build info
│   └── BUILD_WARNINGS_EXPLAINED.md # Detailed warnings guide
│
├── feature-note/                   # Feature Implementation Notes
│   ├── cookie-rotation/
│   ├── flow-veo3-settings/
│   ├── gemini-chat/
│   └── video-creation/
│
├── feature-plan/                   # Feature Plans & Roadmap
│   ├── Cookie-Extraction-Service-Plan.md
│   └── Video-Download-Worker-Implementation.md
│
├── implement-note/                 # Implementation Details
│   ├── MACOS_BROWSER_SUPPORT.md
│   ├── MODEL_SETTINGS_IMPLEMENTATION.md
│   └── WORKER_THREAD_SINGLETON_PATTERN.md
│
└── ve03-apis/                      # VEO3 API Documentation
    ├── general-info/
    ├── image-related/
    └── video-generate/
```

---

## 📂 Scripts (`scripts/`)

```
scripts/
├── build/                          # Build Scripts
│   ├── README.md                   # Build scripts documentation
│   ├── build-macos.sh              # Main macOS build script
│   └── verify-build.sh             # Build verification script
│
│   Note: Dev scripts (build-and-dev.*, run-dev.*) are in project root
│
├── copy-sql/                       # SQL Schema Copy
│   └── copy-sql.js
│
├── copy-assets/                    # Assets Copy
│   └── copy-assets.js
│
├── copy-manifests/                 # Module Manifests Copy
│   └── copy-manifests.js
│
├── sync-db/                        # Database Sync
│   └── sync-media-generation-ids.js
│
└── debug/                          # Debug Utilities
    ├── check-chrome.js
    ├── debug-module-loader.js
    └── test-*.js
```

---

## 📂 Build Configuration (`build/`)

```
build/
└── entitlements.mac.plist          # macOS app entitlements
```

---

## 🎯 Key Files

### Essential Configuration

- **package.json** - Dependencies, scripts, and build config
- **tsconfig.json** - TypeScript compiler settings
- **vite.config.ts** - Frontend build configuration
- **.gitignore** - Files to exclude from Git

### Entry Points

- **src/main/main.ts** - Electron main process entry
- **src/renderer/main.tsx** - React app entry
- **src/main/preload.ts** - IPC bridge

### Build Outputs

- **dist/** - Compiled TypeScript (gitignored)
- **release/** - Built installers (gitignored)

---

## 🔑 Important Paths

### Database

- Schema: `src/main/storage/schema.sql`
- Migrations: `src/main/storage/migrations/modules/`
- Runtime DB: User's home directory (set by Electron)

### IPC Communication

- Types: `src/core/ipc/types.ts`
- Preload: `src/main/preload.ts`
- Handlers: `src/main/modules/*/handlers/`

### Module System

- Modules: `src/main/modules/`
- Manifests: `src/main/modules/*/manifest.json`
- Loader: `src/main/modules/module-loader.ts`

---

## 📝 File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `ProfileCard.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: `camelCase.ts` (e.g., `userTypes.ts`)
- **Pages**: `PascalCase.tsx` (e.g., `DashboardPage.tsx`)
- **Constants**: `SCREAMING_SNAKE_CASE` or `camelCase.ts`
- **Configs**: `kebab-case.js` (e.g., `vite.config.ts`)

---

## 🚀 Getting Around

### To find...

**React components**: `src/renderer/components/`  
**Feature modules**: `src/main/modules/`  
**Database code**: `src/main/storage/`  
**Build scripts**: `scripts/build/`  
**Documentation**: `docs/`  
**Type definitions**: `src/*/types/` or `src/shared/types/`  
**IPC handlers**: `src/main/modules/*/handlers/`

---

## 🔄 Build Flow

```
npm run package:mac
    ↓
1. TypeScript compilation (src/ → dist/)
2. Vite build (renderer)
3. Copy assets, SQL, manifests
4. electron-builder packages
5. Create DMG & ZIP
    ↓
release/VEO3 Automation-1.0.0-{arch}.dmg
```

---

## 📚 Documentation Hierarchy

1. **Start**: [README.md](../README.md)
2. **Build**: [docs/build/README.md](docs/build/README.md)
3. **Features**: [docs/feature-note/](docs/feature-note/)
4. **Implementation**: [docs/implement-note/](docs/implement-note/)
5. **Scripts**: [scripts/build/README.md](scripts/build/README.md)

---

**This structure follows Domain-Driven Design principles with clear separation between:**

- 🖥️ Main process (backend logic)
- 🎨 Renderer process (React UI)
- 📦 Modules (isolated features)
- 🔧 Core utilities (shared foundation)
- 📚 Documentation (organized by purpose)
