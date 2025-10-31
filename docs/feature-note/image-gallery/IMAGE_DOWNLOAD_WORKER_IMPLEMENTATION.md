# Image Download Worker Implementation

**Date**: 2025-01-XX  
**Status**: ✅ Implemented  
**Related Issues**: Image download 400 errors, duplicate records, pagination limits

## Overview

Implemented worker thread-based image downloading to prevent blocking the main Electron process during batch downloads. This follows the same pattern as the existing video download module.

## Problem Statement

**Previous Issues:**

1. **URL Encoding Bug**: `encodeURIComponent()` was encoding special characters (`$` → `%24`), breaking API calls
2. **Duplicate Records**: Force refresh created 5 duplicates of 18 images (90 total) due to faulty pagination
3. **Pagination Limit**: Only fetched first 18 images despite user having 42 total
4. **Blocking Downloads**: Sequential download loop blocked main process during batch operations

## Solution Architecture

### 1. Worker Thread Pattern

Created dedicated worker service following project's established pattern:

```
src/main/modules/ai-video-creation/image-veo3-apis/
├── types/
│   └── download.types.ts           # Job/Result types for worker communication
├── workers/
│   └── image-download.worker.ts    # Worker thread for parallel downloads
└── services/
    ├── image-download.service.ts   # Worker pool manager
    └── image-veo3.service.ts       # Updated to use worker service
```

### 2. Key Components

#### **`download.types.ts`**

- `ImageDownloadJob`: Worker job structure with auth tokens, paths, image metadata
- `ImageDownloadResult`: Worker result with success/failure status
- `PendingImageDownload`: Promise wrapper for async download tracking
- `ImageDownloadStatus`: Queue status for monitoring

#### **`image-download.worker.ts`**

- Runs in separate thread to avoid blocking main process
- Tries API fetch first (with bearer token + FLOW_NEXT_KEY)
- Falls back to fifeUrl if API fails
- Handles date-based folder structure (YYYY-MM-DD)
- **Critical**: Uses raw image names without URL encoding

#### **`image-download.service.ts`**

- Manages worker pool (default 4 concurrent workers)
- Queue management for batched downloads
- Auto-restart workers on errors
- Progress callbacks for UI updates
- Lazy Proxy pattern for safe initialization

#### **`image-veo3.service.ts`** (Updated)

- `downloadImages()` now uses worker pool instead of sequential loop
- Accepts optional `onProgress` callback for UI updates
- Automatically updates database with `localPath` on successful downloads
- Skips already-downloaded images before worker submission

### 3. Pagination & Sync Fixes

#### **Before:**

```typescript
async syncImageMetadata(
  profileId: string,
  maxPages?: number,
  startCursor?: string | null,
  forceRefresh?: boolean
)
```

#### **After:**

```typescript
async syncImageMetadata(profileId: string)
```

**Changes:**

- Removed `maxPages`, `startCursor`, `forceRefresh` parameters
- Always deletes existing images before sync (fresh start)
- Fetches ALL pages until `nextPageToken === null`
- Prevents duplicates by checking `findByName()` before insert
- Enhanced logging with page-by-page progress

### 4. URL Encoding Fix

**Before:**

```typescript
const encodedImageName = encodeURIComponent(cleanImageName);
const url = `${baseUrl}/media/${encodedImageName}?key=${apiKey}...`;
// Result: CAMaJD$... → CAMaJD%24... (broken)
```

**After:**

```typescript
const cleanImageName = imageName.replace(/[\s\r\n\t]+/g, "");
const url = `${baseUrl}/media/${cleanImageName}?key=${apiKey}...`;
// Result: CAMaJD$... → CAMaJD$... (works!)
```

## IPC Interface Changes

### **Preload Bridge** (`src/main/preload.ts`)

**Before:**

```typescript
syncMetadata: (profileId, maxPages?, startCursor?) => ...
```

**After:**

```typescript
syncMetadata: (profileId) => ...
```

### **Handler Signatures** (No changes needed)

Existing `image-veo3:download-batch` handler already compatible with worker-based implementation.

## UI Changes

### **ImageGalleryDrawer.tsx**

**Before:**

- Separate "Sync New" and "Force Refresh" buttons
- `handleSyncFromFlow(forceRefresh: boolean)` with conditional logic

**After:**

- Single "Sync All Images" button
- `handleSyncFromFlow()` - always starts fresh
- Download button already supports batch downloads (uses `downloadBatch` IPC)

## Database Cleanup

**Manual cleanup performed:**

```sql
DELETE FROM veo3_image_generations
WHERE id NOT IN (
  SELECT MIN(id)
  FROM veo3_image_generations
  GROUP BY name
);
-- Removed 72 duplicate records (90 → 18 unique)
```

## Performance Benefits

### **Sequential Download (Old)**

- **Blocking**: Main process frozen during downloads
- **Speed**: ~1-2 seconds per image × 42 images = **84+ seconds total**
- **UI**: Completely unresponsive during operation

### **Worker Pool Download (New)**

- **Non-blocking**: Main process remains responsive
- **Parallel**: 4 concurrent workers
- **Speed**: 42 images ÷ 4 workers = **~11 batches × 2 seconds ≈ 22 seconds total**
- **UI**: Smooth with progress updates

## Testing Checklist

- [x] Build succeeds without TypeScript errors
- [ ] Sync fetches all 42 images (not just 18)
- [ ] Download uses worker threads (check console for worker logs)
- [ ] UI remains responsive during batch download
- [ ] Database updates with `localPath` after successful downloads
- [ ] Images saved to correct date-based folders (YYYY-MM-DD)
- [ ] Worker pool properly handles errors and retries

## Usage

### **Sync All Images**

```typescript
// Renderer
const result = await window.electronAPI.imageVeo3.syncMetadata(profileId);
// Deletes old records, fetches ALL pages from API
```

### **Download Images**

```typescript
// Renderer
const imageNames = images.filter((img) => !img.localPath).map((img) => img.name);
const result = await window.electronAPI.imageVeo3.downloadBatch(profileId, imageNames, storagePath);
// Uses worker pool for parallel downloads
```

## Files Modified

1. **Created:**

   - `types/download.types.ts` - Worker communication types
   - `workers/image-download.worker.ts` - Download worker implementation
   - `services/image-download.service.ts` - Worker pool manager

2. **Updated:**

   - `services/image-veo3.service.ts` - Use worker service for downloads
   - `handlers/registrations.ts` - Simplified sync handler signature
   - `src/main/preload.ts` - Removed pagination parameters from sync
   - `src/renderer/components/.../ImageGalleryDrawer.tsx` - Simplified UI

3. **Fixed:**
   - `apis/image-veo3-api.client.ts` - Removed URL encoding for image names

## Known Limitations

- Worker pool size hardcoded to 4 (could be configurable in future)
- No progress bar for individual image downloads (only batch completion)
- Database updates happen asynchronously during downloads (eventual consistency)

## Next Steps

1. Test with full 42-image account to verify pagination works
2. Add progress bar UI for download queue status
3. Consider adding download resume/retry logic for failed images
4. Monitor worker thread memory usage with large batches

## References

- Worker pattern: `src/main/modules/common/video-download/`
- Repository pattern: `docs/implement-note/WORKER_THREAD_SINGLETON_PATTERN.md`
- Migration pattern: `src/main/storage/migrations/`
