# Video Upscale Without Database Constraint

## Problem

When trying to upscale videos from historical data (generated before the `veo3_video_upscales` table was created), the operation fails with:

```
❌ Upscale failed: Error: SQLITE_CONSTRAINT: FOREIGN KEY constraint failed
```

This happens because the `veo3_video_upscales` table has a foreign key constraint on `source_generation_id` that references `veo3_video_generations(id)`. Old video generations might not exist in the database, causing the foreign key violation.

## Solution

**Approach:** Skip database operations entirely when the video is already upscaled (returns `rawBytes` immediately). Only interact with the database during polling or when explicitly saving.

### Key Changes

#### 1. **Skip DB Insert for Already-Completed Upscales**

When `alreadyCompleted` is detected:

- Don't create database record
- Return raw data directly for immediate download
- Generate upscale ID for tracking but don't persist it
- Include all necessary metadata in the response

```typescript
// In veo3-video-upscale.service.ts
if (alreadyCompleted && sceneId) {
  logger.info(`Skipping database insert - returning data directly for immediate download`);

  return {
    success: true,
    data: {
      upscaleId: upscaleId, // Generate ID but don't save to DB
      sceneId,
      operationName: "already-completed",
      alreadyCompleted: true,
      mediaGenerationId,
      rawBytes, // Include for immediate download
      // Include source info for reference
      sourceGenerationId,
      profileId: sourceGeneration.profileId,
      projectId: sourceGeneration.projectId,
      model,
    },
  };
}
```

#### 2. **New Method: `downloadBase64VideoDirectly()`**

Added method to download and decode base64 video without requiring a database record:

```typescript
async downloadBase64VideoDirectly(
  rawBytes: string,
  outputPath?: string,
  sourceGenerationId?: string
): Promise<ApiResponse<{ filePath: string }>>
```

**Features:**

- No database dependency
- Accepts raw base64 data directly
- Generates safe default output path
- Returns file path after successful save

#### 3. **New IPC Channel: `veo3:upscale:downloadBase64Directly`**

```typescript
{
  channel: "veo3:upscale:downloadBase64Directly",
  description: "Download and decode base64 video data directly without DB dependency",
  handler: async (req: {
    rawBytes: string;
    outputPath?: string;
    sourceGenerationId?: string
  }) => {
    return await veo3VideoUpscaleService.downloadBase64VideoDirectly(
      req.rawBytes,
      req.outputPath,
      req.sourceGenerationId
    );
  }
}
```

#### 4. **Skip Polling for Already-Completed Upscales**

Updated the IPC handler to skip adding already-completed upscales to the polling queue:

```typescript
if (result.success && result.data) {
  if (!result.data.alreadyCompleted) {
    veo3PollingService.addToPolling(result.data.upscaleId, undefined, "upscale");
    logger.info(`[IPC] Added upscale ${result.data.upscaleId} to polling queue`);
  } else {
    logger.info(`[IPC] Upscale already completed, skipping polling. Ready for immediate download.`);
  }
}
```

## Usage Flow

### For Already-Upscaled Videos (No DB Record Needed)

```typescript
// 1. Start upscale (works even if source_generation_id is not in DB)
const result = await window.electronAPI.invoke("veo3:upscale:start", {
  sourceGenerationId: "old-generation-id", // Might not exist in DB
});

if (result.success && result.data.alreadyCompleted) {
  console.log("Video already upscaled!");

  // 2. Download directly using rawBytes (no DB lookup)
  const downloadResult = await window.electronAPI.invoke("veo3:upscale:downloadBase64Directly", {
    rawBytes: result.data.rawBytes,
    outputPath: "C:\\Videos\\upscaled.mp4", // Optional
    sourceGenerationId: result.data.sourceGenerationId, // For filename
  });

  if (downloadResult.success) {
    console.log(`Saved to: ${downloadResult.data.filePath}`);
  }
}
```

### For Pending Upscales (Uses DB for Polling)

```typescript
// Normal flow - uses database for tracking and polling
const result = await window.electronAPI.invoke("veo3:upscale:start", {
  sourceGenerationId: "generation-id",
});

if (result.success && !result.data.alreadyCompleted) {
  // Database record created, polling started automatically
  console.log(`Upscale ID: ${result.data.upscaleId}`);
  // Check status later via polling or manual check
}
```

## Benefits

✅ **No Foreign Key Errors**: Works with old/missing generation records  
✅ **No Unnecessary DB Writes**: Skips database for already-completed videos  
✅ **Backward Compatible**: Normal pending upscales still use DB for tracking  
✅ **Immediate Download**: Already-upscaled videos can be downloaded right away  
✅ **Clean Separation**: DB operations only during polling, not during upscale start

## Database Interaction Summary

| Scenario                               | DB Insert? | Polling? | Download Method                     |
| -------------------------------------- | ---------- | -------- | ----------------------------------- |
| **Already Upscaled** (historical data) | ❌ No      | ❌ No    | `downloadBase64Directly()`          |
| **Pending Upscale** (new request)      | ✅ Yes     | ✅ Yes   | Wait for polling completion         |
| **From DB Record** (existing upscale)  | N/A        | N/A      | `downloadUpscaledVideoFromBase64()` |

## Files Modified

### Core Changes

- `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-video-upscale.service.ts`

  - Updated `startVideoUpscale()` to skip DB insert for already-completed
  - Added `downloadBase64VideoDirectly()` method
  - Updated return type to include optional fields

- `src/main/modules/ai-video-creation/flow-veo3-apis/handlers/video-upscale.ts`
  - Added `veo3:upscale:downloadBase64Directly` IPC handler
  - Updated `veo3:upscale:start` to skip polling for already-completed

## Testing Checklist

- [x] Build succeeds with no TypeScript errors
- [ ] Upscale old/missing generation ID → Returns `alreadyCompleted: true` with `rawBytes`
- [ ] Call `downloadBase64Directly()` with rawBytes → Creates valid MP4 file
- [ ] Verify no database insert happens for already-completed upscales
- [ ] Verify polling is NOT started for already-completed upscales
- [ ] Verify normal pending upscales still work (DB insert + polling)
- [ ] Verify foreign key error is eliminated for historical data

## Migration Notes

**No database migration needed!** This is purely a logic change that bypasses database operations for already-completed upscales.

---

**Last Updated:** October 28, 2025  
**Status:** ✅ Implemented  
**Issue:** SQLITE_CONSTRAINT: FOREIGN KEY constraint failed  
**Solution:** Skip DB operations for already-completed upscales
