# VEO3 Polling Architecture Flow

## Overview

This document describes the complete polling architecture for VEO3 video generation and upscaling. The architecture ensures that **only the backend worker thread makes frequent API calls to Google's servers**, while the frontend polls the local database for status updates.

## Core Principle

🔑 **Backend-only API polling**: The worker thread is the **sole component** making frequent API calls to Google's Flow API (10 requests/second). The frontend **never** calls Google's API directly for status checks.

## Architecture Components

### 1. Worker Thread (`veo3-polling.worker.ts`)

**Purpose**: Isolated thread that polls Google's API frequently and updates the database.

**Configuration**:

- `POLL_INTERVAL_MS`: 1000ms (1 second per cycle)
- `MAX_CONCURRENT_CHECKS`: 10 per cycle
- `MAX_ATTEMPTS`: 3600 (1 hour timeout)
- **Throughput**: 10 requests/second = 100 requests per 10 seconds

**Responsibilities**:

1. Maintains a queue of pending/processing videos
2. Polls Google's API every 1 second (10 concurrent checks per cycle)
3. Updates database with status changes (pending → processing → completed/failed)
4. Broadcasts status updates to all browser windows via IPC
5. Implements exponential backoff for retry logic (1s → 1.5s → 2.25s → ... → 60s max)

**Key Functions**:

- `addJob()`: Add video to polling queue
- `pollNextBatch()`: Get next 10 videos ready for checking
- `checkJobStatus()`: Make API call, update DB, broadcast status
- `startPolling()` / `stopPolling()`: Timer management

### 2. Polling Manager (`veo3-polling-manager.service.ts`)

**Purpose**: Main process service that manages worker thread lifecycle.

**Responsibilities**:

1. Spawns and initializes worker thread
2. Routes messages between main process and worker
3. Broadcasts status updates to all browser windows
4. Handles worker crash recovery and job restoration
5. Provides API for adding/removing jobs from polling queue

**Key Methods**:

- `initialize()`: Spawn worker thread with DB path
- `addToPolling(id, promptId, type, profileId, operationName, sceneId)`: Add job to worker queue
- `removeFromPolling(id)`: Remove job from worker queue
- `handleWorkerCrash()`: Auto-restart worker and restore pending jobs
- `restorePendingJobs()`: Query DB for pending/processing items and re-add to queue

### 3. Video Creation Service (`veo3-video-creation.service.ts`)

**Purpose**: Handle single video generation.

**Flow**:

1. User initiates video generation
2. Service calls Google's API **once** to start generation
3. Service creates DB record with status "pending"
4. Service adds job to polling manager → worker thread handles frequent polling
5. Worker thread polls Google's API every 1 second until complete

```typescript
// After calling Google's generation API once
veo3PollingManager.addToPolling(generationId, undefined, "generation", profileId, operationName, sceneId);
```

### 4. Batch Generation Service (`veo3-batch-generation.service.ts`)

**Purpose**: Handle multiple video generations with delay between requests.

**Flow**:

1. User initiates batch generation (e.g., 100 videos)
2. Service iterates through requests with delay (e.g., 500ms between each)
3. For each video:
   - Call Google's API **once** to start generation
   - Create DB record with status "pending"
   - Add job to polling manager → worker thread handles frequent polling
4. Service broadcasts progress events to frontend
5. Worker thread polls all 100 videos concurrently (10 per second)

```typescript
// After each successful generation API call
veo3PollingManager.addToPolling(
  result.data.generationId,
  request.promptId,
  "generation",
  request.profileId,
  result.data.operationName,
  result.data.sceneId
);
```

### 5. Status Checker Service (`veo3-status-checker.service.ts`)

**Purpose**: Handle **manual** status refresh (user clicks refresh button).

**Important**: This service is **NOT** used for frequent polling. It's only called when the user manually clicks the refresh button in the UI.

**Flow**:

1. User clicks "Refresh Status" button
2. Service calls Google's API **once** to check status
3. Service updates DB with latest status
4. Frontend re-fetches from DB to show updated data

### 6. Frontend Components

#### VideoHistoryContext (`VideoHistoryContext.tsx`)

**Purpose**: Manage video history list and status updates.

**Polling Strategy**: ✅ DB-only queries (no Google API calls)

**Flow**:

1. Component loads video history from DB via `getVideoHistoryGroupedByDate()` IPC
2. Component listens to `veo3:generation:status` events broadcast by worker thread
3. When user clicks "Refresh Status":
   - Call `getGenerationStatusFromDB(generationId)` to query DB only
   - Re-fetch video history to show updated data
4. Worker thread updates DB automatically → next query shows latest status

```typescript
// OLD (incorrect - called Google API directly)
const result = await veo3IPC.refreshVideoStatus(generation.operationName, generation.id);

// NEW (correct - queries DB only)
const result = await veo3IPC.getGenerationStatusFromDB(generation.id);
```

#### VideoPromptRow (`VideoPromptRow.tsx`)

**Purpose**: Display single video generation prompt and status.

**Polling Strategy**: ✅ Event-driven (listens to worker broadcasts)

**Flow**:

1. Component renders video generation card
2. Component listens to `veo3:generation:status` events (set up in parent page)
3. When worker thread updates status → event received → UI updates automatically
4. Component shows fake progress bar animation (UI only, not polling)

#### SingleVideoCreationPage (`SingleVideoCreationPage.tsx`)

**Purpose**: Main page for video creation.

**Event Listeners**:

```typescript
// Listen to worker thread broadcasts
electronAPI.on("veo3:generation:status", (data: any) => {
  console.log("📨 veo3:generation:status event received:", data);
  // Update UI with new status from worker thread
});
```

## Complete Flow Example

### Scenario: User generates 100 videos

1. **User Action**: Click "Generate 100 Videos" button
2. **Batch Service**:
   - Iterates through 100 prompts with 500ms delay between each
   - For each prompt: Call Google API **once** → Create DB record → Add to worker queue
   - Takes ~50 seconds to queue all 100 videos
3. **Worker Thread** (runs in parallel):
   - Polls 10 videos per second (100 videos per 10 seconds)
   - For each video: Check Google API → Update DB → Broadcast status event
   - Continues until all 100 videos are completed or failed
4. **Frontend**:
   - Receives `veo3:generation:status` events from worker thread
   - Updates UI in real-time as videos complete
   - Can query DB for latest status via `getGenerationStatusFromDB()`

### API Call Count

- **Initial generation**: 100 API calls (1 per video, sequential with delay)
- **Status polling** (worker thread): 10 calls/second until all complete
  - If videos take 5 minutes to complete: ~3,000 API calls total
  - Spread evenly: 10 calls/second (respects rate limits)
- **Manual refresh** (user clicks): 1 API call per refresh (rare)

## IPC Handlers

### Backend Handlers (`video-generation.ts`)

```typescript
// DB-only status queries (no API calls)
{
  channel: "veo3:getGenerationStatusFromDB",
  description: "Get video generation status from DB only (no API call)",
  handler: async (req: { generationId: string }) => {
    return await flowVeo3ApiService.getGenerationById(req.generationId);
  },
}

{
  channel: "veo3:getMultipleGenerationStatusFromDB",
  description: "Get multiple video generation statuses from DB only (no API call)",
  handler: async (req: { generationIds: string[] }) => {
    const results = await Promise.all(
      req.generationIds.map((id) => flowVeo3ApiService.getGenerationById(id))
    );
    return { success: true, data: results.map((r) => r.data).filter(Boolean) };
  },
}

// Manual refresh (user-initiated, rare)
{
  channel: "veo3:refreshVideoStatus",
  description: "Manually refresh video status by operation name",
  handler: async (req: { operationName: string; generationId: string }) => {
    return await flowVeo3ApiService.refreshVideoStatus(req.operationName, req.generationId);
  },
}
```

### Frontend IPC Client (`veo3.ts`)

```typescript
// DB-only status queries
const getGenerationStatusFromDB = (generationId: string) => {
  if ((window as any).electronAPI.veo3?.getGenerationStatusFromDB)
    return (window as any).electronAPI.veo3.getGenerationStatusFromDB(generationId);
  return invoke("veo3:getGenerationStatusFromDB", { generationId });
};

const getMultipleGenerationStatusFromDB = (generationIds: string[]) => {
  if ((window as any).electronAPI.veo3?.getMultipleGenerationStatusFromDB)
    return (window as any).electronAPI.veo3.getMultipleGenerationStatusFromDB(generationIds);
  return invoke("veo3:getMultipleGenerationStatusFromDB", { generationIds });
};

// Manual refresh (user-initiated)
const refreshVideoStatus = (operationName: string, generationId: string) => {
  if ((window as any).electronAPI.veo3?.refreshVideoStatus)
    return (window as any).electronAPI.veo3.refreshVideoStatus(operationName, generationId);
  return invoke("veo3:refreshVideoStatus", { operationName, generationId });
};
```

## Event Broadcasting

### Worker Thread → Main Process → Frontend

```typescript
// Worker thread (veo3-polling.worker.ts)
sendMessage({
  type: "statusUpdate",
  jobType: "generation",
  data: {
    id: generationId,
    status: "completed",
    videoUrl: "https://...",
    completedAt: "2025-10-28T...",
  },
});

// Polling manager (veo3-polling-manager.service.ts)
private broadcastStatusUpdate(jobType: "generation" | "upscale", data: any) {
  const windows = BrowserWindow.getAllWindows();
  const channel = jobType === "upscale" ? "veo3:upscale:status" : "veo3:generation:status";
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  });
}

// Frontend (SingleVideoCreationPage.tsx)
electronAPI.on("veo3:generation:status", (data: any) => {
  console.log("📨 Status update:", data);
  // Update UI
});
```

## Database Schema

### Video Generations Table (`veo3_video_generations`)

Key columns for polling:

- `id`: Generation record ID (primary key)
- `status`: "pending" | "processing" | "completed" | "failed"
- `operation_name`: VEO3 operation name (for API polling)
- `scene_id`: Scene ID (for API polling)
- `profile_id`: Profile ID (for auth cookies)
- `media_generation_id`: Extracted from API response
- `video_url`: Final video URL (extracted from API response)
- `created_at`: Timestamp
- `updated_at`: Timestamp (updated by worker thread)
- `completed_at`: Timestamp (set when status becomes "completed" or "failed")

## Key Guarantees

✅ **Only worker thread makes frequent API calls** (10 req/s)
✅ **Frontend queries DB only** (no Google API calls)
✅ **Both single and batch generation add to worker queue** after initial API call
✅ **Worker thread updates DB automatically** every 1 second (10 videos per cycle)
✅ **Frontend receives real-time updates** via IPC events
✅ **Manual refresh available** for user-initiated status checks (rare)
✅ **Auto-recovery** on worker thread crash (restores pending jobs from DB)

## Performance Characteristics

- **Throughput**: 100 API calls per 10 seconds (10 req/s sustained)
- **Latency**: 1 second average (each video checked every 1-10 seconds depending on queue size)
- **Scalability**: Can handle 100+ concurrent videos efficiently
- **Rate Limiting**: Self-throttling ensures compliance with API limits
- **Resource Usage**: Minimal main process impact (worker thread isolated)
- **UI Responsiveness**: Main thread never blocks (all polling in worker)

## Troubleshooting

### Frontend not updating status

**Check**:

1. Is worker thread running? Check `veo3PollingManager.isInitialized`
2. Are IPC events being received? Check browser console for `📨 veo3:generation:status`
3. Is video in worker queue? Call `veo3PollingManager.getQueueStatus()`

### Worker thread not polling

**Check**:

1. Is worker initialized? Check logs for `[PollingManager] Polling worker initialized`
2. Are jobs in queue? Check `pollNextBatch()` returning jobs
3. Is backoff delay preventing checks? Check `job.backoffMs` and `job.lastChecked`

### Database not updating

**Check**:

1. Is worker thread receiving API responses? Check logs for `[Worker] Checking job status`
2. Is DB connection healthy? Check for SQLite errors in logs
3. Is extraction logic working? Check `extractVideoMetadata()` output

## Migration Notes

### Before (Incorrect Pattern)

```typescript
// ❌ Frontend called Google API directly
const result = await veo3IPC.refreshVideoStatus(operationName, generationId);
```

### After (Correct Pattern)

```typescript
// ✅ Frontend queries DB only (worker thread handles API polling)
const result = await veo3IPC.getGenerationStatusFromDB(generationId);

// ✅ Frontend listens to worker broadcasts
electronAPI.on("veo3:generation:status", (data: any) => {
  // Update UI automatically
});
```

## Future Enhancements

1. **Priority Queue**: Allow urgent videos to poll more frequently
2. **Adaptive Polling**: Adjust polling frequency based on typical completion time
3. **Batch Status Queries**: Query multiple videos in single API call (if API supports)
4. **Status Prediction**: ML model to predict completion time based on prompt complexity
5. **Queue Analytics**: Track average completion time, failure rates, bottlenecks

## Related Documentation

- [Polling Worker Architecture](./POLLING_WORKER_ARCHITECTURE.md) - Technical details
- [Polling Worker Quick Start](./POLLING_WORKER_QUICK_START.md) - Usage guide
- [Video Creation Flow](../../video-creation/VIDEO_CREATION_FLOW.md) - End-to-end flow
