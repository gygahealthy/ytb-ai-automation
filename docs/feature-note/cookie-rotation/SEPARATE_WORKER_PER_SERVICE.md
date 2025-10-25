# Cookie Rotation — Separate-worker per-service design and implementation notes

## Purpose

This document recommends a safe, minimal implementation to make cookie-rotation run per-service (each service/provider gets its own validation URL and cookie-key mapping) and to reliably report/save rotation failures and status when rotation runs in separate processes.

This is documentation only — no code changes are made here. Use this as a guide to implement the changes in `src/main/modules/common/cookie-rotation`.

## High-level goals / contract

- Each cookie/service provider must be rotatable independently (different validate URL, different cookie keys/formats).
- When a worker runs in a separate OS/process, rotation results (success/failure/details) must be reliably persisted.
- Avoid SQLite locking problems by giving a single writer (main process) the responsibility of persisting reports. Worker processes should send reports to main via IPC.

## Contract (worker -> main) — report payload

Workers should send a JSON payload to an IPC channel when a rotation attempt completes (success or failure). Example payload:

{
"cookieId": "string", // internal cookie DB id
"profileId": "string|null", // optional profile id
"service": "string", // logical service/provider name, e.g. "google-search"
"validateUrl": "string", // the validation URL the worker used
"cookieKeys": { "SID": "..." }, // key -> value mapping the worker derived / attempted to set (optional; mask secrets in logs)
"status": "success"|"failed"|"validation_failed"|"unreachable",
"message": "string|null", // human-friendly error or null
"startedAt": "ISO8601",
"finishedAt": "ISO8601",
"attemptNumber": 1, // incremental attempt count
"meta": { } // optional extra data (timeouts, HTTP status, etc.)
}

## Suggested IPC channels

- `cookie-rotation:worker-report` — worker invokes/main listens; payload is above. Main validates auth and persists via repository.
- `cookie-rotation:worker-announce` — worker announces itself (pid, workerId, service) on start (optional, used for monitoring).

## Why do writes in main (not directly from worker)?

- SQLite (used in this project) is sensitive to concurrent writes across processes. Letting the main process be the single DB writer avoids busy locking errors and simplifies migrations and repository invariants.
- Main already owns repositories and migrations; keep that responsibility there for consistency.

## DB design — report table

Create a dedicated report table for rotation runs. Example SQL:

CREATE TABLE IF NOT EXISTS cookie_rotation_reports (
id INTEGER PRIMARY KEY AUTOINCREMENT,
cookie_id TEXT NOT NULL,
profile_id TEXT,
service TEXT NOT NULL,
validate_url TEXT,
cookie_keys_json TEXT, -- JSON string with keys (mask or omit sensitive cookie values if needed)
status TEXT NOT NULL,
message TEXT,
attempt_number INTEGER DEFAULT 1,
started_at TEXT,
finished_at TEXT,
created_at TEXT DEFAULT (datetime('now'))
);

Alternative: extend existing `cookie-rotation-monitor` repository/table if present. If you extend, add these columns or a child `reports` table so previous monitoring rows are preserved and queries stay efficient.

## Migration example (TypeScript module style used by this repo)

// docs only: example migration module to add the reports table
export const version = 999; // pick next available migration number
export const description = "Add cookie_rotation_reports table for per-service worker reports";

export async function up(db: SQLiteDatabase, logger?: Logger): Promise<void> {
await db.run(`CREATE TABLE IF NOT EXISTS cookie_rotation_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cookie_id TEXT NOT NULL,
    profile_id TEXT,
    service TEXT NOT NULL,
    validate_url TEXT,
    cookie_keys_json TEXT,
    status TEXT NOT NULL,
    message TEXT,
    attempt_number INTEGER DEFAULT 1,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
}

## Implementation steps (concrete)

1. Add per-cookie/service configuration

   - Option A: Add columns to cookies table: `service` (string), `validate_url` (string), `cookie_keys_json` (json) — simple and colocated.
   - Option B: Create a `cookie_rotation_providers` table mapping `service` -> provider config (recommended when multiple cookies share a provider config).
   - Include a `validate_interval_seconds` or `max_age_seconds` if you want different rotation cadence per service.

2. Add `cookie_rotation_reports` table (as above) and register migration in `src/main/storage/migrations/index.ts`.

3. Add an IPC registration in `cookie-rotation/handlers/registrations.ts` for `cookie-rotation:worker-report`.

   - Handler should validate minimal payload shape and call into a `cookieRotationReportRepository.create(report)` method.
   - Example handler signature (docs-only):

     const handler: IpcRegistration = {
     channel: 'cookie-rotation:worker-report',
     handler: async (event, reportPayload) => {
     // validate types
     return await cookieRotationReportRepository.create(reportPayload);
     }
     };

4. Worker behavior changes (in worker process file)

   - Each worker instance must be created/configured with the `service` it handles, plus the `validateUrl` and `cookieKeys` map.
   - Before rotation, the worker should fetch the current cookie from repository (read-only) and attempt rotation using provider-specific code.
   - On success/failure, the worker must send the `worker-report` payload to main via the IPC wrapper available in that process (or, if worker cannot use IPC, send over a small HTTP endpoint on main — IPC preferred).
   - Don’t write to DB directly from worker processes. If worker must write directly, ensure retries and robust backoff for SQLITE_BUSY and follow WAL mode guidance — but prefer IPC.

5. Main: persist reports and update cookie/monitor rows

   - The handler persists a `cookie_rotation_reports` row.
   - Optionally update a `cookie_rotation_monitor` row for aggregated status (last_status, last_attempt_at, consecutive_failures integer).

6. Add tests and monitoring
   - Unit test for handler: ensure valid payload writes a row.
   - Integration test: spawn a worker (in-process variant) and assert that the IPC channel receives a report and DB row appears.

## Edge cases and recommendations

- Mask cookie values in any persisted `cookie_keys_json` for security; store only key names and partial values or a hash if needed.
- If workers run frequently, keep the reports table pruned or add a retention policy / TTL job (archive older than X days).
- If workers are long-running OS processes, ensure they reconnect and re-announce after main restarts. Provide idempotency key on reports (cookieId + attemptNumber + startedAt) to avoid duplicates.
- For transient DB write failures, handler should retry persist up to N times with short backoff and then log a critical error.
- Consider storing an aggregated view table with last_status per cookie for quick UI queries.

## Example worker-report handling flow (summary)

1. Worker attempts rotation for cookie C against `service` S with validation URL V.
2. Worker determines success/failure and constructs report payload.
3. Worker sends payload to `cookie-rotation:worker-report` via IPC.
4. Main receives payload, validates, persists into `cookie_rotation_reports` and updates monitoring summary.

## Developer checklist (safe rollout)

- [ ] Add migration for `cookie_rotation_reports` and register it in migrations index.
- [ ] Add repository `cookieRotationReportRepository` with create/list methods.
- [ ] Add IPC registration `cookie-rotation:worker-report` and handler that calls repository.
- [ ] Add per-service config fields (cookies table or separate providers table).
- [ ] Update unit and integration tests for the worker/report flow.
- [ ] Add UI/logging to show the latest failed rotations per cookie and ability to inspect recent reports.

## Minimal verification steps (manual)

1. Run migrations locally; confirm new table exists.
2. Run an in-process worker and call the handler directly or via the `preload` bridge to simulate a report payload.
3. Confirm a row appears in `cookie_rotation_reports` and `cookie_rotation_monitor` summary is updated.

## Notes / rationale

- Keeping writes in the main process prevents SQLITE_BUSY and locking issues when multiple OS processes attempt concurrent writes.
- Per-service config makes rotation robust and easier to extend for new providers.
- The report design is intentionally simple and extensible (meta JSON allowed for provider-specific fields).

## Follow-ups (optional)

- Add a small health endpoint for worker processes to POST reports over HTTP in environments where IPC isn't available.
- Add retention and archival for the reports table.
- Add per-service rotation strategies and pluggable method registration (the repo already contains `methods/` — register them by service name).

— End of document
