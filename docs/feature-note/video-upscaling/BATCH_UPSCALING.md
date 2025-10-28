# Batch Video Upscaling Feature

## Overview

Batch upscaling allows you to upscale multiple completed videos to higher resolution (1080p) with configurable delays between requests. Similar to batch generation, it supports both async (non-blocking) and sync (blocking) modes.

## Service: VEO3BatchUpscaleService

### Methods

#### 1. Upscale Multiple Videos Asynchronously

```typescript
async upscaleMultipleVideosAsync(
  requests: BatchUpscaleRequest[],
  delayMs: number = 1500,
  onProgress?: BatchUpscaleProgressCallback
): Promise<ApiResponse<{ batchId: string; total: number }>>
```

**Features:**

- Returns immediately with batch ID
- Processes upscales in background
- Broadcasts progress events to all clients
- Sends events to all windows (survives page refreshes)
- Automatically adds upscales to polling queue

**Usage (Renderer):**

```typescript
const result = await window.electronAPI.invoke("veo3:upscale:multipleAsync", {
  requests: [
    { sourceGenerationId: "gen1", model: "veo_2_1080p_upsampler_8s" },
    { sourceGenerationId: "gen2", model: "veo_2_1080p_upsampler_8s" },
    { sourceGenerationId: "gen3" }, // Uses default model
  ],
  delayMs: 1500, // Optional, default: 1500ms
});

if (result.success) {
  const { batchId, total } = result.data;
  console.log(`Batch ${batchId} started for ${total} videos`);
}
```

#### 2. Upscale Multiple Videos Synchronously

```typescript
async upscaleMultipleVideosSync(
  requests: BatchUpscaleRequest[],
  delayMs: number = 1500
): Promise<ApiResponse<Array<{ success: boolean; upscaleId?: string; ... }>>>
```

**Features:**

- Blocking operation (waits for all upscales to initiate)
- Returns array of results for each request
- Includes error details for failed upscales
- Useful for scripting or when you need immediate confirmation

**Usage (Renderer):**

```typescript
const result = await window.electronAPI.invoke("veo3:upscale:multipleSync", {
  requests: [{ sourceGenerationId: "gen1" }, { sourceGenerationId: "gen2" }],
  delayMs: 2000,
});

if (result.success) {
  result.data.forEach((item, index) => {
    if (item.success) {
      console.log(`✅ [${index + 1}] Upscale started: ${item.upscaleId}`);
    } else {
      console.log(`❌ [${index + 1}] Failed: ${item.error}`);
    }
  });
}
```

## IPC Channels

### Async Upscale

**Channel:** `veo3:upscale:multipleAsync`

Request:

```json
{
  "requests": [{ "sourceGenerationId": "id1", "model": "veo_2_1080p_upsampler_8s" }, { "sourceGenerationId": "id2" }],
  "delayMs": 1500
}
```

Response:

```json
{
  "success": true,
  "data": {
    "batchId": "abc123def456",
    "total": 2
  }
}
```

### Sync Upscale

**Channel:** `veo3:upscale:multipleSync`

Request: Same as async

Response:

```json
{
  "success": true,
  "data": [
    {
      "success": true,
      "upscaleId": "upscale1",
      "sceneId": "scene1",
      "operationName": "op1",
      "sourceGenerationId": "gen1"
    },
    {
      "success": false,
      "error": "Source video must be completed before upscaling",
      "sourceGenerationId": "gen2"
    }
  ]
}
```

## Progress Events

### Batch Started

**Event:** `veo3:batch:upscale:started`

Fired when batch processing begins:

```json
{
  "batchId": "abc123def456",
  "total": 2,
  "sourceGenerationIds": ["gen1", "gen2"]
}
```

### Progress Update

**Event:** `veo3:batch:upscale:progress`

Fired for each completed upscale request:

```json
{
  "sourceGenerationId": "gen1",
  "success": true,
  "upscaleId": "upscale1",
  "sceneId": "scene1",
  "operationName": "op1",
  "index": 1,
  "total": 2
}
```

Or on error:

```json
{
  "sourceGenerationId": "gen2",
  "success": false,
  "error": "Profile has no active 'flow' cookies",
  "index": 2,
  "total": 2
}
```

### Batch Completed

**Event:** `veo3:batch:upscale:completed`

Fired when all upscales in batch are initiated:

```json
{
  "batchId": "abc123def456",
  "successCount": 2,
  "failureCount": 0,
  "total": 2
}
```

## Listening for Progress Events

### In React Component

```typescript
useEffect(() => {
  const handleBatchStarted = (data) => {
    console.log(`Batch ${data.batchId} started for ${data.total} videos`);
  };

  const handleProgress = (data) => {
    console.log(
      `[${data.index}/${data.total}] ${data.sourceGenerationId}:`,
      data.success ? `✅ ${data.upscaleId}` : `❌ ${data.error}`
    );
  };

  const handleBatchCompleted = (data) => {
    console.log(`Batch completed: ${data.successCount} success, ${data.failureCount} failed`);
  };

  window.electronAPI.on("veo3:batch:upscale:started", handleBatchStarted);
  window.electronAPI.on("veo3:batch:upscale:progress", handleProgress);
  window.electronAPI.on("veo3:batch:upscale:completed", handleBatchCompleted);

  return () => {
    window.electronAPI.off("veo3:batch:upscale:started", handleBatchStarted);
    window.electronAPI.off("veo3:batch:upscale:progress", handleProgress);
    window.electronAPI.off("veo3:batch:upscale:completed", handleBatchCompleted);
  };
}, []);
```

## Configuration

### Delay Between Requests

- **Default:** 1500ms
- **Purpose:** Prevent API rate limiting
- **Recommendation:** 1000-2000ms for stable operation

### Model Selection

- **Default:** `veo_2_1080p_upsampler_8s` (1080p upsampler)
- **Per-request:** Can specify different model for each upscale
- **Future:** Could support other models like 4K upsampler

## Request Validation

Each upscale request is validated before processing:

✅ **Requirements:**

- Source video must exist in database
- Source video must have status `"completed"`
- Source video must have a `mediaGenerationId`
- Profile must be logged in
- Profile must have active "flow" cookies

❌ **Rejection Reasons:**

- Source video not found
- Source video not completed yet
- Source video has no media generation ID
- Profile not found or not logged in
- Profile has no active flow cookies

## Error Handling

Failed upscales are logged but don't stop batch processing:

```typescript
// Single upscale failure won't prevent others from being processed
const result = await window.electronAPI.invoke("veo3:upscale:multipleAsync", {
  requests: [
    { sourceGenerationId: "gen1" }, // ✅ Proceeds
    { sourceGenerationId: "gen2" }, // ❌ Fails (not completed)
    { sourceGenerationId: "gen3" }, // ✅ Proceeds
  ],
});
// Batch continues: 2 succeeded, 1 failed
```

## Background Processing

### How It Works

1. **Request Received** → Batch ID generated → Event sent to all clients
2. **Processing Starts** → Runs in background on main process
3. **Per Item:**
   - Start upscale via API
   - Create upscale record in database
   - Add to polling service (for status tracking)
   - Broadcast progress event to all clients
   - Wait `delayMs` before next item
4. **Batch Complete** → Completion event sent to all clients
5. **Status Tracking** → Polling service monitors upscale status automatically

### Advantages

- ✅ Non-blocking UI
- ✅ Survives page refreshes (broadcasts to all windows)
- ✅ Automatic status tracking
- ✅ No client polling required
- ✅ Works even if original request window closes

## Use Cases

### 1. Quick Upscale of Recent Videos

```typescript
// Upscale the 5 most recent completed videos
const recentGenerations = await videoGenerationRepository.getByStatus("completed", 5);
const upscaleRequests = recentGenerations.map((gen) => ({
  sourceGenerationId: gen.id,
}));

await window.electronAPI.invoke("veo3:upscale:multipleAsync", {
  requests: upscaleRequests,
  delayMs: 2000,
});
```

### 2. Batch Upscale with Progress UI

```typescript
const [batchProgress, setBatchProgress] = useState(null);
const [progressItems, setProgressItems] = useState([]);

useEffect(() => {
  window.electronAPI.on('veo3:batch:upscale:started', (data) => {
    setBatchProgress(data);
    setProgressItems([]);
  });

  window.electronAPI.on('veo3:batch:upscale:progress', (data) => {
    setProgressItems(prev => [...prev, data]);
  });

  return () => {
    window.electronAPI.off('veo3:batch:upscale:started', ...);
    window.electronAPI.off('veo3:batch:upscale:progress', ...);
  };
}, []);

return (
  <div>
    {batchProgress && (
      <ProgressBar
        current={progressItems.filter(p => p.success).length}
        total={batchProgress.total}
      />
    )}
    {progressItems.map((item, i) => (
      <div key={i}>
        [{item.index}/{item.total}] {item.sourceGenerationId}:
        {item.success ? `✅ ${item.upscaleId}` : `❌ ${item.error}`}
      </div>
    ))}
  </div>
);
```

### 3. Upscale All Pending Videos in Project

```typescript
// Get all completed videos for a project
const generations = await window.electronAPI.invoke("veo3:generation:listByStatus", {
  status: "completed",
  projectId: "project123",
});

// Filter those without upscales
const pendingUpscale = generations.filter((gen) => !gen.hasUpscale);

// Batch upscale
await window.electronAPI.invoke("veo3:upscale:multipleAsync", {
  requests: pendingUpscale.map((gen) => ({ sourceGenerationId: gen.id })),
  delayMs: 1500,
});
```

## Performance Considerations

### Batch Size

- **Small (1-5):** Instant, minimal delay
- **Medium (5-20):** 10-40 seconds depending on delays
- **Large (20+):** Consider breaking into multiple batches

### Delay Timing

- **1000ms:** Fast, low latency risk
- **1500ms:** Recommended (balanced)
- **2000ms+:** Safe for high concurrency

### Memory Impact

- Each upscale is processed sequentially
- Minimal memory overhead
- Suitable for large batches

## Comparison: Generation vs Upscale Batch

| Feature           | Generation Batch      | Upscale Batch               |
| ----------------- | --------------------- | --------------------------- |
| Purpose           | Create new videos     | Enhance existing videos     |
| Input             | Prompts + profiles    | Completed generations       |
| Validation        | More complex          | Simpler (must be completed) |
| Processing        | Text-to-video API     | Video enhancement API       |
| Time per item     | 2-5 minutes           | 1-3 minutes                 |
| Parallel          | Sequential with delay | Sequential with delay       |
| Progress tracking | Yes (automatic)       | Yes (automatic)             |

## Testing Checklist

- [ ] Generate multiple videos first
- [ ] Wait for them to complete
- [ ] Start batch upscale with 2-3 videos
- [ ] Verify batch started event
- [ ] Check progress events in browser console
- [ ] Verify upscales appear in database
- [ ] Monitor status updates via polling service
- [ ] Test with failed source (not completed)
- [ ] Test with invalid generation ID
- [ ] Test page refresh during batch
- [ ] Test with different delay values
