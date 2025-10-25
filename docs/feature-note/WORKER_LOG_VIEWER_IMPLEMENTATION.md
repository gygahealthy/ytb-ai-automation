# Worker Log Viewer Implementation

## Overview

This implementation adds a real-time worker log viewer to the Cookie Rotation dashboard that displays logs from individual worker processes. Since workers run in **forked child processes** (separate from the Electron main process), they use a **file-based logging system** instead of the in-memory log broadcast.

## Architecture

### Why File-Based Logging?

The cookie rotation workers run in forked Node.js processes (`cookie-rotation-worker-process.ts`) to avoid blocking the Electron main process. These forked processes:

- **Cannot** access Electron APIs (like `BrowserWindow`)
- **Cannot** use the main process logger that broadcasts to renderer
- **Need** a separate logging mechanism

**Solution**: Each worker writes logs to its own file in `{userData}/logs/workers/worker-{cookieId}.log`, which the renderer reads via IPC.

### How It Works

1. **Worker Process Logging**: `WorkerFileLogger` class writes JSON-formatted log entries to worker-specific files
2. **File Storage**: Logs stored in `{userData}/logs/workers/` directory, one file per worker
3. **IPC Handlers**: Main process provides endpoints to read, clear, and list worker log files
4. **Renderer Component**: `WorkerLogViewer` fetches logs via IPC and polls for updates every 2 seconds
5. **Integration**: Log viewer button appears next to running workers in the Cookie Rotation panel

## Files Created

### 1. `src/main/modules/common/cookie-rotation/workers/worker-file-logger.ts`

File-based logger for worker processes:

**Classes**:

- **`WorkerFileLogger`**: Writes structured logs to worker-specific log files
  - Writes JSON lines (one JSON object per line)
  - Auto-creates log directory structure
  - Also logs to console for immediate visibility
  - Methods: `info()`, `warn()`, `error()`, `debug()`, `close()`

**Utility Functions**:

- **`readWorkerLogFile(cookieId, options)`**: Reads and parses log file, returns array of log entries
- **`clearWorkerLogFile(cookieId)`**: Deletes log file for a worker
- **`listWorkerLogFiles()`**: Returns paths of all worker log files

**Log Format** (JSON Lines):

```json
{ "timestamp": 1698765432000, "level": "info", "message": "Starting rotation cycle", "cookieId": "abc-123", "args": [] }
```

### 2. `src/main/modules/common/cookie-rotation/handlers/worker-logs.ts`

IPC handlers for worker log operations:

- **`cookie-rotation:get-worker-logs`**: Returns log entries for a specific worker (with optional tail limit)
- **`cookie-rotation:clear-worker-logs`**: Clears log file for a worker
- **`cookie-rotation:list-worker-log-files`**: Lists all worker log files

### 3. `src/renderer/components/common/sidebar/cookie-rotation/WorkerLogViewer.tsx`

React component that displays worker logs:

**Features**:

- Fetches logs via IPC (initial load + polling every 2 seconds)
- Search functionality across log messages
- Log level filtering (all, info, warn, error, debug)
- Sort order toggle (newest/oldest first)
- Refresh button to manually reload logs
- Clear logs button
- Color-coded log levels with timestamps
- Statistics footer showing log counts

**Props**:

```typescript
interface WorkerLogViewerProps {
  cookieId: string; // Required: identifies the worker
  profileId?: string; // Optional: for display
  profileName?: string; // Optional: for display
  onClose?: () => void; // Optional: close handler
  maxHeight?: string; // Optional: max height (default 400px)
}
```

## Files Modified

### 1. `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker.ts`

- Added `WorkerFileLogger` instance to worker class
- Replaced all `logger.*` calls with `fileLogger.*`
- Logger writes to worker-specific file in logs/workers/
- Added `fileLogger.close()` in stop method

### 2. `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker-process.ts`

- Added environment variable check for `WORKER_LOG_DIR`
- Worker process receives log directory path from parent

### 3. `src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts`

- Passes `WORKER_LOG_DIR` environment variable when forking worker process
- Worker knows where to write log files

### 4. `src/main/modules/common/cookie-rotation/handlers/registrations.ts`

- Imported and spread `workerLogHandlers` into registrations array
- Added worker log IPC handlers to module exports

### 5. `src/main/preload.ts`

Exposed worker log APIs in `cookieRotation` namespace:

```typescript
cookieRotation: {
  // ... existing APIs
  getWorkerLogs: (cookieId: string, options?: { tail?: number }) => Promise<any>;
  clearWorkerLogs: (cookieId: string) => Promise<any>;
  listWorkerLogFiles: () => Promise<any>;
}
```

### 6. `src/renderer/vite-env.d.ts`

Added TypeScript type definitions for new IPC methods.

### 7. `src/renderer/components/common/sidebar/cookie-rotation/CookieRotationPanel.tsx`

- Added state for tracking which worker's logs to view
- Added log viewer button (📄 icon) next to running workers
- Conditional rendering to show `WorkerLogViewer` when user clicks log button

## User Flow

1. User opens Cookie Rotation panel from sidebar indicator
2. Expands a profile to see cookies
3. For **running workers**, sees a log button (📄 icon)
4. Clicks log button → panel switches to `WorkerLogViewer`
5. Viewer shows:
   - Worker logs from file
   - Auto-refreshes every 2 seconds
   - Search, filter, and sort controls
   - Clear logs button
6. Click X to return to main panel

## Benefits

### ✅ Proper Isolation

- Worker logs don't pollute main process logs
- Each worker has its own log file
- Logs persist even after worker stops

### ✅ Real-Time Updates

- Polls log file every 2 seconds
- Manual refresh button available
- No WebSocket or complex streaming needed

### ✅ Debugging Power

- See exact worker behavior
- Filter by log level
- Search across log messages
- Color-coded levels for quick scanning

### ✅ Resource Management

- Tail option limits memory usage (default: last 500 entries)
- Clear logs button to free disk space
- JSON Lines format is efficient and parseable

## Log File Location

- **Development**: `{userData}/logs/workers/worker-{cookieId}.log`
- **Production**: Same structure, in app data directory
- Example path (Windows): `C:\Users\{username}\AppData\Roaming\{appName}\logs\workers\worker-abc123def456.log`

## Future Enhancements

Potential improvements:

1. **Log Rotation**: Auto-rotate files when they exceed size limit (e.g., 10MB)
2. **Log Retention**: Auto-delete logs older than N days
3. **Export Logs**: Button to download/save logs as file
4. **Real-time Streaming**: Use `fs.watch()` instead of polling (more efficient)
5. **Log Levels**: Configurable worker log verbosity per worker
6. **Search Highlighting**: Highlight search query matches in log viewer
7. **Log Analytics**: Parse logs to show rotation success rate, error trends, etc.

## Technical Notes

- **JSON Lines Format**: Each log entry is one JSON object per line (easy to append and parse)
- **File Safety**: Uses `fs.createWriteStream` with append mode
- **Error Handling**: Logs write errors to console, continues operation
- **Forked Process**: Worker process receives log directory via `WORKER_LOG_DIR` env variable
- **Polling**: 2-second poll interval balances freshness vs. performance
- **Tail Limit**: Default 500 entries prevents memory issues with large log files

## Testing Checklist

- [x] Build compiles without errors
- [x] No TypeScript/linting errors
- [ ] Run dev server and verify log viewer opens
- [ ] Start a worker and verify logs appear in file
- [ ] Verify logs display in UI
- [ ] Test search functionality
- [ ] Test level filtering
- [ ] Test sort order toggle
- [ ] Test clear logs button
- [ ] Test refresh button
- [ ] Verify dark mode styling
- [ ] Test with multiple workers

## Suggested Commit Message

```
feat(cookie-rotation): add file-based worker log viewer

- Create WorkerFileLogger for forked worker processes
- Workers write JSON-formatted logs to individual files
- Add IPC handlers to read/clear worker log files
- Create WorkerLogViewer component with search & filters
- Integrate log viewer into CookieRotationPanel
- Add log button next to running workers in dashboard
- Supports real-time log viewing with 2s polling
- Full search, filter, and sort capabilities
- Proper isolation for worker process logs

Closes #[issue-number]
```
