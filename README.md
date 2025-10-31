# VEO3 Automation

https://github.com/hieu2906090/Gemini-API

An Electron-based desktop application for automating VEO3 profile creation and management using Puppeteer.

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

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run in development mode:**

   ```bash
   npm run dev
   ```

   Or use the convenience scripts:

   **macOS/Linux:**

   ```bash
   ./build-and-dev.sh
   ```

   **Windows PowerShell:**

   ```powershell
   .\build-and-dev.ps1
   ```

   These scripts will build the Electron main process and then start the dev server automatically.

3. **Build for production:**
   ```bash
   npm run build
   npm run package
   ```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron` - Start Electron in development mode
- `npm run build` - Build React app for production
- `npm run build:electron` - Build Electron main process
- `npm run package` - Package the app for distribution
- `npm run lint` - Run ESLint
- `./build-and-dev.sh` - (macOS/Linux) Build and run dev server
- `.\build-and-dev.ps1` - (Windows) Build and run dev server

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

## License

MIT License - see LICENSE file for details

## Author

VEO3 Team

---

**Note**: This is an automation tool for VEO3. Please ensure you comply with the terms of service of any websites you automate.
