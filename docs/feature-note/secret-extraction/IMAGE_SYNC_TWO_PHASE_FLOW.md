# Two-Phase Image Sync Flow

## Overview

Refactored image syncing to use a two-phase approach:
1. **Phase 1: Metadata Sync** (Fast) - Fetch all image metadata without downloading
2. **Phase 2: Image Download** (On-demand) - Download individual images as needed

This improves performance and allows better control over which images to download.

## Architecture Changes

### Phase 1: Metadata Sync (`syncImageMetadata`)

**Purpose**: Quickly fetch and store all image metadata from Flow server

**What it does**:
- Calls `fetchUserHistoryDirectly` API with pagination
- Stores image metadata in database: `name`, `workflowId`, `mediaKey`, `aspectRatio`, `fifeUrl`, `createdAt`
- Does NOT download or save image files
- Returns `lastCursor` for resuming pagination
- Can fetch all pages or limit with `maxPages` parameter

**What it stores in DB**:
```typescript
{
  id: "uuid",
  profileId: "profile_xxx",
  name: "CAMa...",  // mediaGenerationId
  aspectRatio: "IMAGE_ASPECT_RATIO_LANDSCAPE",
  workflowId: "uuid",
  mediaKey: "uuid",
  localPath: undefined,  // ← Not set yet
  fifeUrl: "https://storage.googleapis.com/...",
  createdAt: "2025-10-30T..."
}
```

**API Flow**:
```
GET /trpc/media.fetchUserHistoryDirectly?input={...}
  ↓
For each image in response:
  ├─ Extract mediaGenerationId (workflowId, mediaKey)
  ├─ Check if exists in DB (skip if yes)
  └─ Insert metadata into veo3_image_generations table
  ↓
Return { synced, skipped, lastCursor, hasMore }
```

**Performance**: 
- Fast (< 1 second per page of 18 images)
- No secret extraction needed
- No image download
- Stores cursor for resuming

### Phase 2: Image Download

#### Single Image Download (`downloadSingleImage`)

**Purpose**: Download one image by its name (mediaGenerationId)

**Requirements**:
- Image metadata must exist in DB (run metadata sync first)
- Requires `FLOW_NEXT_KEY` (auto-extracts if missing)
- Requires bearer token

**API Flow**:
```
Check if image exists in DB
  ↓
Check if already downloaded (has localPath)
  ↓ (if not downloaded)
Extract FLOW_NEXT_KEY (if missing)
  ↓
Get bearer token from cookies
  ↓
GET /v1/media/{name}?key={FLOW_NEXT_KEY}
  ↓
Receive base64 image data
  ↓
Save base64 to local file: {mediaKey}.jpg
  ↓
Update DB with localPath
```

**Performance**: 
- Slower (1-2 seconds per image)
- Requires secret extraction (one-time per session)
- Downloads actual image file

#### Batch Download (`downloadImages`)

**Purpose**: Download multiple images in parallel/sequence

**Parameters**:
- `profileId` - Profile ID
- `imageNames` - Array of image names (CAMa...)
- `localStoragePath` - Directory to save images

**Returns**:
```typescript
{
  downloaded: number,
  failed: number,
  failedNames: string[]
}
```

## IPC Channels

### Updated Channels

1. **`image-veo3:sync-metadata`** (Replaces `sync-from-flow`)
   ```typescript
   Request: {
     profileId: string,
     maxPages?: number,      // Optional: limit pages (default: fetch all)
     startCursor?: string    // Optional: resume from cursor
   }
   Response: {
     success: boolean,
     data?: {
       synced: number,
       skipped: number,
       lastCursor?: string,  // For pagination
       hasMore: boolean      // True if more pages available
     }
   }
   ```

2. **`image-veo3:download-single`** (New)
   ```typescript
   Request: {
     profileId: string,
     imageName: string,      // CAMa... (mediaGenerationId)
     localStoragePath: string
   }
   Response: {
     success: boolean,
     data?: { localPath: string }
   }
   ```

3. **`image-veo3:download-batch`** (New)
   ```typescript
   Request: {
     profileId: string,
     imageNames: string[],
     localStoragePath: string
   }
   Response: {
     success: boolean,
     data?: {
       downloaded: number,
       failed: number,
       failedNames: string[]
     }
   }
   ```

## Usage Examples

### Example 1: Sync All Image Metadata

```typescript
// Sync all pages
const result = await window.electronAPI.invoke('image-veo3:sync-metadata', {
  profileId: 'profile_xxx'
});

console.log(`Synced ${result.data.synced} images`);
console.log(`Has more: ${result.data.hasMore}`);
console.log(`Last cursor: ${result.data.lastCursor}`);
```

### Example 2: Resume from Cursor

```typescript
// First fetch
const page1 = await window.electronAPI.invoke('image-veo3:sync-metadata', {
  profileId: 'profile_xxx',
  maxPages: 1
});

// Resume from cursor
const page2 = await window.electronAPI.invoke('image-veo3:sync-metadata', {
  profileId: 'profile_xxx',
  maxPages: 1,
  startCursor: page1.data.lastCursor
});
```

### Example 3: Download Single Image

```typescript
const result = await window.electronAPI.invoke('image-veo3:download-single', {
  profileId: 'profile_xxx',
  imageName: 'CAMaJGNiYmNkN2ZhLWEwOWEtNDRmMS1iMzMyLTg1ZDcwNDhiNWUwYiIDQ0FFKiQwY2NmYzljOC01MjQ5LTQ5MTUtODg5Zi02YjI0MDQ4MGNkN2I',
  localStoragePath: 'C:\\path\\to\\storage'
});

console.log(`Saved to: ${result.data.localPath}`);
```

### Example 4: Batch Download

```typescript
// Get images from DB that don't have localPath
const images = await window.electronAPI.invoke('image-veo3:get-local-images', {
  profileId: 'profile_xxx'
});

const imagesToDownload = images.data
  .filter(img => !img.localPath)
  .map(img => img.name);

// Download them
const result = await window.electronAPI.invoke('image-veo3:download-batch', {
  profileId: 'profile_xxx',
  imageNames: imagesToDownload,
  localStoragePath: 'C:\\path\\to\\storage'
});

console.log(`Downloaded: ${result.data.downloaded}, Failed: ${result.data.failed}`);
```

## Zustand Store Integration

Recommended store structure for managing sync state:

```typescript
interface ImageSyncState {
  // Pagination state
  lastCursor: Map<string, string | undefined>;  // profileId → cursor
  hasMore: Map<string, boolean>;                // profileId → hasMore
  
  // Sync state
  isSyncingMetadata: Map<string, boolean>;
  isDownloadingImages: Map<string, boolean>;
  
  // Actions
  syncMetadata: (profileId: string, maxPages?: number) => Promise<void>;
  resumeSync: (profileId: string) => Promise<void>;
  downloadImage: (profileId: string, imageName: string) => Promise<void>;
  downloadAllPending: (profileId: string) => Promise<void>;
}
```

## Database Schema

No changes needed. The `veo3_image_generations` table already supports this flow:

```sql
CREATE TABLE veo3_image_generations (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  aspect_ratio TEXT,
  workflow_id TEXT NOT NULL,
  media_key TEXT NOT NULL,
  local_path TEXT,              -- NULL until downloaded
  fife_url TEXT,
  created_at TEXT NOT NULL
);
```

**Key points**:
- `local_path` is NULL initially (metadata only)
- `local_path` is set when image is downloaded
- `name` is unique (prevents duplicate metadata)
- `fife_url` stored for reference (may expire)

## Benefits

✅ **Fast Metadata Sync** - Fetch 100+ images in seconds without downloading  
✅ **Resumable** - Use cursor to continue from where you left off  
✅ **Selective Download** - Download only images you need  
✅ **Progress Tracking** - Clear separation of sync vs download progress  
✅ **Storage Efficient** - Don't download images you'll never use  
✅ **Reliable** - Metadata always available even if download fails  

## Migration from Old Flow

**Old Code** (single-phase):
```typescript
await window.electronAPI.invoke('image-veo3:sync-from-flow', {
  profileId: 'xxx',
  localStoragePath: 'C:\\...',
  maxPages: 5
});
```

**New Code** (two-phase):
```typescript
// Phase 1: Sync metadata
await window.electronAPI.invoke('image-veo3:sync-metadata', {
  profileId: 'xxx',
  maxPages: 5  // or omit to fetch all
});

// Phase 2: Download images (optional, on-demand)
const images = await window.electronAPI.invoke('image-veo3:get-local-images', {
  profileId: 'xxx'
});

const pendingImages = images.data
  .filter(img => !img.localPath)
  .slice(0, 10);  // Download first 10

await window.electronAPI.invoke('image-veo3:download-batch', {
  profileId: 'xxx',
  imageNames: pendingImages.map(i => i.name),
  localStoragePath: 'C:\\...'
});
```

## Performance Comparison

| Operation | Old Flow | New Flow (Metadata) | New Flow (Download) |
|-----------|----------|---------------------|---------------------|
| 18 images | 30-60s   | < 1s                | 20-40s (on-demand) |
| 100 images| 3-5 min  | 5-10s               | 2-4 min (selective) |
| Pagination| Limited  | ✅ Full support     | N/A |
| Resume    | ❌ No    | ✅ Yes (cursor)     | N/A |

## Related Files

- `src/main/modules/ai-video-creation/image-veo3-apis/services/image-veo3.service.ts`
- `src/main/modules/ai-video-creation/image-veo3-apis/handlers/registrations.ts`
- `src/main/modules/ai-video-creation/image-veo3-apis/types/image.types.ts`

## API Reference

See `docs/ve03-apis/image-related/202510-IMG-Fetch-User-Img.md` for Flow API details.
