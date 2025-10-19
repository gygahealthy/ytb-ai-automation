# VS Code Copilot Custom Instructions (Project-tailored)

These instructions are tuned for the VEO3 / ytb-ai-automation Electron + React + TypeScript project in this repository. They guide code generation so suggestions align with the project's architecture, safety rules, and developer workflow.

Principles:

- Keep the main process minimal and push heavy work into services.
- Renderer code is React + TypeScript (strict mode) using Tailwind for styles.
- Follow the repository/service patterns: repositories handle DB access, services orchestrate business logic, pages/components handle UI.

## Documentation & Files

Do not create new top-level documentation files unless explicitly requested. If asked to update docs under `docs/`, confirm the scope and intended audience before modifying.

## TypeScript & Code Quality

- Projects use TypeScript strict mode. Always add explicit types for function parameters and return values.
- Avoid `any`. If necessary, add a short comment explaining why and prefer `unknown` with validation.
- Use Promises/async-await and proper try/catch error handling. Bubble clear errors with context. Log using `src/core/logging` logger utilities when relevant.

## Project Patterns (must follow)

- Database access: always go through repository classes in `src/main/storage/repositories/` or other repo files. Do not access `sqlite-database` or write raw SQL inside services or UI code.
- Services: live under `src/main/modules/*` or `src/main/services` and accept repositories via dependency injection when possible.
- IPC: use `preload.ts` exported bridge (e.g., `electronAPI`) rather than direct `ipcRenderer` in the renderer. All IPC handlers should be defined in `src/main/handlers/`.

## React / Renderer Guidelines

- Use functional components with hooks. Type props and return types.
- Keep components focused and composable. Lift state into contexts under `src/renderer/contexts/` when needed.
- Styling: Tailwind utilities are used across the app. Support dark mode by using `dark:` classes.

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

## Quick checklist for Copilot-generated changes

- [ ] Types added and `strict` respected
- [ ] No direct DB access in services or renderer
- [ ] IPC usage via `preload` bridge
- [ ] Lint and build locally before suggesting commits

## If something's unclear

1. Check similar files in the repo (e.g., other services, handlers, or components) and match the project's style.
2. Ask for clarification instead of guessing when behavior is ambiguous.
