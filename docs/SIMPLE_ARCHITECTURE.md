# VEO3 Automation - Simple Architecture

## Simplified Project Structure

```
src/
├── main/                      # Electron Main Process
│   ├── main.ts               # Electron entry point
│   ├── preload.ts            # IPC bridge
│   └── ipc-handlers.ts       # All IPC command handlers
│
├── renderer/                  # React Frontend (UI)
│   ├── components/           # UI components
│   ├── pages/                # Page components
│   ├── store/                # State management
│   └── ...
│
├── services/                  # Business Logic Services
│   ├── automation.service.ts # Browser automation (Puppeteer)
│   ├── profile.service.ts    # Profile management
│   ├── veo3.service.ts       # VEO3 video creation
│   ├── youtube.service.ts    # YouTube analysis
│   └── api.service.ts        # API calls helper
│
├── storage/                   # JSON Database
│   ├── database.ts           # Simple JSON file database
│   └── models/               # Data models
│       ├── profile.model.ts
│       ├── automation.model.ts
│       ├── veo3-project.model.ts
│       └── youtube-channel.model.ts
│
├── types/                     # TypeScript Types
│   └── index.ts              # All type definitions
│
└── utils/                     # Utility Functions
    ├── file.util.ts          # File operations
    ├── string.util.ts        # String helpers
    └── logger.util.ts        # Logging
```

## Architecture Flow

```
User Action (React)
    ↓
IPC Call (preload.ts)
    ↓
IPC Handler (main/ipc-handlers.ts)
    ↓
Service (services/*.service.ts)
    ↓
Database/API/Browser (storage/database.ts or Puppeteer)
```

## Key Principles

1. **Keep It Simple**: No complex patterns, just straightforward code
2. **Service-Oriented**: Each service handles one domain (profiles, automation, etc.)
3. **JSON Storage**: Simple JSON files for data persistence
4. **Clear Separation**: Main process, renderer, and business logic are separate
5. **Easy to Understand**: Anyone can read and modify the code

## File Responsibilities

### Main Process (`src/main/`)

- **main.ts**: Start Electron, create window, register IPC handlers
- **preload.ts**: Expose safe APIs to renderer
- **ipc-handlers.ts**: Handle all IPC commands from renderer

### Services (`src/services/`)

- **automation.service.ts**: Browser automation using Puppeteer
- **profile.service.ts**: Manage browser profiles
- **veo3.service.ts**: Create VEO3 videos
- **youtube.service.ts**: Analyze YouTube channels/videos
- **api.service.ts**: Make HTTP API calls

### Storage (`src/storage/`)

- **database.ts**: Read/write JSON files
- **models/**: Define data structure for each entity

### Utils (`src/utils/`)

- Helper functions used across the app

## Data Storage

All data stored as JSON files in user's app data folder:

```
AppData/
  veo3-automation/
    ├── profiles.json
    ├── automation-tasks.json
    ├── veo3-projects.json
    └── youtube-channels.json
```

## Example Usage

```typescript
// In renderer (React component)
const result = await window.electronAPI.profile.create({
  name: "Profile 1",
  browserPath: "...",
});

// In main/ipc-handlers.ts
ipcMain.handle("profile:create", async (_, data) => {
  return await profileService.createProfile(data);
});

// In services/profile.service.ts
async createProfile(data) {
  const profile = { id: generateId(), ...data };
  await database.save("profiles", profile);
  return profile;
}

// In storage/database.ts
async save(collection, data) {
  const filePath = getFilePath(collection);
  await writeJSONFile(filePath, data);
}
```

## Benefits

✅ **Simple to understand**: No complex patterns or abstractions  
✅ **Easy to maintain**: Clear file structure and responsibilities  
✅ **Quick to modify**: Change one service without affecting others  
✅ **No over-engineering**: Just what you need, nothing more  
✅ **Fast development**: Write features quickly without boilerplate
