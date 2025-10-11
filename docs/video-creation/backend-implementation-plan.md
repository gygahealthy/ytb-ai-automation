# Backend Implementation Plan: Video Creation Module

This document outlines the complete backend implementation needed to support the Single Video Creation feature using VEO3 API.

## 📋 Overview

The backend needs to handle:

1. IPC handlers for video creation requests
2. Database schema for storing jobs, drafts, and resources
3. Service layer for VEO3 API integration
4. File management for video outputs and resources

---

## 1. Database Schema

### Tables to Create

#### `video_creation_jobs` Table

Stores individual video creation job information.

```sql
CREATE TABLE IF NOT EXISTS video_creation_jobs (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('idle', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  video_url TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  metadata TEXT -- JSON string for additional data
);

CREATE INDEX idx_video_creation_jobs_status ON video_creation_jobs(status);
CREATE INDEX idx_video_creation_jobs_created_at ON video_creation_jobs(created_at DESC);
```

#### `video_resources` Table

Stores resources (images, videos, audio, transcripts) associated with jobs.

```sql
CREATE TABLE IF NOT EXISTS video_resources (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('image', 'video', 'audio', 'transcript')),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES video_creation_jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_video_resources_job_id ON video_resources(job_id);
CREATE INDEX idx_video_resources_type ON video_resources(type);
```

#### `video_creation_drafts` Table

Stores saved prompt drafts.

```sql
CREATE TABLE IF NOT EXISTS video_creation_drafts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prompts TEXT NOT NULL, -- JSON array of prompts
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_video_creation_drafts_name ON video_creation_drafts(name);
```

---

## 2. Repository Layer

### Create: `src/main/storage/repositories/video-creation.repository.ts`

```typescript
import { BaseRepository } from "./base.repository";
import { VideoCreationJob, VideoResource, JsonDraft } from "../../../shared/types/video-creation.types";

export class VideoCreationRepository extends BaseRepository {
  // Job Methods
  createJob(job: Omit<VideoCreationJob, "resources">): VideoCreationJob;
  getJobById(id: string): VideoCreationJob | null;
  getAllJobs(limit?: number): VideoCreationJob[];
  updateJobStatus(id: string, status: VideoCreationJob["status"], data?: Partial<VideoCreationJob>): void;
  deleteJob(id: string): void;

  // Resource Methods
  addResource(resource: VideoResource): VideoResource;
  getResourcesByJobId(jobId: string): VideoResource[];
  deleteResourcesByJobId(jobId: string): void;

  // Draft Methods
  saveDraft(draft: Omit<JsonDraft, "id" | "createdAt" | "updatedAt">): JsonDraft;
  getDraftById(id: string): JsonDraft | null;
  getDraftByName(name: string): JsonDraft | null;
  getAllDrafts(): JsonDraft[];
  updateDraft(id: string, data: Partial<JsonDraft>): void;
  deleteDraft(id: string): void;
}
```

**Key Methods:**

- CRUD operations for jobs, resources, and drafts
- Support for querying jobs by status
- Proper foreign key relationships

---

## 3. Service Layer

### Create: `src/main/modules/ai-video-creation/services/veo3-video-creation.service.ts`

```typescript
import { ApiResponse } from "../../../shared/types";
import { VideoCreationJob } from "../../../shared/types/video-creation.types";
import { VideoCreationRepository } from "../../../storage/repositories/video-creation.repository";
import { Veo3Service } from "../../../services/veo3.service";
import { Logger } from "../../../shared/utils/logger";

export class Veo3VideoCreationService {
  constructor(private veo3Service: Veo3Service, private repository: VideoCreationRepository, private logger: Logger) {}

  /**
   * Create a new video from a prompt
   */
  async createVideo(promptId: string, promptText: string): Promise<ApiResponse<{ jobId: string }>> {
    try {
      // 1. Create job in database
      const job = this.repository.createJob({
        id: generateId(),
        promptId,
        promptText,
        status: "processing",
        progress: 0,
        createdAt: new Date().toISOString(),
      });

      // 2. Start video creation process asynchronously
      this.processVideoCreation(job.id, promptText).catch((error) => {
        this.logger.error("Video creation failed", error);
        this.repository.updateJobStatus(job.id, "failed", {
          error: error.message,
        });
      });

      return {
        success: true,
        data: { jobId: job.id },
      };
    } catch (error) {
      this.logger.error("Failed to create video job", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process video creation (async)
   */
  private async processVideoCreation(jobId: string, promptText: string): Promise<void> {
    // 1. Update progress: 10%
    this.repository.updateJobStatus(jobId, "processing", { progress: 10 });

    // 2. Call VEO3 API to generate video
    const veo3Response = await this.veo3Service.generateVideo(promptText);

    if (!veo3Response.success) {
      throw new Error(veo3Response.error || "VEO3 API failed");
    }

    // 3. Update progress: 50%
    this.repository.updateJobStatus(jobId, "processing", { progress: 50 });

    // 4. Download video and save locally
    const videoPath = await this.downloadVideo(veo3Response.data.videoUrl);

    // 5. Update progress: 80%
    this.repository.updateJobStatus(jobId, "processing", { progress: 80 });

    // 6. Save resources if any (images, audio, transcripts)
    if (veo3Response.data.resources) {
      for (const resource of veo3Response.data.resources) {
        this.repository.addResource({
          id: generateId(),
          jobId,
          type: resource.type,
          url: resource.url,
          filename: resource.filename,
          filePath: await this.downloadResource(resource.url),
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 7. Mark job as completed
    this.repository.updateJobStatus(jobId, "completed", {
      progress: 100,
      videoUrl: videoPath,
      completedAt: new Date().toISOString(),
    });

    this.logger.info(`Video creation completed for job ${jobId}`);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ApiResponse<VideoCreationJob> {
    try {
      const job = this.repository.getJobById(jobId);
      if (!job) {
        return {
          success: false,
          error: "Job not found",
        };
      }

      const resources = this.repository.getResourcesByJobId(jobId);
      return {
        success: true,
        data: { ...job, resources },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all jobs
   */
  getAllJobs(limit?: number): ApiResponse<VideoCreationJob[]> {
    try {
      const jobs = this.repository.getAllJobs(limit);
      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): ApiResponse<void> {
    try {
      // TODO: Implement actual cancellation logic with VEO3 API
      this.repository.updateJobStatus(jobId, "failed", {
        error: "Cancelled by user",
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Helper methods
  private async downloadVideo(url: string): Promise<string> {
    // TODO: Implement video download logic
    throw new Error("Not implemented");
  }

  private async downloadResource(url: string): Promise<string> {
    // TODO: Implement resource download logic
    throw new Error("Not implemented");
  }
}
```

---

## 4. IPC Handlers

### Create: `src/main/handlers/video-creation.handlers.ts`

```typescript
import { IpcMainInvokeEvent } from "electron";
import { registerHandler } from "../core/ipc/registry";
import { Veo3VideoCreationService } from "../modules/ai-video-creation/services/veo3-video-creation.service";
import { VideoCreationRepository } from "../storage/repositories/video-creation.repository";
import { Logger } from "../shared/utils/logger";

const logger = new Logger("VideoCreationHandlers");
let videoCreationService: Veo3VideoCreationService;

export function registerVideoCreationHandlers(database: any) {
  const repository = new VideoCreationRepository(database);
  videoCreationService = new Veo3VideoCreationService(
    // TODO: Initialize Veo3Service
    null as any,
    repository,
    logger
  );

  // Create Video
  registerHandler("video-creation:create", async (event: IpcMainInvokeEvent, { promptId, promptText }) => {
    logger.info("Creating video from prompt", { promptId });
    return videoCreationService.createVideo(promptId, promptText);
  });

  // Get Job Status
  registerHandler("video-creation:get-job", async (event: IpcMainInvokeEvent, { jobId }) => {
    return videoCreationService.getJobStatus(jobId);
  });

  // Get All Jobs
  registerHandler("video-creation:get-all-jobs", async (event: IpcMainInvokeEvent, { limit }) => {
    return videoCreationService.getAllJobs(limit);
  });

  // Cancel Job
  registerHandler("video-creation:cancel-job", async (event: IpcMainInvokeEvent, { jobId }) => {
    logger.info("Cancelling video job", { jobId });
    return videoCreationService.cancelJob(jobId);
  });

  // Draft Management
  registerHandler("video-creation:save-draft", async (event: IpcMainInvokeEvent, draft) => {
    try {
      const saved = repository.saveDraft(draft);
      return { success: true, data: saved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  registerHandler("video-creation:get-drafts", async () => {
    try {
      const drafts = repository.getAllDrafts();
      return { success: true, data: drafts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  registerHandler("video-creation:delete-draft", async (event: IpcMainInvokeEvent, { draftId }) => {
    try {
      repository.deleteDraft(draftId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  logger.info("Video creation handlers registered");
}
```

---

## 5. Frontend IPC Client

### Create: `src/renderer/ipc/video-creation.ipc.ts`

```typescript
import { VideoCreationJob, JsonDraft } from "../types/video-creation.types";
import { ApiResponse } from "../../shared/types";

export const videoCreationIpc = {
  createVideo: (promptId: string, promptText: string): Promise<ApiResponse<{ jobId: string }>> => {
    return window.electronAPI.invoke("video-creation:create", { promptId, promptText });
  },

  getJob: (jobId: string): Promise<ApiResponse<VideoCreationJob>> => {
    return window.electronAPI.invoke("video-creation:get-job", { jobId });
  },

  getAllJobs: (limit?: number): Promise<ApiResponse<VideoCreationJob[]>> => {
    return window.electronAPI.invoke("video-creation:get-all-jobs", { limit });
  },

  cancelJob: (jobId: string): Promise<ApiResponse<void>> => {
    return window.electronAPI.invoke("video-creation:cancel-job", { jobId });
  },

  saveDraft: (draft: Omit<JsonDraft, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<JsonDraft>> => {
    return window.electronAPI.invoke("video-creation:save-draft", draft);
  },

  getDrafts: (): Promise<ApiResponse<JsonDraft[]>> => {
    return window.electronAPI.invoke("video-creation:get-drafts");
  },

  deleteDraft: (draftId: string): Promise<ApiResponse<void>> => {
    return window.electronAPI.invoke("video-creation:delete-draft", { draftId });
  },
};
```

---

## 6. Migration Script

### Add to: `src/main/storage/migrations.ts`

```typescript
// Add this migration to the migrations array
{
  version: 6, // Increment from current version
  up: (db: Database) => {
    // Create video_creation_jobs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_creation_jobs (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('idle', 'processing', 'completed', 'failed')),
        progress INTEGER DEFAULT 0,
        video_url TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        metadata TEXT
      );

      CREATE INDEX idx_video_creation_jobs_status ON video_creation_jobs(status);
      CREATE INDEX idx_video_creation_jobs_created_at ON video_creation_jobs(created_at DESC);
    `);

    // Create video_resources table
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_resources (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('image', 'video', 'audio', 'transcript')),
        url TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES video_creation_jobs(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_video_resources_job_id ON video_resources(job_id);
      CREATE INDEX idx_video_resources_type ON video_resources(type);
    `);

    // Create video_creation_drafts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS video_creation_drafts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        prompts TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_video_creation_drafts_name ON video_creation_drafts(name);
    `);

    console.log('Migration 6: Video creation tables created');
  },
  down: (db: Database) => {
    db.exec(`
      DROP TABLE IF EXISTS video_resources;
      DROP TABLE IF EXISTS video_creation_jobs;
      DROP TABLE IF EXISTS video_creation_drafts;
    `);
  },
}
```

---

## 7. Integration Steps

### Step 1: Database Setup

1. Add migration to `migrations.ts`
2. Run migration to create tables
3. Verify schema with SQLite browser

### Step 2: Repository Implementation

1. Create `video-creation.repository.ts`
2. Implement all CRUD methods
3. Add proper error handling
4. Export from `repositories/index.ts`

### Step 3: Service Layer

1. Create `veo3-video-creation.service.ts`
2. Implement video creation workflow
3. Add VEO3 API integration
4. Implement file download/management

### Step 4: IPC Handlers

1. Create `video-creation.handlers.ts`
2. Register all IPC channels
3. Wire up repository and service
4. Add to `registerAll.ts`

### Step 5: Frontend Integration

1. Create `video-creation.ipc.ts`
2. Update store to use real IPC calls
3. Add error handling
4. Implement progress updates

### Step 6: Testing

1. Test video creation flow end-to-end
2. Test draft management
3. Test job status updates
4. Test error scenarios

---

## 8. VEO3 API Integration

### API Endpoints (to be provided)

You mentioned you'll provide specific API endpoints. Here's the expected interface:

```typescript
interface Veo3ApiClient {
  /**
   * Generate video from text prompt
   */
  generateVideo(
    prompt: string,
    options?: VideoGenerationOptions
  ): Promise<{
    success: boolean;
    data?: {
      videoUrl: string;
      videoId: string;
      duration: number;
      resolution: string;
      resources?: Array<{
        type: "image" | "video" | "audio" | "transcript";
        url: string;
        filename: string;
      }>;
    };
    error?: string;
  }>;

  /**
   * Check video generation status
   */
  getGenerationStatus(videoId: string): Promise<{
    success: boolean;
    data?: {
      status: "pending" | "processing" | "completed" | "failed";
      progress: number;
      videoUrl?: string;
      error?: string;
    };
  }>;

  /**
   * Cancel video generation
   */
  cancelGeneration(videoId: string): Promise<{ success: boolean }>;
}

interface VideoGenerationOptions {
  resolution?: "720p" | "1080p" | "4k";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  duration?: number; // seconds
  style?: string;
  // ... other options
}
```

---

## 9. File Management

### Directory Structure

```
user-data/
  └── videos/
      └── [job-id]/
          ├── output.mp4        # Final video
          ├── resources/
          │   ├── images/       # Generated images
          │   ├── audio/        # Generated audio
          │   └── transcripts/  # Generated transcripts
          └── metadata.json     # Job metadata
```

### File Service Methods

```typescript
class VideoFileService {
  createJobDirectory(jobId: string): string;
  saveVideo(jobId: string, videoBuffer: Buffer): string;
  saveResource(jobId: string, type: string, filename: string, buffer: Buffer): string;
  getJobDirectory(jobId: string): string;
  deleteJobFiles(jobId: string): void;
}
```

---

## 10. Progress Tracking & WebSocket

For real-time progress updates:

```typescript
// In main process
import { BrowserWindow } from "electron";

class VideoCreationProgressService {
  private windows: Set<BrowserWindow> = new Set();

  registerWindow(window: BrowserWindow) {
    this.windows.add(window);
  }

  updateProgress(jobId: string, progress: number, status: string) {
    this.windows.forEach((window) => {
      window.webContents.send("video-creation:progress", {
        jobId,
        progress,
        status,
      });
    });
  }
}
```

```typescript
// In renderer process
useEffect(() => {
  const unsubscribe = window.electronAPI.on("video-creation:progress", (data) => {
    updateJobStatus(data.jobId, "processing", { progress: data.progress });
  });

  return unsubscribe;
}, []);
```

---

## 11. Error Handling

### Common Error Scenarios

1. **VEO3 API Errors**

   - Rate limiting
   - Invalid prompts
   - Network failures

2. **File System Errors**

   - Disk space issues
   - Permission errors

3. **Database Errors**
   - Constraint violations
   - Connection issues

### Error Recovery Strategy

```typescript
class VideoCreationErrorHandler {
  handleError(error: Error, jobId: string) {
    // Log error
    logger.error("Video creation error", { error, jobId });

    // Update job status
    repository.updateJobStatus(jobId, "failed", {
      error: this.getUserFriendlyMessage(error),
    });

    // Notify user
    this.notifyUser(jobId, error);

    // Cleanup resources
    this.cleanupJob(jobId);
  }

  private getUserFriendlyMessage(error: Error): string {
    // Map technical errors to user-friendly messages
    // ...
  }
}
```

---

## 12. Next Steps

Once you provide the VEO3 API endpoints and authentication details:

1. **Immediate Tasks:**

   - [ ] Run database migration
   - [ ] Implement repository layer
   - [ ] Create VEO3 API client
   - [ ] Wire up IPC handlers

2. **Follow-up Tasks:**

   - [ ] Add file download/management
   - [ ] Implement progress tracking
   - [ ] Add error recovery
   - [ ] Create unit tests
   - [ ] Add integration tests

3. **Nice-to-Have Features:**
   - [ ] Batch video creation
   - [ ] Video preview before download
   - [ ] Quality settings
   - [ ] Cost estimation
   - [ ] Usage analytics

---

## 📞 What's Needed from You

To complete the implementation, please provide:

1. **VEO3 API Documentation:**

   - Endpoint URLs
   - Authentication method
   - Request/response formats
   - Rate limits

2. **API Credentials:**

   - API key or token
   - Any environment variables needed

3. **Feature Requirements:**
   - Video quality options
   - Maximum video duration
   - Supported prompt formats
   - Resource types returned

This will allow me to implement the complete backend integration with real API calls!
