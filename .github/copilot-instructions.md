# VS Code Copilot Custom Instructions (Project-tailored)

These instructions are tuned for the **VEO3 / ytb-ai-automation** Electron + React + TypeScript project. They guide AI code generation to align with the project's modular architecture, service boundaries, database patterns, and developer workflow.

## Project Overview

- **Desktop App**: Electron + React 18 + TypeScript (strict mode)
- **Architecture**: Feature modules with isolated domain services and repositories
- **Database**: SQLite with versioned migrations (not one-shot schema files)
- **Styling**: Tailwind CSS with dark mode support
- **Communication**: IPC via preload bridge (not direct `ipcRenderer`)

### Core Principles

1. Keep the main process minimal; push heavy work into modular services under `src/main/modules/`.
2. Repositories own all database access (no raw SQL in services or UI).
3. Migrations are applied incrementally in order; always register new migrations in `src/main/storage/migrations/index.ts`.
4. Renderer is React with functional components, context for shared state, and Tailwind utilities.

## Module Architecture (Critical Pattern)

Each feature lives as a **module** under `src/main/modules/<module-name>/` with a standard structure:

```
src/main/modules/gemini-apis/          # Example module
├── manifest.json                      # Module metadata (enable/disable)
├── index.ts                          # Module entry + optional registerModule()
├── handlers/
│   ├── registrations.ts              # Export IpcRegistration[] array
│   ├── cookie-rotation.ts            # Individual handler files
│   └── ...
├── services/                         # Business logic (accepts repositories)
│   ├── cookie-rotation.service.ts
│   └── ...
├── repository/                       # Data access (singleton instances)
│   ├── cookie.repository.ts
│   └── ...
├── types/                            # Module-specific types
├── helpers/                          # Pure utilities
└── workers/                          # Background workers if needed
```

**IPC Registration Flow**: Module handlers export `IpcRegistration[]` from `handlers/registrations.ts` → module-loader dynamically discovers and registers → handlers accept IPC calls → handlers delegate to services.

**Module Manifest**: Each module has `manifest.json`. Set `disabled: true` to skip loading the module entirely (useful for feature flags).

**Module loader note (compiled/runtime)**: The module loader runs against the compiled `dist/main/modules/` at runtime. TypeScript's build does not automatically copy JSON files (like `manifest.json`) into `dist/`, so module discovery should not rely only on the presence of `manifest.json` in the compiled output. Prefer detecting modules by one or more compiled indicators instead, for example: `manifest.json` OR a `handlers/` directory OR an `index.js` file. Also ensure the loader supports nested modules (for example `common/<module>/`) and normalizes their registration path (e.g., `common/cookie-rotation`). If you prefer to keep using `manifest.json`, add an explicit build step to copy all `manifest.json` files into `dist/`.

## Documentation & Files

Do not create new top-level documentation files unless explicitly requested. If asked to update docs under `docs/`, confirm the scope and intended audience before modifying.

## TypeScript & Code Quality

- Projects use TypeScript strict mode. Always add explicit types for function parameters and return values.
- Avoid `any`. If necessary, add a short comment explaining why and prefer `unknown` with validation.
- Use Promises/async-await and proper try/catch error handling. Bubble clear errors with context. Log using `src/core/logging` logger utilities when relevant.

## Database & Migrations (CRITICAL Pattern)

**Never** edit `schema.sql` directly for production changes. Schema is only a bootstrap reference.

### Migrations are Modular

All schema changes go through versioned migration **modules** in `src/main/storage/migrations/modules/`:

```typescript
// File: 024_add_cookie_rotation_config_columns.ts
export const version = 24;
export const description = "Add cookie rotation config columns";

export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
  const columns = await db.all("PRAGMA table_info(cookies)");
  const hasColumn = columns.some((c) => c.name === "launch_worker_on_startup");
  if (!hasColumn) {
    await db.run("ALTER TABLE cookies ADD COLUMN launch_worker_on_startup INTEGER DEFAULT 0");
    // ... add more columns
  }
}
```

**Must register** in `src/main/storage/migrations/index.ts`:

```typescript
import * as m024 from "./modules/024_add_cookie_rotation_config_columns";
const modules: Migration[] = [/*...*/ m023, m024];
```

**Why modular migrations?**

- Safe incremental updates (migrations run in transaction order)
- Easy rollback and debugging
- Avoids two-phase schema updates (create → populate → drop old table)
- Works with existing databases at any version

### Repository Pattern (Mandatory)

All database access through repositories. Example:

```typescript
// src/main/modules/profile-management/repository/profile.repository.ts
export class ProfileRepository extends BaseRepository<Profile> {
  async findById(id: string): Promise<Profile | null> {
    /* ... */
  }
  async create(data: CreateProfileInput): Promise<Profile> {
    /* ... */
  }
}

export const profileRepository = new ProfileRepository();
```

**Never** use raw SQL in services or renderer—always delegate to repository.

## IPC & Service Communication

**IPC Handler Pattern**: Handlers bridge renderer and main process.

```typescript
// src/main/modules/gemini-apis/handlers/registrations.ts
import { IpcRegistration } from "@core/ipc/types";

const handler: IpcRegistration = {
  channel: "cookie-rotation:update-config",
  handler: async (event, cookieId: string, config: Partial<CookieRotationConfig>) => {
    return await cookieService.updateConfig(cookieId, config);
  },
};

export const registrations: IpcRegistration[] = [handler];
```

**Renderer side**: Use the preload bridge:

```typescript
// React component in src/renderer/components/
const result = await(window as any).electronAPI.invoke("cookie-rotation:update-config", cookieId, config);
```

**Never use direct `ipcRenderer`** in renderer—always go through the `electronAPI` bridge defined in `src/main/preload.ts`.

## Service Layer

- Services accept repositories via constructor injection
- Services are singletons exported from their module
- Services call repository methods, never raw DB

Example:

```typescript
export class CookieRotationService {
  constructor(private cookieRepository: CookieRepository) {}

  async updateConfig(cookieId: string, config: Partial<CookieRotationConfig>) {
    return this.cookieRepository.update(cookieId, config);
  }
}

export const cookieService = new CookieRotationService(cookieRepository);
```

## React & Renderer Guidelines

- Use functional components with hooks. Type all props and return types explicitly.
- Keep components focused and composable. Lift state into contexts under `src/renderer/contexts/` for cross-component sharing.
- For complex forms, extract into separate components to match the pattern used in profiles (e.g., `CookieRotationConfigList`, `ProfileCookieConfigRow`).
- Styling: Tailwind utilities throughout; always support dark mode with `dark:` prefixes.
- IPC communication: Call `(window as any).electronAPI.invoke(channel, ...args)` with typed channel names; never use `ipcRenderer` directly.
- State management: Use React context for UI state (modals, drawers, expanded/collapsed). Export singleton services/repositories for domain logic.

## Development Workflow & Build Commands

**Development**:

```
npm run dev        # Start dev server with hot reload (Vite + Electron watch)
npm run dev:vite   # Vite dev server only (for rapid renderer iteration)
npm run dev:electron:watch  # Watch-compile main process only
npm run dev:electron:run    # Run Electron (starts after Vite is ready)
```

**Production Build**:

```
npm run build       # Build everything (Vite + TypeScript main)
npm run build:electron  # Build Electron main process only
npm run package    # Full package for distribution
```

**Quality**:

```
npm run lint       # ESLint (must pass before committing)
npm run rebuild    # Rebuild native sqlite3 module (if needed)
```

**Key build side effects**:

- `copy:sql` task copies `src/main/storage/schema.sql` → `dist/main/storage/schema.sql` (migrations read from compiled path)
- Migrations run automatically on DB initialization; check logs for migration errors
- Always run `npm run build` before committing to catch TypeScript errors

## Naming Conventions

- Components & pages: `PascalCase.tsx`
- Hooks & utilities: `camelCase.ts`
- Types: `camelCase.ts` (e.g., `videoTypes.ts`)

## Windows & PowerShell

- The primary development environment is Windows + PowerShell. When suggesting terminal commands, use PowerShell-compatible syntax and semicolons for compound commands.

## Linting / Build / Tests

- Before marking tasks done, ensure:
  - `npm run lint` passes (fix linting errors if suggested code introduces them)
  - `npm run build` succeeds (TypeScript compiles)

## Git & Commit Policy

- Never commit or push changes automatically. Provide a clear suggested commit message and wait for user confirmation.

## Small, safe proactive improvements

If a requested change is small and clearly improves code quality or consistency (for example: adding a missing type, fixing a simple lint error, or adding a short unit test that doesn't alter behavior), make it and note the change. For larger or risky changes (architecture refactors, DB migrations), propose first.

## Security & Secrets

- Never expose secrets or environment variables in code suggestions. Use environment variables or secure storage for credentials.

## Helpful file locations

- Main process entry: `src/main/main.ts`
- Preload & IPC bridge: `src/main/preload.ts` and `src/main/handlers/`
- Storage & DB: `src/main/storage/`
- Renderer entry & pages: `src/renderer/main.tsx`, `src/renderer/pages/`, `src/renderer/components/`
- Contexts/hooks: `src/renderer/contexts/`, `src/renderer/hooks/`

## Path aliases

- The project uses a set of path aliases so imports like `import X from "@/foo"` resolve to `src/foo` in both the renderer and main/electron builds.
- Aliases are defined in three places and should stay in sync:
  - Vite: `vite.config.ts` (used by the renderer dev server and build)
  - TypeScript: `tsconfig.json` (used by editor/TS server)
  - Electron/Node tsconfig: `tsconfig.electron.json` (used when compiling main/electron code)
- The primary alias is `@/*` -> `./src/*`. Other aliases include `@main/*`, `@handlers/*`, `@modules/*`, `@renderer/*`, `@components/*`, `@constants/*`, `@contexts/*`, `@hooks/*`, `@ipc/*`, `@pages/*`, and `@store/*`.

When adding or changing aliases, update all three files above to avoid resolution mismatches between dev, build, and main-process compilation.

Note about the `@` alias (project convention):

- The project uses the `@` root alias heavily (for example `import X from "@/foo"`). Keep this alias in sync across the three places below to avoid confusing TypeScript, Vite, and the Electron build:

  - `vite.config.ts` (renderer dev server/build) — the file at `vite.config.ts` contains the Vite alias mapping used at build/dev time. Example from this repo:
    - `"@": path.resolve(__dirname, "./src")`
  - `tsconfig.json` (editor / renderer TS language server) — add/update the same mapping in the `paths` section so imports in the editor resolve correctly. Example entry:
    - `"@/*": ["./src/*"]`
  - `tsconfig.electron.json` (main/electron build) — update this file too so main-process compilation resolves the same alias. Example entry:
    - `"@/*": ["./src/*"]`

- Quick checklist when changing aliases:
  1. Edit `vite.config.ts`, `tsconfig.json`, and `tsconfig.electron.json` together.
  2. Restart the TS language server (or your editor) after changing `tsconfig.json` so the editor picks up updates.
  3. Run `npm run build` (or the relevant build task) to validate both renderer and main/electron builds.
  4. If you add a new alias, update any project documentation that references path aliases.

## Quick checklist for Copilot-generated changes

- [ ] Types added and `strict` respected
- [ ] No direct DB access in services or renderer
- [ ] IPC usage via `preload` bridge
- [ ] Lint and build locally before suggesting commits

## If something's unclear

1. Check similar files in the repo (e.g., other services, handlers, or components) and match the project's style.
2. Ask for clarification instead of guessing when behavior is ambiguous.
