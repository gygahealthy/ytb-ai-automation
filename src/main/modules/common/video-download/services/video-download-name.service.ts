import * as path from "path";
import { Worker } from "worker_threads";
import { app } from "electron";
import type {
  VideoDownloadByNameJob,
  VideoDownloadByNameResult,
  PendingVideoDownloadByName,
  VideoDownloadByNameStatus,
} from "../types/video-download-name.types";

// Callback type for download completion
type DownloadCompletedCallback = (mediaGenerationId: string, localFilePath: string) => void;

/**
 * Video Download by Name Service
 *
 * Handles downloading videos using the VEO3 media name/ID endpoint
 * with worker threads for non-blocking operation.
 * Supports concurrent downloads without blocking the main application.
 */
export class VideoDownloadByNameService {
  private workerPool: Worker[] = [];
  private downloadQueue: PendingVideoDownloadByName[] = [];
  private activeDownloads: Map<string, PendingVideoDownloadByName> = new Map();
  private maxWorkers: number = 4; // Number of concurrent downloads
  private workerPath: string;
  private downloadCompletedCallback: DownloadCompletedCallback | null = null;

  constructor() {
    this.workerPath = path.join(__dirname, "..", "workers", "video-download-name.worker.js");
    this.initializeWorkerPool();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkerPool(): void {
    console.log(`[VideoDownloadByNameService] Initializing worker pool with ${this.maxWorkers} workers`);
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker and add to pool
   */
  private createWorker(): void {
    try {
      const worker = new Worker(this.workerPath);

      worker.on("message", (result: VideoDownloadByNameResult) => {
        this.handleDownloadResult(result);
      });

      worker.on("error", (error) => {
        console.error("[VideoDownloadByNameService] Worker error:", error);
        // Remove failed worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      worker.on("exit", (code) => {
        console.log(`[VideoDownloadByNameService] Worker exited with code ${code}`);
        // Remove exited worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      this.workerPool.push(worker);
    } catch (error) {
      console.error("[VideoDownloadByNameService] Failed to create worker:", error);
    }
  }

  /**
   * Download a single video by name/ID
   */
  async downloadVideo(
    profileId: string,
    videoName: string,
    mediaKey: string,
    bearerToken: string,
    flowNextKey: string,
    downloadPath: string,
    fifeUrl?: string
  ): Promise<VideoDownloadByNameResult> {
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const job: VideoDownloadByNameJob = {
        id,
        profileId,
        videoName,
        mediaKey,
        fifeUrl,
        downloadPath,
        bearerToken,
        flowNextKey,
        // Pass paths from main process to worker
        userDataPath: app.getPath("userData"),
        homeDir: app.getPath("home"),
      };

      const pendingDownload: PendingVideoDownloadByName = {
        job,
        resolve,
        reject,
      };

      this.activeDownloads.set(id, pendingDownload);
      this.downloadQueue.push(pendingDownload);
      this.processQueue();
    });
  }

  /**
   * Download multiple videos concurrently
   */
  async downloadMultipleVideos(
    videos: Array<{
      profileId: string;
      videoName: string;
      mediaKey: string;
      fifeUrl?: string;
    }>,
    bearerToken: string,
    flowNextKey: string,
    downloadPath: string,
    onProgress?: (result: VideoDownloadByNameResult) => void
  ): Promise<VideoDownloadByNameResult[]> {
    console.log(`[VideoDownloadByNameService] Starting batch download of ${videos.length} videos`);

    const downloadPromises = videos.map((video) =>
      this.downloadVideo(
        video.profileId,
        video.videoName,
        video.mediaKey,
        bearerToken,
        flowNextKey,
        downloadPath,
        video.fifeUrl
      ).then((result) => {
        if (onProgress) {
          onProgress(result);
        }
        return result;
      })
    );

    return Promise.all(downloadPromises);
  }

  /**
   * Process the download queue
   */
  private processQueue(): void {
    while (this.downloadQueue.length > 0 && this.workerPool.length > 0) {
      const worker = this.workerPool.shift();
      const pendingDownload = this.downloadQueue.shift();

      if (worker && pendingDownload) {
        console.log(`[VideoDownloadByNameService] Assigning download ${pendingDownload.job.id} to worker`);
        worker.postMessage(pendingDownload.job);

        // Return worker to pool after it completes the job
        setTimeout(() => {
          if (this.workerPool.indexOf(worker) === -1) {
            this.workerPool.push(worker);
            this.processQueue(); // Process next item in queue
          }
        }, 100);
      }
    }
  }

  /**
   * Handle download result from worker
   */
  private handleDownloadResult(result: VideoDownloadByNameResult): void {
    console.log(`[VideoDownloadByNameService] Received result for download ${result.id}`);
    console.log(
      `[VideoDownloadByNameService] Result success: ${result.success}, has filePath: ${!!result.filePath}, has callback: ${!!this
        .downloadCompletedCallback}`
    );

    const pendingDownload = this.activeDownloads.get(result.id);
    if (pendingDownload) {
      this.activeDownloads.delete(result.id);
      pendingDownload.resolve(result);

      // Call the callback when download completes successfully
      if (result.success && result.filePath && this.downloadCompletedCallback) {
        console.log(
          `[VideoDownloadByNameService] Calling download completed callback for ${result.videoName} -> ${result.filePath}`
        );
        this.downloadCompletedCallback(result.videoName, result.filePath);
        console.log(`[VideoDownloadByNameService] Called download completed callback for ${result.videoName}`);
      } else {
        console.log(
          `[VideoDownloadByNameService] NOT calling callback - success: ${result.success}, filePath: ${
            result.filePath
          }, callback: ${!!this.downloadCompletedCallback}`
        );
      }
    }
  }

  /**
   * Set callback to be called when a download completes successfully
   */
  setDownloadCompletedCallback(callback: DownloadCompletedCallback): void {
    this.downloadCompletedCallback = callback;
    console.log("[VideoDownloadByNameService] Download completed callback registered");
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get download queue status
   */
  getStatus(): VideoDownloadByNameStatus {
    return {
      activeDownloads: this.activeDownloads.size,
      queuedDownloads: this.downloadQueue.length,
      workerCount: this.workerPool.length,
    };
  }

  /**
   * Cleanup and terminate all workers
   */
  terminate(): void {
    console.log("[VideoDownloadByNameService] Terminating worker pool");
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });
    this.workerPool = [];
    this.activeDownloads.clear();
    this.downloadQueue = [];
  }
}

// CRITICAL: Use eager singleton initialization (not Proxy pattern)
// The event listener service needs to register callbacks BEFORE any downloads happen.
// Proxy pattern would create instance during first download, making callback registration fail.
export const videoDownloadByNameService = new VideoDownloadByNameService();
