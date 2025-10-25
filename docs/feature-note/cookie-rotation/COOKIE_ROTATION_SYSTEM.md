# Cookie Rotation System

## Overview

The cookie rotation system manages Gemini API authentication cookies automatically, ensuring sessions remain active and healthy. It combines HTTP-based rotation with headless browser fallback for maximum reliability.

## Architecture

### Components

1. **Global Rotation Worker Manager** (`global-rotation-worker-manager.service.ts`)

   - Manages all cookie rotation workers across profiles
   - Detects expired sessions on startup
   - Triggers headless browser refresh when needed
   - Broadcasts health status to UI

2. **Cookie Manager DB** (`cookie-manager-db.ts`)

   - Manages individual cookie rotation for a profile
   - Runs PSIDTS rotation every 9 minutes
   - Runs SIDCC refresh every 2 minutes
   - Persists cookies to database

3. **Headless Cookie Refresh** (`headless-cookie-refresh.helpers.ts`)

   - Child process-based Puppeteer worker
   - Extracts fresh cookies when HTTP rotation fails
   - Isolated from main process for safety

4. **Cookie Rotation Monitor Repository** (`cookie-rotation-monitor.repository.ts`)
   - Tracks worker status, errors, and health metrics
   - Provides summary statistics for UI

## Rotation Strategy

### HTTP-Based Rotation (Primary)

- **PSIDTS Rotation**: Every 9 minutes using Google's `rotateCookies` endpoint
- **SIDCC Refresh**: Every 2 minutes using Google's `refreshCreds` endpoint
- Fast, lightweight, and non-intrusive

### Headless Browser Fallback (Secondary)

Triggers when:

- 3+ consecutive HTTP rotation failures
- Session detected as expired
- Manual refresh requested

Process:

1. Spawns isolated child process
2. Launches headless Chromium with user's profile
3. Navigates to Gemini
4. Extracts ALL cookies
5. Returns via stdout/IPC
6. Updates database and restarts worker

## Database Schema

### `cookie_rotation_monitors` Table

Tracks rotation worker status for each profile/cookie pair:

```sql
CREATE TABLE cookie_rotation_monitors (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  cookie_id TEXT NOT NULL,
  worker_status TEXT CHECK(worker_status IN ('running', 'stopped', 'error', 'initializing')),
  last_psidts_rotation_at TEXT,
  last_sidcc_refresh_at TEXT,
  psidts_rotation_count INTEGER DEFAULT 0,
  sidcc_refresh_count INTEGER DEFAULT 0,
  psidts_error_count INTEGER DEFAULT 0,
  sidcc_error_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TEXT,
  requires_headless_refresh INTEGER DEFAULT 0,
  last_headless_refresh_at TEXT,
  headless_refresh_count INTEGER DEFAULT 0,
  session_health TEXT CHECK(session_health IN ('healthy', 'degraded', 'expired', 'unknown')),
  next_rotation_scheduled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE CASCADE,
  UNIQUE(profile_id, cookie_id)
);
```

### Health Status

- **healthy**: Rotation working normally
- **degraded**: Some failures, still functional
- **expired**: Session expired, needs headless refresh
- **unknown**: Initial state

## Startup Flow

1. App launches → `main.ts`
2. Database initialized
3. Global Rotation Worker Manager initialized
4. Manager scans for active cookies
5. Detects expired sessions
6. Starts rotation workers for each active cookie
7. UI indicator shows real-time status

## UI Indicator

Located in sidebar, shows:

- Overall health status (green/yellow/red dot)
- Active worker count
- Health breakdown (healthy/degraded/expired)
- Sessions requiring headless refresh
- Quick actions (refresh, start/stop)

## IPC Handlers

Exposed to renderer via `window.electronAPI.cookieRotation`:

- `getStatus()`: Get current rotation status
- `getProfiles()`: List profiles + cookies for overlay
- `startWorker(profileId, cookieId)`: Start specific worker on demand
- `restartWorker(profileId, cookieId)`: Restart specific worker
- `stopWorker(profileId, cookieId)`: Stop specific worker
- `stopAll()`: Stop all workers
- `startAll()`: Start all workers
- `onStatusUpdate(callback)`: Listen for status updates

## Usage Example

### Start rotation for a profile

```typescript
// Create or get cookie
const cookie = await cookieRepository.findByProfileAndUrl(
  profileId,
  "gemini.google.com"
);

// Worker manager will auto-start on app launch
// Or manually start:
const manager = await getGlobalRotationWorkerManager();
await manager.start(); // Scans and starts all active cookies
```

### Monitor status in UI

```typescript
// In a React component
const [status, setStatus] = useState(null);

useEffect(() => {
  const unsubscribe =
    window.electronAPI.cookieRotation.onStatusUpdate(setStatus);

  // Initial fetch
  window.electronAPI.cookieRotation.getStatus().then((result) => {
    if (result.success) setStatus(result.data);
  });

  return unsubscribe;
}, []);
```

### Force headless or visible refresh

The renderer now reuses the unified cookie extraction handler exposed via
`window.electronAPI.cookies.extractAndCreateCookie`. Pass the desired mode
through the `headless` flag (defaults to `true`).

```typescript
await window.electronAPI.cookies.extractAndCreateCookie(
  profileId,
  "gemini",
  "https://gemini.google.com",
  /* headless */ true
);
```

## Configuration

Default intervals (in `CookieManagerDB`):

```typescript
{
  psidtsIntervalSeconds: 540,  // 9 minutes
  sidccIntervalSeconds: 120,   // 2 minutes
  verbose: false,              // Enable debug logs
}
```

Presets:

- **Default**: 9min/2min (recommended)
- **Aggressive**: 5min/1min (high-traffic)
- **Conservative**: 15min/3min (low-traffic)

## Error Handling

1. **HTTP Rotation Failure**

   - Logged to console and database
   - Increments error counter
   - After 3 failures → marks for headless refresh

2. **Headless Refresh Failure**

   - Logged as critical error
   - Session marked as expired
   - Worker stopped, manual intervention required

3. **Process Isolation**
   - Headless browser runs in child process
   - Crashes don't affect main app
   - 60-second timeout enforced

## Monitoring

### Logs

All rotation activities logged with `[rotation-manager]` prefix:

```
[rotation-manager] 🚀 Starting global cookie rotation manager
[rotation-manager] ✅ Started worker for profile-123-cookie-456
[rotation-manager] ⚠️ PSIDTS rotation failed 3+ times, marking for headless refresh
[rotation-manager] 🌐 Starting headless refresh for cookie abc
[rotation-manager] ✅ Headless refresh successful, updating cookies
```

### Database Queries

```sql
-- Get health summary
SELECT
  session_health,
  COUNT(*) as count
FROM cookie_rotation_monitors
GROUP BY session_health;

-- Find sessions needing attention
SELECT * FROM cookie_rotation_monitors
WHERE consecutive_failures >= 3
OR session_health IN ('degraded', 'expired');
```

## Best Practices

1. **Always use headless mode** for initial cookie extraction (avoids blocking UI)
2. **Monitor health status** regularly via UI indicator
3. **Act on degraded sessions** before they expire
4. **Keep userDataDir** paths valid and accessible
5. **Don't run multiple workers** for the same cookie (enforced by unique constraint)

## Troubleshooting

### Worker won't start

- Check cookie exists in database
- Verify profile has valid `userDataDir`
- Check logs for initialization errors

### Rotation keeps failing

- Verify cookies are valid (try manual headless refresh)
- Check network connectivity
- Verify Google endpoints are accessible

### Headless refresh timeout

- Increase timeout in `refreshCookiesHeadless` call
- Check browser installation
- Verify userDataDir is valid Chrome profile

## Future Improvements

- [ ] Exponential backoff for retries
- [ ] Configurable rotation intervals per profile
- [ ] Rotation history tracking
- [ ] Automatic session renewal via 2FA
- [ ] Multi-region proxy support
