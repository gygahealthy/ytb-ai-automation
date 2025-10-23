## Cookie Rotation Module Separation Plan

Date: 2025-10-24

## Summary

This document captures a detailed plan to extract the cookie-rotation subsystem that currently lives inside `src/main/modules/gemini-apis` into a dedicated module `src/main/modules/cookie-rotation` (and an optional small `cookie-management` module for shared cookie services). This is a planning-only change — no code edits will be made here. Follow the implementation checklist below when you are ready to perform the refactor.

## Why separate

- Separation of concerns: cookie rotation contains background workers, scheduling and DB monitors which are operational responsibilities and easier to reason about when owned by a single module.
- Independent lifecycle: rotation workers need start/stop lifecycle independent from chat request handlers. A dedicated module can own safe startup ordering.
- Reuse: other modules (e.g., automation, instance-management) may need rotation APIs; a separate module provides a clear public contract and reduces cross-module import complexity.
- Testability: isolate the rotation code for unit and integration tests.

## Scope & Goals

- Create a new module `src/main/modules/cookie-rotation/` that owns rotation workers, rotation config service, rotation monitor repository and rotation helpers.
- Optionally create `src/main/modules/cookie-management/` to host cookie repository and cookie service used by multiple modules.
- Keep `gemini-apis` focused on chat-related functionality and calls the new modules via explicit service imports or IPC channels.
- No production behaviour change: the application should behave identically after migration.

## Success Criteria

1. All cookie-rotation behavior works unchanged (workers start, rotations run, DB monitor persists as before).
2. `gemini-apis` no longer contains rotation worker files or rotation-specific repository/service files.
3. No circular imports introduced.
4. TypeScript build (`npm run build`) and lint (`npm run lint`) pass.
5. Minimal tests added: rotation service unit test + an IPC handler test.

## Contract / Public API (IPC + Services)

Expose the following IPC channels and/or service methods from the `cookie-rotation` module:

- cookie-rotation:get-config -> returns CookieRotationConfig[]
- cookie-rotation:update-config -> updates a config item
- cookie-rotation:list-monitors -> returns monitor DB records
- cookie-rotation:force-rotate -> triggers immediate rotation for cookieId or monitorId
- cookie-rotation:start-worker -> start worker (admin use)
- cookie-rotation:stop-worker -> stop worker

If a separate `cookie-management` module is created, it should expose (service-level):

- cookieService.get(cookieId)
- cookieService.list(filter)
- cookieService.create(data)
- cookieService.update(cookieId, data)

## High-level file movement / mapping

These are the files currently inside `gemini-apis` (from your attachment). The plan below moves the rotation-specific files into the new module and optionally moves cookie data service into `cookie-management`:

- Move to `cookie-rotation` module:

  - `services/cookie-rotation-config.service.ts`
  - `services/global-rotation-worker-manager.service.ts`
  - `repository/cookie-rotation-monitor.repository.ts`
  - `workers/cookie-rotation-worker.ts`
  - `workers/headless-cookie-worker.js`
  - `helpers/cookie-rotation/*.ts` (cookie-rotation helpers)
  - Any handlers under `handlers/*` that belong to rotation (if present)

- Optionally move to `cookie-management` module:

  - `repository/cookie.repository.ts`
  - `services/cookie.service.ts`
  - `helpers/cookie/*` if they are general cookie utilities used by non-rotation code

- Keep in `gemini-apis`:
  - `services/chat.*`, `handlers/chat/*`, chat helpers and API helpers

## Module layout (recommended)

`src/main/modules/cookie-rotation/`

- `manifest.json` (id: `cookie-rotation`) — include `disabled` boolean and short description
- `index.ts` — export `manifest` and `registrations` (or `registerModule()` if used by module-loader)
- `handlers/registrations.ts` — export IPC handler registrations for the rotation public API
- `services/` — rotation services (config service, manager service)
- `repository/` — rotation monitor repository
- `helpers/` — rotation helpers
- `workers/` — worker scripts and compiled JS (if any)
- `types/` — module-specific types
- `README.md` — module purpose and IPC contract

`src/main/modules/cookie-management/` (optional)

- `manifest.json`, `index.ts`, `services/cookie.service.ts`, `repository/cookie.repository.ts`, `types/`, `README.md`

## Detailed Implementation Plan (step-by-step)

1. Create scaffolding (no runtime changes yet)

   - Add `src/main/modules/cookie-rotation/manifest.json` and `index.ts` that export a typed `manifest` and empty `registrations` array. Add `README.md` describing intent.
   - Add `src/main/modules/cookie-management/` scaffolding if you choose the optional step.

2. Move repository & services (in small commits)

   - Move `cookie-rotation-monitor.repository.ts` and `cookie-rotation-config.service.ts` to `cookie-rotation/repository` and `cookie-rotation/services` respectively.
   - Update imports inside those files to use new relative paths or aliases.
   - If moving cookie repository/service, move them to `cookie-management` and update imports.

3. Move workers and helpers

   - Move `workers/cookie-rotation-worker.ts` and `workers/headless-cookie-worker.js` to the new module's `workers/` directory.
   - Move `helpers/cookie-rotation/*` to `cookie-rotation/helpers`.

4. Add IPC handlers

   - Create `handlers/registrations.ts` that registers the public IPC channels listed above and delegates to the services in the new module.

5. Update `gemini-apis` usage

   - Replace local imports in `gemini-apis` that referenced rotation files with either: (a) calls to `cookie-rotation` IPC channels, or (b) imports from `cookie-management` services if cookie storage moved.
   - Keep changes minimal: prefer IPC handlers for cross-module interactions to avoid tight coupling.

6. Module loader & startup ordering

   - Verify `src/main/handlers/module-loader.ts` picks up the new module automatically.
   - Ensure cookie-rotation module starts after DB initialization and migrations. Add a small check in `cookie-rotation` `index.ts` or manifest docs to note the dependency.

7. Build & lint

   - Run `npm run build` and `npm run lint`. Fix any type/import issues introduced by moves.

8. Tests

   - Add unit tests for `cookie-rotation-config.service` and `global-rotation-worker-manager.service`.
   - Add a small test for one IPC handler (if project has test harness).

9. Integration smoke test

   - Start the app in dev mode and verify: rotation workers start, DB monitor rows exist, rotations run as before.

10. Cleanup

- Remove rotation files from `gemini-apis` once everything passes.

## Migration Checklist & Safety

- Do changes in small commits and verify build/lint between commits.
- If moving DB-accessing code, DO NOT change SQL/migrations during the move. If schema changes are required later, add modular migration files in `src/main/storage/migrations/modules`.
- Watch for circular dependencies; prefer IPC between modules instead of direct imports when both need each other.
- Keep the same public behavior and data schema; this is a refactor.

## Risks & Mitigations

- Risk: Circular import between `gemini-apis` and `cookie-rotation`.
  - Mitigation: Extract cookie data/repo into `cookie-management` as a single source-of-truth, or use IPC.
- Risk: Worker startup ordering causing early DB calls before migrations run.
  - Mitigation: Ensure module-loader initializes cookie-rotation only after DB init, or gate worker start behind a `dbReady` signal.
- Risk: Missed imports causing runtime errors.
  - Mitigation: Run full TypeScript build and lint, then run the app in dev env and smoke test.

## Estimated Effort

- Scaffolding & small moves (safe): 1–2 hours
- Full extraction + import fixes + tests + smoke test: 2–6 hours depending on cross-module coupling

## Acceptance Criteria & Verification

1. `npm run build` passes.
2. `npm run lint` passes (or small lint fixes are applied).
3. Dev run: rotation workers appear in logs and rotation tasks execute as before.
4. Unit tests for moved services pass.

## Follow-ups (optional)

- Add a `_template` module under `src/main/modules/_template` to speed future module creation.
- Add `manifest.schema.json` in repo docs to standardize module manifest fields.
- Add a short migration note in `docs/feature-note/COOKIE_ROTATION_REFACTOR.md` summarizing the move and cross-module contracts.

## Appendix: Example `manifest.json` (cookie-rotation)

```
{
  "id": "cookie-rotation",
  "name": "Cookie Rotation",
  "version": "0.1.0",
  "disabled": false,
  "description": "Background cookie rotation workers and config management"
}
```

## Appendix: Suggested IPC channels (short list)

- `cookie-rotation:get-config` (returns configs)
- `cookie-rotation:update-config` (mutates config)
- `cookie-rotation:list-monitors`
- `cookie-rotation:force-rotate`
- `cookie-rotation:start-worker` / `cookie-rotation:stop-worker`

---

If you want, I can scaffold the `cookie-rotation` module (only files, no code changes in existing modules), and run a build/lint check next — tell me to proceed and I will implement the scaffolding in small commits.
