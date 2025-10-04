# VEO3 Automation - Project Setup Guide

## Project Structure (Domain-Driven Design)

The project has been successfully reorganized with proper separation of concerns:

```
veo3-automation/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── main.ts             # Electron entry point & IPC handlers
│   │   └── preload.ts          # Context bridge for renderer
│   │
│   ├── renderer/                # React Renderer Process (Frontend)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Sidebar.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── pages/              # Page-level components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AutomationPage.tsx
│   │   │   └── ProfilesPage.tsx
│   │   ├── store/              # State management (Zustand)
│   │   │   └── settings.store.ts
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles (Tailwind)
│   │   ├── index.html          # HTML template
│   │   ├── vite-env.d.ts       # Vite type definitions
│   │   ├── tailwind.config.js  # Tailwind configuration
│   │   └── postcss.config.js   # PostCSS configuration
│   │
│   ├── domain/                  # Domain Layer (DDD)
│   │   ├── automation/         # Automation domain entities
│   │   │   └── automation.entity.ts
│   │   └── profile/            # Profile domain entities
│   │       └── profile.entity.ts
│   │
│   ├── services/                # Application Services Layer
│   │   ├── browser.service.ts  # Puppeteer automation service
│   │   ├── file.service.ts     # File system operations
│   │   └── string.service.ts   # String utility functions
│   │
│   ├── api/                     # API/Application Layer
│   │   └── controllers/        # Application controllers
│   │       └── automation.controller.ts
│   │
│   └── common/                  # Shared Utilities
│       └── utils/
│           ├── logger.util.ts
│           └── validation.util.ts
│
├── dist/                        # Build output (generated)
│   ├── main/                   # Compiled Electron main process
│   └── renderer/               # Compiled React app
│
├── package.json
├── tsconfig.json               # TypeScript config for renderer
├── tsconfig.electron.json      # TypeScript config for main process
├── tsconfig.node.json          # TypeScript config for Node tools
└── vite.config.ts              # Vite bundler configuration
```

## Fixes Applied

### 1. Fixed PostCSS Configuration Error

**Error**: `Unexpected token 'export'` in `postcss.config.js`

**Fix**: Changed from ES modules to CommonJS:

```javascript
// Before (ES modules)
export default { ... }

// After (CommonJS)
module.exports = { ... }
```

### 2. Fixed Tailwind Configuration

**Fix**: Moved `tailwind.config.js` and `postcss.config.js` to `src/renderer/` directory since Vite's root is set to `./src/renderer`.

Updated content paths to be relative to the renderer directory:

```javascript
content: ["./index.html", "./**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"];
```

### 3. Fixed Directory Structure

**Issue**: Nested duplicate directories from move operations

**Fix**: Removed nested `components/components/` and `store/store/` directories

### 4. Updated Vite Configuration

Set correct root and output directories:

```typescript
export default defineConfig({
  root: "./src/renderer", // Vite root is renderer folder
  build: {
    outDir: "../../dist/renderer", // Output to dist/renderer
    emptyOutDir: true,
  },
});
```

### 5. Updated TypeScript Configurations

**tsconfig.json** (Renderer):

```json
{
  "include": ["src/renderer"],
  "paths": {
    "@/*": ["./src/renderer/*"]
    // ... other aliases
  }
}
```

**tsconfig.electron.json** (Main Process):

```json
{
  "include": ["src/main/**/*", "src/domain/**/*", "src/services/**/*", "src/api/**/*"],
  "exclude": ["src/renderer/**/*"]
}
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This runs two processes concurrently:

1. **Vite Dev Server** (port 5173) - Hot-reload React frontend
2. **Electron** - Loads the frontend and provides desktop app wrapper

### Build for Production

```bash
npm run build          # Build React app
npm run build:electron # Build Electron main process
npm run package        # Package as desktop app
```

## Key Technologies

- **Electron**: Desktop app framework
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Puppeteer**: Browser automation (lightweight vs Playwright)
- **Lucide React**: Icon library

## Architecture Principles

### Domain-Driven Design (DDD)

- **Domain Layer**: Core business entities and logic
- **Application Layer**: Use cases and orchestration (API/Controllers)
- **Infrastructure Layer**: External services (browser, file system)
- **Presentation Layer**: UI components (React)

### Separation of Concerns

- **Main Process** (`src/main`): Electron backend, IPC handlers, system access
- **Renderer Process** (`src/renderer`): React frontend, UI components
- **Services**: Reusable business logic
- **Domain**: Pure business entities

### Communication Pattern

```
React Component → IPC (via preload) → Main Process → Services → Domain
```

## Development Workflow

1. **Start Development Server**: `npm run dev`
2. **Edit Frontend**: Changes in `src/renderer/` hot-reload instantly
3. **Edit Backend**: Changes in `src/main/` or services require restart
4. **Build**: `npm run build` for production bundle

## Next Steps

- Implement actual automation workflows
- Add profile management CRUD operations
- Integrate with VEO3 APIs
- Add task scheduling
- Implement logging and error handling
- Add unit tests

## Troubleshooting

### Port 5173 Already in Use

```bash
# Kill process on port 5173 (Windows)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### Module Resolution Issues

- Ensure all paths in `tsconfig.json` are correct
- Check imports use correct relative paths
- Verify Vite aliases match TypeScript paths

### Electron Not Opening

- Check that Vite dev server started successfully (port 5173)
- Verify `NODE_ENV=development` is set
- Check console for errors in `src/main/main.ts`
