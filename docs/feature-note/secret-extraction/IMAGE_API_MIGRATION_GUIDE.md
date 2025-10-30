# Image Sync API Migration Guide

## Summary of Changes

The `image-veo3:sync-from-flow` IPC channel has been refactored into a two-phase approach for better performance and control.

## ✅ What Was Fixed

1. **Puppeteer Chrome detection** - Auto-detects Chrome executable on Windows
2. **IPC channel mismatch** - Fixed missing handler error
3. **Two-phase image sync** - Separated metadata sync from image download
4. **Backward compatibility** - Old `syncFromFlow` method still works (deprecated)

## API Changes

### Old API (Still Works - Deprecated)

```typescript
// Single call that does everything (slower)
const result = await window.electronAPI.imageVeo3.syncFromFlow(
  profileId,
  localStoragePath,
  maxPages
);
// Returns: { success: boolean, data: { synced: number, skipped: number } }
```

**Behavior**: 
- Fetches metadata
- Automatically downloads ALL images
- Slower (30-60s for 18 images)

### New API (Recommended)

#### Phase 1: Sync Metadata (Fast)

```typescript
const result = await window.electronAPI.imageVeo3.syncMetadata(
  profileId,
  maxPages,      // Optional: limit pages
  startCursor    // Optional: resume from cursor
);
// Returns: { 
//   success: boolean, 
//   data: { 
//     synced: number, 
//     skipped: number, 
//     lastCursor?: string,
//     hasMore: boolean 
//   } 
// }
```

**Behavior**:
- Only fetches metadata (< 1s per 18 images)
- Stores: name, workflowId, mediaKey, aspectRatio, fifeUrl
- Does NOT download images

#### Phase 2: Download Images (On-Demand)

**Single Image**:
```typescript
const result = await window.electronAPI.imageVeo3.downloadSingle(
  profileId,
  imageName,        // CAMa... (from metadata)
  localStoragePath
);
// Returns: { success: boolean, data: { localPath: string } }
```

**Batch Download**:
```typescript
const result = await window.electronAPI.imageVeo3.downloadBatch(
  profileId,
  imageNames,       // Array of CAMa... names
  localStoragePath
);
// Returns: { 
//   success: boolean, 
//   data: { 
//     downloaded: number, 
//     failed: number, 
//     failedNames: string[] 
//   } 
// }
```

## Migration Examples

### Example 1: Basic Migration (Simplest)

**Before**:
```typescript
const result = await window.electronAPI.imageVeo3.syncFromFlow(
  profileId,
  'C:\\images',
  5
);
```

**After** (Keep using old API - backward compatible):
```typescript
// Still works! Automatically syncs metadata + downloads all images
const result = await window.electronAPI.imageVeo3.syncFromFlow(
  profileId,
  'C:\\images',
  5
);
```

### Example 2: Optimized Two-Phase Approach

**Before**:
```typescript
// One call, downloads everything
const result = await window.electronAPI.imageVeo3.syncFromFlow(
  profileId,
  'C:\\images'
);
```

**After**:
```typescript
// Phase 1: Fast metadata sync
const metadataResult = await window.electronAPI.imageVeo3.syncMetadata(profileId);
console.log(`Synced ${metadataResult.data.synced} images metadata in < 1 second`);

// Phase 2: Download only what you need
const images = await window.electronAPI.imageVeo3.getLocalImages(profileId);
const pendingImages = images.data
  .filter(img => !img.localPath)
  .slice(0, 10); // Download first 10

const downloadResult = await window.electronAPI.imageVeo3.downloadBatch(
  profileId,
  pendingImages.map(img => img.name),
  'C:\\images'
);
console.log(`Downloaded ${downloadResult.data.downloaded} images`);
```

### Example 3: Resume from Cursor (Pagination)

**New capability** (not possible with old API):

```typescript
// First page
const page1 = await window.electronAPI.imageVeo3.syncMetadata(
  profileId,
  1  // maxPages: 1
);

// Store cursor in state/localStorage
const cursor = page1.data.lastCursor;

// Later: Resume from cursor
const page2 = await window.electronAPI.imageVeo3.syncMetadata(
  profileId,
  1,
  cursor  // startCursor
);

// Continue until no more pages
if (!page2.data.hasMore) {
  console.log('All metadata synced!');
}
```

### Example 4: Download Specific Images Only

**New capability**:

```typescript
// Sync all metadata
await window.electronAPI.imageVeo3.syncMetadata(profileId);

// Get images from DB
const images = await window.electronAPI.imageVeo3.getLocalImages(profileId);

// Filter by criteria (e.g., only landscape images)
const landscapeImages = images.data
  .filter(img => img.aspectRatio === 'IMAGE_ASPECT_RATIO_LANDSCAPE')
  .filter(img => !img.localPath);

// Download only landscape images
await window.electronAPI.imageVeo3.downloadBatch(
  profileId,
  landscapeImages.map(img => img.name),
  'C:\\images\\landscape'
);
```

## Performance Comparison

| Operation | Old API | New API (Metadata) | New API (Download) |
|-----------|---------|--------------------|--------------------|
| 18 images | 30-60s  | < 1s               | 20-40s (on-demand) |
| 100 images| 3-5 min | 5-10s              | 2-4 min (selective)|

## TypeScript Types

All types are already updated in `vite-env.d.ts`:

```typescript
interface Window {
  electronAPI: {
    imageVeo3: {
      // New methods
      syncMetadata: (profileId: string, maxPages?: number, startCursor?: string | null) => Promise<any>;
      downloadSingle: (profileId: string, imageName: string, localStoragePath: string) => Promise<any>;
      downloadBatch: (profileId: string, imageNames: string[], localStoragePath: string) => Promise<any>;
      
      // Existing methods (unchanged)
      upload: (profileId: string, imagePath: string, localStoragePath: string, aspectRatio?: string) => Promise<any>;
      fetchUserImages: (profileId: string, pageSize?: number, cursor?: string | null) => Promise<any>;
      getLocalImages: (profileId: string) => Promise<any>;
      
      // Deprecated (still works)
      /** @deprecated Use syncMetadata + downloadBatch for better control */
      syncFromFlow: (profileId: string, localStoragePath: string, maxPages?: number) => Promise<any>;
    };
  };
}
```

## Backward Compatibility

✅ **No breaking changes!**

The old `syncFromFlow` method is implemented as a wrapper that:
1. Calls `syncMetadata` to fetch metadata
2. Gets all images without `localPath`
3. Automatically calls `downloadBatch` to download them
4. Returns same response format as before

**You don't need to update existing code immediately.**

## Recommended Migration Strategy

1. **Keep using `syncFromFlow`** for now (no changes needed)
2. **Gradually migrate** to two-phase approach where it makes sense:
   - Use `syncMetadata` for initial sync
   - Use `downloadBatch` for selective downloads
3. **Add cursor tracking** in your store for pagination
4. **Monitor performance** improvements

## Store Integration (Zustand)

Recommended state structure:

```typescript
interface ImageSyncState {
  // Pagination
  lastCursor: Map<string, string | undefined>;
  hasMore: Map<string, boolean>;
  
  // Sync state
  isSyncingMetadata: Map<string, boolean>;
  isDownloadingImages: Map<string, boolean>;
  
  // Actions
  syncMetadata: (profileId: string, maxPages?: number) => Promise<void>;
  downloadImages: (profileId: string, imageNames: string[]) => Promise<void>;
}
```

## Related Documentation

- `docs/feature-note/secret-extraction/IMAGE_SYNC_TWO_PHASE_FLOW.md` - Complete architecture
- `docs/feature-note/secret-extraction/BUGFIX_PUPPETEER_AND_IMAGE_SYNC.md` - Bug fixes summary

## Need Help?

If you encounter issues:
1. Check logs for `[ImageVeo3Service]` and `[SecretExtractionService]`
2. Verify Chrome is installed (auto-detected on Windows)
3. Ensure profile has active Flow cookies
4. Check that `FLOW_NEXT_KEY` was extracted successfully
