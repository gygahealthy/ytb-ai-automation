# Cookie Rotation Worker — Call Flow, Interference Cause, and Recommendations

## Purpose

This note documents the current call flow for cookie rotation workers, explains why you observed interference between the rotation worker and `CookieManagerDB`, and gives concrete, actionable recommendations — including the requested recommendation to separate legacy/in-process workers vs forked worker responsibilities in `src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts`.

## Current call flow (high level)

- `GlobalRotationWorkerManager.init()` runs on startup and resets stale monitors.
- `initializeStartupWorkers()` finds cookies with `launchWorkerOnStartup` and calls `startWorkerByIds(profileId, cookieId, { performInitialRefresh: true })`.
- `startWorkerByIds(..., { performInitialRefresh: true })` forks a child Node process and boots `cookie-rotation-worker-process.js`.
  - Parent waits for `ready` message, then `workerProcess.send({ cmd: 'start', cookieId, options })`.
  - Child imports `CookieRotationWorker` and instantiates it as `new CookieRotationWorker(cookieId, options)`.
  - `CookieRotationWorker.start()` performs an optional initial headless refresh and then attempts to load per-cookie rotation config via `cookieRotationConfigService.getCookieConfig(cookieId)`.
- If `performInitialRefresh` is not requested, the manager falls back to legacy in-process behavior:
  - The manager calls `createCookieManagerDB(...)` which instantiates `CookieManagerDB` in the main process and calls `.start()` on it.

## Why you saw "Config not found" in the forked worker

- `cookieRotationConfigService` is a process-local holder singleton that is initialized by the main process (`cookieRotationConfigService.init(cookieRepo, monitorRepo)` in the manager factory).
- The forked worker runs in a separate Node process and does not share the main process memory, so the holder is not initialized in the child. Calls to `cookieRotationConfigService.getCookieConfig(...)` therefore return `null`, which causes `CookieRotationWorker` to log `No config found` and abort scheduling.

## Why the behavior appears to "interfere" with `CookieManagerDB`

- There are two rotation execution models in this codebase:
  1. Legacy in-process: `CookieManagerDB` (created by `createCookieManagerDB`) runs in the main process and performs PSIDTS rotations and DB updates.
  2. Forked worker: `CookieRotationWorker` runs in a forked child process and directly opens the database, uses `CookieRepository`, and updates `cookies` + monitor rows.
- Both actors read/write the same SQLite rows (e.g., `rawCookieString`, `lastRotatedAt`, monitor table). If both are running for the same cookie, concurrent writes or read-after-write races are possible. Symptoms include overwritten cookie values, mismatched `lastRotatedAt` timestamps, and confusing logs where one process updates DB and the other later loads the stale/new value.

## Concrete recommendations (prioritized)

1. Enforce single ownership per cookie (recommended)

   - Ensure only one rotation actor can be active for a given cookie at a time: either legacy in-process `CookieManagerDB` or a forked `CookieRotationWorker`.
   - Implementation ideas:
     - Use the `cookie_rotation_monitors` table `workerStatus` and `requiresHeadlessRefresh` as the authoritative ownership flags.
     - Before starting either worker path, atomically set monitor.workerStatus = `initializing` and an `ownerProcess` field (or use the existing monitor.id+PID) so another starter will see the cookie is claimed.
     - Refuse to start a second worker if monitor indicates an active owner.

2. Preferred: Parent-driven config + light child (low-risk, minimal changes)

   - Fetch the cookie rotation config in the main process and include it in the start message payload that you send to the forked worker.
   - Example change (in `global-rotation-worker-manager.service.ts` before `workerProcess.send`):
     ```ts
     const config = await cookieRotationConfigService.getCookieConfig(cookieId);
     workerProcess.send({
       cmd: "start",
       cookieId,
       options: {
         performInitialRefresh: true,
         verbose: true,
         config, // <-- send config so child doesn't need initialized holder
       },
     });
     ```
   - Then update `CookieRotationWorker` to prefer `options.config` (if present) before calling `cookieRotationConfigService.getCookieConfig()` locally. This avoids needing to wire/initialize the service in children.
   - Pros: minimal runtime overhead, avoids duplicating service initialization in child, reduces DB roundtrips.

3. Alternative: Initialize config service inside the forked worker (heavier)

   - If you prefer child processes to be self-sufficient, initialize their own `cookieRotationConfigService` holder during bootstrap by constructing `CookieRepository`/`MonitorRepository` inside the forked process and calling `cookieRotationConfigService.init(...)` there.
   - Drawbacks: doubles repository instances, extra startup CPU/io, duplicates code paths; still requires the worker to fetch config from DB on startup.

4. Make workers resilient when config is missing

   - If `cookieRotationConfigService.getCookieConfig()` returns `null`, the worker should use sensible defaults or return a clear `workerError` back to parent and allow parent to take corrective action (e.g., send config, or restart worker with config).

5. DB-level safeguards and DTOs
   - Use a last-writer marker: when performing rotation updates, include a `lastWriter` and `lastWriterTimestamp` column (or add a revision counter). This helps detecting and resolving conflicting writes.
   - Use transactions when updating cookie + monitor to keep related state consistent.

## Files to inspect / change (actionable)

- `src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts`
  - Where the child is forked and the `start` message is sent — add config to the options payload and ensure monitor ownership is set before sending.
- `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker-process.ts`
  - Accept `options.config` if provided and pass it into `CookieRotationWorker` constructor or set it on the instance.
- `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker.ts`
  - Prefer `options.config` if present; if not present, fall back to calling `cookieRotationConfigService.getCookieConfig()`.
- `src/main/modules/common/cookie/services/cookie-manager-db.ts`
  - Keep as single-authority when manager chooses the legacy path. Ensure that manager never starts both this and a fork for the same cookie.

## How to test / quick verification steps

1. Reproduce startup logs and confirm only one style starts per cookie.
   - With the current code, startup logs show `Phase 1 worker (forked process) started` — confirm the manager did not also call `createCookieManagerDB` for the same cookie.
2. Inspect monitor table for ownership and timestamps:
   - Example SQLite queries (run via your DB client):
     ```sql
     SELECT * FROM cookie_rotation_monitors WHERE cookie_id = 'c1b4e5c2-7130-47e5-a65f-f262378075d7';
     SELECT rawCookieString, lastRotatedAt FROM cookies WHERE id = 'c1b4e5c2-7130-47e5-a65f-f262378075d7';
     ```
3. Confirm worker receives config after change: add debug logging where `workerProcess.send` includes `config` and in child log `options.config` on startup.

## Recommended next step (implementation option)

I recommend implementing the Parent-driven config approach:

- Minimal code changes in two places.
- Low-risk and keeps process separation clear: parent owns config and monitor state; child focuses on execution of rotation methods.

If you want, I can prepare the small patch that:

1. Fetches `config` in `global-rotation-worker-manager.service.ts` before sending `cmd: 'start'` to the child and includes it in `options`.
2. Updates `cookie-rotation-worker-process.ts` and `cookie-rotation-worker.ts` to accept and prefer `options.config`.

Tell me which option you want implemented and I will prepare a focused patch.

---

File created: `docs/feature-note/COOKIE_ROTATION_WORKER_INTERFERENCE_NOTE.md` — documents the above call flow, root cause, and recommended changes.
