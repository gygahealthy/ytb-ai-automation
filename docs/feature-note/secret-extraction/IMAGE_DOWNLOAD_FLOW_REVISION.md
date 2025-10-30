# Image Download Flow Revision - Using FLOW_NEXT_KEY

## Overview

Revised the image download logic in `image-veo3-apis` module to properly use the `FLOW_NEXT_KEY` (extracted secret) when fetching images from Flow server. Instead of relying on temporary `fifeUrl` links which may expire, we now call the Flow API with the extracted secret to get base64 image data.

## Changes Made

### 1. Type Definitions Updated

**File**: `src/main/modules/ai-video-creation/image-veo3-apis/types/image.types.ts`

Added `mediaGenerationId` to `FlowUserWorkflow` interface:

```typescript
export interface FlowUserWorkflow {
  name: string;
  media: {
    name: string;
    userUploadedImage?: {
      aspectRatio: ImageAspectRatio;
      fifeUrl?: string;
    };
    mediaGenerationId?: MediaGenerationId; // ✅ Added
  };
  createTime: string;
}
```

This allows us to extract the `workflowId` and `mediaKey` directly from the API response instead of parsing the encoded name.

### 2. Service Layer - Image Upload Flow

**File**: `src/main/modules/ai-video-creation/image-veo3-apis/services/image-veo3.service.ts`

#### Before:
- Uploaded image to Flow
- Attempted to fetch metadata
- Downloaded from `fifeUrl` if available (may be expired)

#### After:
- Uploads image to Flow
- **Extracts `FLOW_NEXT_KEY` if not already available**
- Calls `fetchImage()` with bearer token + `FLOW_NEXT_KEY` to get base64 image data
- Saves base64 image directly to local storage using new `saveBase64Image()` method
- Stores both `localPath` and `fifeUrl` in database

```typescript
// Get FLOW_NEXT_KEY for image fetch
const flowNextKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');
if (!flowNextKey) {
  // Auto-extract if missing
  await secretExtractionService.extractSecrets(profileId);
}

// Fetch image with API key
const fetchResult = await imageVEO3ApiClient.fetchImage(tokenResult.token, imageName, flowNextKey);

// Save from base64 data
if (fetchResult.data?.userUploadedImage?.image) {
  const downloadResult = await this.saveBase64Image(
    fetchResult.data.userUploadedImage.image,
    localStoragePath,
    mediaGenerationId.mediaKey
  );
}
```

### 3. Service Layer - Image Sync Flow

**File**: Same as above

#### Before:
- Fetched user images list
- Downloaded from `fifeUrl` if available (may be expired)
- Parsed `workflowId` and `mediaKey` from encoded name (approximate/unreliable)

#### After:
- **Extracts `FLOW_NEXT_KEY` once at the start of sync**
- Fetches user images list
- **Extracts `workflowId` and `mediaKey` directly from `mediaGenerationId` in response**
- For each image, calls `fetchImage()` with bearer token + `FLOW_NEXT_KEY`
- Saves base64 image data using `saveBase64Image()` method
- Stores complete metadata including `fifeUrl` for reference

```typescript
// Extract FLOW_NEXT_KEY once at start
const apiKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');
if (!apiKey) {
  await secretExtractionService.extractSecrets(profileId);
  // Retry...
}

// For each image in sync loop
const mediaGenerationId = workflow.media.mediaGenerationId;
const fetchResult = await imageVEO3ApiClient.fetchImage(tokenResult.token, name, apiKey);

if (fetchResult.data?.userUploadedImage?.image) {
  await this.saveBase64Image(
    fetchResult.data.userUploadedImage.image,
    localStoragePath,
    mediaGenerationId.mediaKey
  );
}
```

### 4. New Method - `saveBase64Image()`

**File**: Same as above

New private method that accepts base64 image data and saves it to local storage:

```typescript
private async saveBase64Image(
  base64Data: string,
  storageDir: string,
  mediaKey: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    await fs.mkdir(storageDir, { recursive: true });
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${mediaKey}.jpg`;
    const filepath = path.join(storageDir, filename);
    await fs.writeFile(filepath, buffer);
    return { success: true, path: filepath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

## Flow Diagram

### Image Upload Flow

```
User uploads image
  ↓
Upload to Flow server (POST /v1:uploadUserImage)
  ↓ (returns mediaGenerationId)
Check for FLOW_NEXT_KEY
  ↓ (if missing)
Auto-extract FLOW_NEXT_KEY via secret-extraction service
  ↓
Fetch image metadata with API key (GET /v1/media/{name}?key={FLOW_NEXT_KEY})
  ↓ (returns base64 image data + fifeUrl)
Save base64 to local storage
  ↓
Save metadata to database (with localPath + fifeUrl)
```

### Image Sync Flow

```
Start sync
  ↓
Extract FLOW_NEXT_KEY (once at start)
  ↓
Fetch user images page (GET /trpc/media.fetchUserHistoryDirectly)
  ↓ (returns list of images with mediaGenerationId)
For each image:
  ├─ Check if exists in DB (skip if yes)
  ├─ Extract workflowId + mediaKey from mediaGenerationId
  ├─ Fetch image with API key (GET /v1/media/{name}?key={FLOW_NEXT_KEY})
  ├─ Save base64 to local storage
  └─ Save metadata to database
  ↓
Continue to next page if available
```

## API Endpoints Used

### 1. Fetch Image (with FLOW_NEXT_KEY)

```
GET https://aisandbox-pa.googleapis.com/v1/media/{imageName}?key={FLOW_NEXT_KEY}&clientContext.tool=PINHOLE
Headers:
  - Authorization: Bearer {BEARER_TOKEN}
```

**Response**:
```json
{
  "name": "CAMa...",
  "userUploadedImage": {
    "image": "[BASE64_STRING]",  ← Used for saving locally
    "mediaGenerationId": "CAMa...",
    "fifeUrl": "https://storage.googleapis.com/...",  ← Stored for reference
    "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE"
  },
  "mediaGenerationId": {
    "mediaType": "IMAGE",
    "workflowId": "uuid",  ← Extracted directly
    "workflowStepId": "CAE",
    "mediaKey": "uuid"  ← Extracted directly
  }
}
```

## Benefits

✅ **Reliable**: Uses authenticated API endpoint instead of temporary URLs  
✅ **Secure**: Requires extracted `FLOW_NEXT_KEY` for access  
✅ **Accurate**: Extracts IDs directly from response instead of parsing encoded strings  
✅ **Consistent**: Same method for both upload and sync flows  
✅ **Persistent**: Base64 data saved immediately, no network dependency after fetch  

## Testing Checklist

- [ ] Upload single image → verify base64 saved locally
- [ ] Sync images from Flow → verify all images downloaded
- [ ] Auto-extraction triggers if `FLOW_NEXT_KEY` missing
- [ ] Error handling when secret extraction fails
- [ ] Pagination works correctly in sync flow
- [ ] Database records include both `localPath` and `fifeUrl`

## Related Files

- `src/main/modules/ai-video-creation/image-veo3-apis/services/image-veo3.service.ts`
- `src/main/modules/ai-video-creation/image-veo3-apis/apis/image-veo3-api.client.ts`
- `src/main/modules/ai-video-creation/image-veo3-apis/types/image.types.ts`
- `src/main/modules/common/secret-extraction/` (secret extraction module)

## API Documentation Reference

See `docs/ve03-apis/image-related/202510-IMG-Fetch-User-Img.md` for complete API curl examples and response structures.
