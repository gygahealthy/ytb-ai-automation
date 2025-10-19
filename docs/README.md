# VEO3 Automation Documentation

**Last Updated**: October 20, 2025  
**Status**: ✅ Production Ready

Repository: `veo3-automation` (local workspace name)

---

## 📚 Quick Navigation

### For New Developers

1. Read **Project Architecture** (below)
2. Check **IPC API Reference** (below)
3. Review **Copilot Instructions** in `.github/copilot-instructions.md`

### For Specific Tasks

- **Building Features**: See "Code Quality Standards" section
- **Database Operations**: See "Database Rules" section
- **IPC Communication**: See "IPC Handlers" section
- **Debugging**: See "IPC Event Debugging" section

---

## 🏗️ Project Architecture

### Simplified Structure

```
src/
├── main/                      # Electron Main Process
│   ├── main.ts               # Electron entry point
│   ├── preload.ts            # IPC bridge
│   ├── handlers/             # IPC command handlers
│   ├── modules/              # Feature modules
│   │   ├── ai-video-creation/
│   │   ├── channel-management/
│   │   ├── master-prompt-management/
│   │   ├── profile-management/
│   │   └── ...
│   └── storage/              # Database & repositories
│       ├── database.ts
│       ├── migrations/
│       └── repositories/
│
├── renderer/                  # React Frontend (UI)
│   ├── components/           # UI components
│   ├── pages/                # Page components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── store/                # State management
│   └── ipc/                  # IPC client methods
│
└── shared/                    # Shared types & utilities
    ├── types/
    └── utils/
```

### Architecture Flow

```
User Action (React)
    ↓
IPC Call (preload.ts)
    ↓
IPC Handler (main/handlers/)
    ↓
Service Layer (modules/*/services/)
    ↓
Repository Layer (storage/repositories/)
    ↓
SQLite Database
```

### Key Principles

✅ **Clean Separation**: Main process, renderer, and business logic are separate  
✅ **Repository Pattern**: Always use repositories for data access  
✅ **Service Layer**: Services contain business logic, call repositories  
✅ **TypeScript Strict Mode**: All code uses strict types  
✅ **Error Handling**: Try-catch blocks with proper error responses  
✅ **API Response Pattern**: All service methods return `ApiResponse<T>`

---

## 🗄️ Database Rules (MANDATORY)

### ✅ CORRECT Pattern

```typescript
// Use repositories for data access
const user = await profileRepository.findById(1);
const users = await profileRepository.findAll();
```

### ❌ WRONG Pattern

```typescript
// NEVER bypass repositories
const users = await database.query("SELECT * FROM profiles");
const connection = sqlite3.open(":memory:");
```

### Available Repositories

- `profileRepository` - Profile management
- `automationRepository` - Automation tasks
- `veo3ProjectRepository` - VEO3 projects
- `youtubeChannelRepository` - YouTube channels
- `videoAnalysisRepository` - Video analysis
- `masterPromptsRepository` - Master prompts

---

## 📡 IPC Handlers Reference

### Master Prompt Handlers

#### `master-prompts:getAll`

Get all active master prompts.

```typescript
electronApi.send("master-prompts:getAll", {});
// Returns: ApiResponse<MasterPrompt[]>
```

#### `master-prompts:getById`

Get single prompt by ID.

```typescript
electronApi.send("master-prompts:getById", { id: 1 });
```

#### `master-prompts:getByType` ⭐ NEW

Get prompts by type (script, topic, video_prompt, audio_prompt).

```typescript
electronApi.send("master-prompts:getByType", { promptType: "script" });
```

#### `master-prompts:getByChannel` ⭐ NEW

Get channel-specific prompts.

```typescript
electronApi.send("master-prompts:getByChannel", {
  channelId: "tech-channel-001",
  promptType: "script", // optional
});
```

#### `master-prompts:getGlobalPrompts` ⭐ NEW

Get global prompts (not linked to channel).

```typescript
electronApi.send("master-prompts:getGlobalPrompts", { promptType: "script" });
```

#### `master-prompts:create`

Create new master prompt.

```typescript
electronApi.send("master-prompts:create", {
  input: {
    provider: "openai",
    promptKind: "generate_topic",
    promptType: "topic",
    title: "Topic Generator",
    systemPrompt: "...",
    // ... other fields
  },
});
```

#### `master-prompts:update`

Update existing prompt.

```typescript
electronApi.send("master-prompts:update", {
  id: 1,
  updates: { title: "Updated Title" },
});
```

### Video Generation Handlers

#### `veo3:generateVideos`

Create videos from prompts.

#### `veo3:getVideoHistory`

Get paginated video history.

```typescript
electronApi.send("veo3:getVideoHistory", {
  page: 1,
  pageSize: 20,
  filter: {
    status: "completed",
    startDate: "2025-10-01",
    endDate: "2025-10-13",
  },
});
```

#### `veo3:getVideoHistoryGroupedByDate`

Get videos grouped by date.

---

## 🔍 IPC Event Debugging

### Backend Broadcasting Events

The backend broadcasts real-time updates via `win.webContents.send()`:

```
veo3:generation:status          - Video status updates
veo3:multipleVideos:progress    - Batch progress updates
veo3:batch:started              - Batch start notifications
```

### Listening to Events

```typescript
// In React component
useEffect(() => {
  const unsubscribe = (window as any).electronAPI.on(
    "veo3:generation:status",
    (data) => {
      console.log("Status update:", data);
      // Handle update
    }
  );
  return () => unsubscribe?.();
}, []);
```

### Debugging Checklist

1. ✅ Check browser console (F12) for event logs
2. ✅ Check backend terminal for broadcast logs
3. ✅ Verify event names match exactly
4. ✅ Confirm listener is registered before event is sent
5. ✅ Validate data structure matches expectations

---

## 💻 Code Quality Standards

### TypeScript

- Always use **strict mode**
- Define explicit types for all function parameters and return values
- Avoid `any` type (document reasoning if used)
- Follow existing code patterns in the project

### Error Handling

```typescript
try {
  const result = await repository.findById(id);
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed", error);
  return { success: false, error: error.message };
}
```

### Service Pattern

```typescript
class UserService {
  constructor(private repository: UserRepository) {}

  async getUser(id: number): Promise<ApiResponse<User>> {
    try {
      const user = this.repository.findById(id);
      return { success: !!user, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### Before Completing Tasks

1. ✅ Run linter: `npm run lint`
2. ✅ Build project: `npm run build`
3. ✅ (Optional) Build the Electron main bundle: `npm run build:electron`
4. ✅ Fix any TypeScript errors reported by the build step
5. ✅ Verify no console errors/warnings when running the app

---

## 📋 Common File Locations

| Task                   | File                                            |
| ---------------------- | ----------------------------------------------- |
| Add IPC handler        | `src/main/modules/*/handlers/registrations.ts`  |
| Create service         | `src/main/modules/*/services/*.service.ts`      |
| Create repository      | `src/main/storage/repositories/*.repository.ts` |
| Add database table     | `src/main/storage/migrations/*.sql`             |
| Create React component | `src/renderer/components/*/Component.tsx`       |
| Create React page      | `src/renderer/pages/*/Page.tsx`                 |
| Add types              | `src/shared/types/*.ts`                         |
| Call IPC from renderer | `src/renderer/ipc/*.ts`                         |

---

## 🚀 TypeScript Types

### ApiResponse Pattern

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Master Prompt Types

```typescript
enum PromptType {
  SCRIPT = "script", // Script generation
  TOPIC = "topic", // Topic generation
  VIDEO_PROMPT = "video_prompt", // Video creation prompts
  AUDIO_PROMPT = "audio_prompt", // Audio generation
}

interface MasterPrompt {
  id?: number;
  provider: string;
  promptKind: string;
  promptType: PromptType; // ⭐ NEW
  title: string;
  systemPrompt: string;
  exampleInput?: string;
  exampleOutput?: string;
  channelId?: string; // ⭐ NEW (optional)
  isActive: boolean;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 📝 Project Rules

For complete project rules and guidelines, see: `.github/copilot-instructions.md`

Key highlights:

- ❌ DO NOT create markdown files without explicit request
- ✅ Always follow repository pattern for data access
- ✅ Use `ApiResponse<T>` for all service returns
- ✅ Implement error handling with try-catch
- ✅ Log important operations using Logger utility

---

## ❓ Getting Help

1. Check this README first
2. Review `.github/copilot-instructions.md` for project standards
3. Look at similar implementations in the codebase
4. Check browser console (F12) for client-side errors
5. Check terminal for backend errors

---

### Try it (Windows / PowerShell)

These commands are tuned for Windows PowerShell (the primary dev environment used for this project). Run them from the repository root (for example: `C:\Users\<you>\Desktop\NOW_WORKING\VEO3-AUTO`).

1. Install dependencies:

```powershell
npm install
```

2. Development (starts Vite + TypeScript watch + Electron):

```powershell
npm run dev
```

3. Build (renderer + TypeScript) and then build main bundle:

```powershell
npm run build
npm run build:electron
```

4. Lint (errors on warnings):

```powershell
npm run lint
```

Notes:

- The `dev` script runs Vite and waits for the renderer to be available at http://localhost:5173 before launching Electron.
- The project uses native SQLite bindings; if you see native module errors after install, run `npm run rebuild` or let `postinstall` run `electron-rebuild`.
