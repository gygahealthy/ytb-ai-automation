# Video Upscaling Feature - Implementation Summary

## Overview

Successfully implemented a comprehensive video upscaling feature that allows users to upscale generated VEO3 videos to higher resolution (1080p). The implementation follows the project's modular architecture pattern with proper separation of concerns.

## Architecture Decisions

### Separate Table for Upscales ✅

- Created `veo3_video_upscales` table instead of reusing `veo3_video_generations`
- **Benefits:**
  - Clear separation of concerns
  - Easier to track upscaling history per video
  - Prevents confusion between original generation and upscaled versions
  - Allows multiple upscales per source video
  - Cleaner queries and better performance

### Database Schema

```sql
CREATE TABLE veo3_video_upscales (
  id TEXT PRIMARY KEY,
  source_generation_id TEXT NOT NULL,  -- References original video
  profile_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  operation_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  model TEXT NOT NULL DEFAULT 'veo_2_1080p_upsampler_8s',
  seed INTEGER,
  aspect_ratio TEXT,
  media_generation_id TEXT,
  fife_url TEXT,
  serving_base_uri TEXT,
  video_url TEXT,
  video_path TEXT,
  error_message TEXT,
  raw_response TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (source_generation_id) REFERENCES veo3_video_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES veo3_projects(id) ON DELETE CASCADE
)
```

## Implementation Structure

### 1. Type Definitions (`src/shared/types/video-creation.types.ts`)

```typescript
export interface VideoUpscale {
  id: string;
  sourceGenerationId: string;
  profileId: string;
  projectId: string;
  sceneId: string;
  operationName: string;
  status: "pending" | "processing" | "completed" | "failed";
  model: string;
  seed?: number;
  aspectRatio?: string;
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl?: string;
  videoPath?: string;
  errorMessage?: string;
  rawResponse?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

### 2. Database Migration (`026_add_video_upscales_table.ts`)

- Creates `veo3_video_upscales` table
- Adds indexes for:
  - `source_generation_id` (for finding upscales of a video)
  - `profile_id` (for user queries)
  - `status` (for polling pending/processing)
  - `created_at` (for sorting)

### 3. Repository Layer (`video-upscale.repository.ts`)

**CRUD Operations:**

- `create()` - Create new upscale record
- `updateStatus()` - Update upscale status and metadata
- `getById()` - Get single upscale
- `getBySourceGenerationId()` - Get all upscales for a video
- `getBySceneId()` - Get upscale by scene ID
- `getByProfile()` - Get user's upscales (paginated)
- `getByStatus()` - Get upscales by status (paginated)
- `getAll()` - Get all upscales (paginated)
- `deleteById()` - Delete upscale
- `countByProfile()` - Count user's upscales
- `countByStatus()` - Count by status
- `countAll()` - Total count
- `getStatusCounts()` - Status breakdown

### 4. API Client (`veo3-video-api.client.ts`)

**New Methods:**

```typescript
async upscaleVideo(
  bearerToken: string,
  projectId: string,
  sourceMediaGenerationId: string,
  sourceSceneId: string,
  model: string = "veo_2_1080p_upsampler_8s"
): Promise<{ success: boolean; data?: any; sceneId?: string; error?: string }>

async checkUpscaleStatus(
  bearerToken: string,
  operationName: string,
  sceneId: string
): Promise<{ success: boolean; data?: any; error?: string }>
```

**API Endpoint:**

- Uses same endpoint as video generation: `POST /v1/video:batchAsyncGenerateVideoText`
- Uses `videoInput.mediaGenerationId` instead of `textInput.prompt`
- Model: `veo_2_1080p_upsampler_8s`

### 5. Service Layer (`veo3-video-upscale.service.ts`)

**Business Logic Methods:**

- `startVideoUpscale()` - Initiate upscaling process

  - Validates source video is completed
  - Extracts bearer token from profile cookies
  - Calls Google API
  - Creates upscale record in database
  - Returns upscale ID for tracking

- `checkUpscaleStatus()` - Check and update status

  - Fetches current status from API
  - Updates database with latest metadata
  - Returns status, URLs, and completion info

- `getUpscaleById()` - Retrieve upscale record
- `getUpscalesBySourceGeneration()` - Get all upscales for a video
- `getUpscalesByProfile()` - Get user's upscales

### 6. IPC Handlers (`handlers/video-upscale.ts`)

**Registered Channels:**

- `veo3:upscale:start` - Start upscaling
- `veo3:upscale:checkStatus` - Check status
- `veo3:upscale:getById` - Get by ID
- `veo3:upscale:getBySourceGeneration` - Get by source video
- `veo3:upscale:getByProfile` - Get by profile

### 7. Polling Service Updates (`veo3-polling.service.ts`)

**Enhanced to Support Both Generations and Upscales:**

- Updated `PollingJob` interface to include `type: "generation" | "upscale"`
- `addToPolling()` now accepts type parameter
- `checkAndBroadcast()` routes to appropriate service based on type
- `broadcastStatusUpdate()` uses different channels:
  - `veo3:generation:status` for generations
  - `veo3:upscale:status` for upscales
- `restorePendingGenerations()` now restores both pending generations AND upscales on startup

## Usage Flow

### Starting an Upscale

```typescript
// From renderer (React)
const result = await(window as any).electronAPI.invoke("veo3:upscale:start", {
  sourceGenerationId: "abc123",
  model: "veo_2_1080p_upsampler_8s", // optional, defaults to this
});

if (result.success) {
  const { upscaleId, sceneId, operationName } = result.data;
  // Upscale is automatically added to polling queue
  // Will receive status updates via 'veo3:upscale:status' events
}
```

### Checking Upscale Status

```typescript
// Manual status check
const result = await(window as any).electronAPI.invoke("veo3:upscale:checkStatus", {
  upscaleId: "xyz789",
});

if (result.success) {
  const { status, videoUrl, completedAt } = result.data;
  // status: "pending" | "processing" | "completed" | "failed"
}
```

### Listening for Status Updates

```typescript
// In React component
useEffect(() => {
  const handleUpscaleStatus = (data: any) => {
    const { upscaleId, status, videoUrl, progress } = data;
    // Update UI with status
  };

  (window as any).electronAPI.on("veo3:upscale:status", handleUpscaleStatus);

  return () => {
    (window as any).electronAPI.off("veo3:upscale:status", handleUpscaleStatus);
  };
}, []);
```

### Getting Upscales for a Video

```typescript
const result = await(window as any).electronAPI.invoke("veo3:upscale:getBySourceGeneration", {
  sourceGenerationId: "abc123",
});

if (result.success) {
  const upscales = result.data; // Array of VideoUpscale
  // Show upscale history for this video
}
```

## API Request/Response Examples

### Upscale Request

```json
{
  "clientContext": {
    "projectId": "project-id-here",
    "tool": "PINHOLE",
    "userPaygateTier": "PAYGATE_TIER_ONE"
  },
  "requests": [
    {
      "videoModelKey": "veo_2_1080p_upsampler_8s",
      "videoInput": {
        "mediaGenerationId": "source-media-generation-id"
      },
      "metadata": {
        "sceneId": "new-scene-id-for-upscale",
        "referenceSceneId": "original-scene-id"
      }
    }
  ]
}
```

### Upscale Status Response (Successful)

```json
{
  "operations": [
    {
      "operation": {
        "name": "operation-name",
        "metadata": {
          "@type": "type.googleapis.com/google.internal.labs.aisandbox.v1.Media",
          "video": {
            "seed": 342697,
            "mediaGenerationId": "upscaled-media-id",
            "fifeUrl": "https://storage.googleapis.com/...",
            "servingBaseUri": "https://storage.googleapis.com/...",
            "model": "veo_2_1080p_upsampler_8s",
            "aspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE"
          }
        }
      },
      "sceneId": "upscale-scene-id",
      "mediaGenerationId": "upscaled-media-id",
      "status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"
    }
  ],
  "remainingCredits": 300
}
```

## Testing Checklist

- [ ] Run migration: `npm run dev` (auto-applies migrations)
- [ ] Generate a test video
- [ ] Start upscale on completed video
- [ ] Verify upscale appears in polling queue
- [ ] Check database for upscale record
- [ ] Monitor status updates via IPC events
- [ ] Verify completed upscale has higher resolution
- [ ] Test multiple upscales of same video
- [ ] Test upscale of failed video (should fail validation)
- [ ] Test upscale of pending video (should fail validation)
- [ ] Restart app and verify pending upscales resume polling

## Files Created/Modified

### Created

1. `src/main/storage/migrations/modules/026_add_video_upscales_table.ts`
2. `src/main/modules/ai-video-creation/flow-veo3-apis/repository/video-upscale.repository.ts`
3. `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-video-upscale.service.ts`
4. `src/main/modules/ai-video-creation/flow-veo3-apis/handlers/video-upscale.ts`

### Modified

1. `src/shared/types/video-creation.types.ts` - Added `VideoUpscale` interface
2. `src/main/storage/migrations/index.ts` - Registered migration 026
3. `src/main/modules/ai-video-creation/flow-veo3-apis/apis/veo3/veo3-video-api.client.ts` - Added upscale methods
4. `src/main/modules/ai-video-creation/flow-veo3-apis/apis/veo3-api.client.ts` - Exposed upscale methods in facade
5. `src/main/modules/ai-video-creation/flow-veo3-apis/handlers/registrations.ts` - Added upscale handlers
6. `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-polling.service.ts` - Enhanced for upscales
7. `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-batch-generation.service.ts` - Fixed polling call

## Next Steps for Frontend Integration

1. **Add Upscale Button to Video Cards**

   - Show "Upscale to 1080p" button on completed videos
   - Disable if video is already upscaled or upscale is in progress

2. **Create Upscale Status Indicator**

   - Show upscale progress badge
   - Display upscaled video URL when complete
   - Link to download upscaled version

3. **Add Upscale History View**

   - Show all upscales for a video
   - Compare original vs upscaled versions
   - Display upscale metadata (model, seed, aspect ratio)

4. **Update Video List/Grid**
   - Show upscale status alongside generation status
   - Filter by upscale status
   - Bulk upscale operations

## Benefits of This Implementation

✅ **Clean Separation**: Upscales tracked independently from generations  
✅ **Traceability**: Easy to find all upscales of a specific video  
✅ **Flexibility**: Can upscale same video multiple times with different models  
✅ **Automatic Polling**: Upscales automatically tracked in background  
✅ **Type Safety**: Full TypeScript support throughout  
✅ **Consistent Patterns**: Follows existing module architecture  
✅ **Database Integrity**: Foreign keys ensure referential integrity  
✅ **Scalability**: Indexed columns for efficient queries

## Notes

- Upscaling uses the same API endpoint as video generation
- Model `veo_2_1080p_upsampler_8s` upscales to 1080p resolution
- Upscaling requires the source video's `mediaGenerationId`
- Status checking uses the same endpoint for both generations and upscales
- Polling service automatically handles both types with type discrimination
- Upscales cascade delete when source generation is deleted
