# Video Download Service - Worker Thread Implementation

## Overview

The download service has been enhanced to support concurrent downloads using Worker Threads, preventing the main app from blocking during video downloads.

## Architecture

```
├── services/
│   └── veo3-video-download.service.ts    # Main service with worker pool management
├── workers/
│   └── video-download.worker.ts          # Worker thread implementation
└── handlers/
    └── download.ts                        # IPC handler registration
```

## Key Features

### 1. **Worker Pool Management**

- Maintains a pool of 4 concurrent worker threads
- Automatically recreates failed workers
- Handles worker lifecycle management

### 2. **Download Queue**

- Queues downloads when all workers are busy
- Processes queue automatically as workers become available
- Supports concurrent downloads without blocking

### 3. **Single Download**

```typescript
const result = await veo3VideoDownloadService.downloadVideo(videoUrl, filename);
```

### 4. **Batch Downloads with Progress**

```typescript
const results = await veo3VideoDownloadService.downloadMultipleVideos(
  [
    { videoUrl: "https://...", filename: "video1" },
    { videoUrl: "https://...", filename: "video2" },
  ],
  (progress) => {
    console.log(`Download completed: ${progress.id}`);
  }
);
```

### 5. **Status Monitoring**

```typescript
const status = veo3VideoDownloadService.getStatus();
// { activeDownloads: 2, queuedDownloads: 3, workerCount: 4 }
```

## IPC Channels

### `veo3:downloadVideo`

Download a single video

```typescript
await electronAPI.veo3.downloadVideo(videoUrl, filename);
```

### `veo3:downloadMultipleVideos`

Download multiple videos concurrently

```typescript
await electronAPI.veo3.downloadMultipleVideos(videos);
```

### `veo3:downloadStatus`

Get current download queue status

```typescript
await electronAPI.veo3.downloadStatus();
```

### `veo3:downloadProgress` (Event)

Listen to download progress events

```typescript
electronAPI.veo3.onDownloadProgress((result) => {
  console.log(`Downloaded: ${result.filePath}`);
});
```

## Implementation Details

### Worker Thread Flow

1. **Main Thread** → Receives download request
2. **Main Thread** → Creates job with unique ID
3. **Main Thread** → Queues job if workers busy, or assigns to available worker
4. **Worker Thread** → Downloads video to file
5. **Worker Thread** → Sends result back to main thread
6. **Main Thread** → Sends progress event to renderer
7. **Main Thread** → Returns worker to pool for next job

### Filename Handling

- Automatically adds `.mp4` extension if missing
- Sanitizes filenames (removes invalid characters)
- Saves to user's Downloads folder
- Generates unique filenames if not provided: `video-{timestamp}.mp4`

### Error Handling

- Worker failures are caught and logged
- Failed workers are replaced automatically
- Individual download errors don't affect others
- Error details returned in result object

## Performance Benefits

✅ **Non-blocking** - Downloads happen in separate threads  
✅ **Concurrent** - Up to 4 videos downloading simultaneously  
✅ **Queued** - Additional downloads wait in queue  
✅ **Monitored** - Track progress of batch downloads  
✅ **Resilient** - Failed workers auto-restart

## Files Modified/Created

- ✅ `veo3-video-download.service.ts` - Enhanced with worker pool
- ✅ `video-download.worker.ts` - New worker thread implementation
- ✅ `download.ts` - Updated handlers with batch download support
- ✅ `preload.ts` - Exposed new download methods and events
