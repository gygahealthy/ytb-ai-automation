import * as path from "path";
import { Worker } from "worker_threads";
import { app } from "electron";
import type { DownloadJob, DownloadResult, PendingDownload, DownloadStatus } from "../types/download.types";

// Callback type for download completion
type DownloadCompletedCallback = (videoUrl: string, localFilePath: string) => void;

/**
 * Video Download Service
 *
 * Handles downloading videos from URLs to the local file system using worker threads.
 * Supports concurrent downloads without blocking the main application.
 * Bypasses CORS by running in the Node.js main process.
 */
export class VideoDownloadService {
  private workerPool: Worker[] = [];
  private downloadQueue: PendingDownload[] = [];
  private activeDownloads: Map<string, PendingDownload> = new Map();
  private maxWorkers: number = 4; // Number of concurrent downloads
  private workerPath: string;
  private downloadCompletedCallback: DownloadCompletedCallback | null = null;

  constructor() {
    this.workerPath = path.join(__dirname, "..", "workers", "video-download.worker.js");
    this.initializeWorkerPool();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkerPool(): void {
    console.log(`[VideoDownloadService] Initializing worker pool with ${this.maxWorkers} workers`);
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

      worker.on("message", (result: DownloadResult) => {
        this.handleDownloadResult(result);
      });

      worker.on("error", (error) => {
        console.error("[VideoDownloadService] Worker error:", error);
        // Remove failed worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      worker.on("exit", (code) => {
        console.log(`[VideoDownloadService] Worker exited with code ${code}`);
        // Remove exited worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      this.workerPool.push(worker);
    } catch (error) {
      console.error("[VideoDownloadService] Failed to create worker:", error);
    }
  }

  /**
   * Download a single video
   */
  async downloadVideo(
    videoUrl: string,
    filename?: string,
    downloadPath?: string,
    videoIndex?: number,
    settings?: {
      autoCreateDateFolder?: boolean;
      autoIndexFilename?: boolean;
      addEpochTimeToFilename?: boolean;
    }
  ): Promise<{ success: boolean; filePath?: string; message?: string; error?: string }> {
    const finalFilename = this.sanitizeFilename(filename, videoIndex, settings);
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const job: DownloadJob = {
        id,
        videoUrl,
        filename: finalFilename,
        downloadPath: downloadPath || "",
        videoIndex,
        // Pass paths from main process to worker
        userDataPath: app.getPath("userData"),
        homeDir: app.getPath("home"),
        // Pass settings to worker
        settings,
      };

      const pendingDownload: PendingDownload = {
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
    videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }>,
    onProgress?: (result: DownloadResult) => void,
    downloadPath?: string,
    settings?: {
      autoCreateDateFolder?: boolean;
      autoIndexFilename?: boolean;
      addEpochTimeToFilename?: boolean;
    }
  ): Promise<DownloadResult[]> {
    console.log(`[VideoDownloadService] Starting batch download of ${videos.length} videos`);

    const downloadPromises = videos.map((video, index) =>
      this.downloadVideo(
        video.videoUrl,
        video.filename,
        downloadPath,
        video.videoIndex !== undefined ? video.videoIndex : index,
        settings
      ).then((result) => {
        if (onProgress) {
          onProgress(result as DownloadResult);
        }
        return result;
      })
    );

    return Promise.all(downloadPromises) as Promise<DownloadResult[]>;
  }

  /**
   * Process the download queue
   */
  private processQueue(): void {
    while (this.downloadQueue.length > 0 && this.workerPool.length > 0) {
      const worker = this.workerPool.shift();
      const pendingDownload = this.downloadQueue.shift();

      if (worker && pendingDownload) {
        console.log(`[VideoDownloadService] Assigning download ${pendingDownload.job.id} to worker`);
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
  private handleDownloadResult(result: DownloadResult): void {
    console.log(`[VideoDownloadService] Received result for download ${result.id}`);
    console.log(
      `[VideoDownloadService] Result success: ${result.success}, has filePath: ${!!result.filePath}, has callback: ${!!this
        .downloadCompletedCallback}`
    );

    const pendingDownload = this.activeDownloads.get(result.id);
    if (pendingDownload) {
      this.activeDownloads.delete(result.id);
      pendingDownload.resolve(result);

      // Call the callback when download completes successfully
      if (result.success && result.filePath && this.downloadCompletedCallback && pendingDownload.job.videoUrl) {
        console.log(
          `[VideoDownloadService] Calling download completed callback for ${pendingDownload.job.videoUrl} -> ${result.filePath}`
        );
        this.downloadCompletedCallback(pendingDownload.job.videoUrl, result.filePath);
        console.log(`[VideoDownloadService] Called download completed callback for ${pendingDownload.job.videoUrl}`);
      } else {
        console.log(
          `[VideoDownloadService] NOT calling callback - success: ${result.success}, filePath: ${
            result.filePath
          }, callback: ${!!this.downloadCompletedCallback}, videoUrl: ${pendingDownload.job.videoUrl}`
        );
      }
    }
  }

  /**
   * Sanitize filename and apply naming conventions (indexing, epoch)
   * Also ensure .mp4 extension
   */
  private sanitizeFilename(
    filename?: string,
    videoIndex?: number,
    settings?: {
      autoCreateDateFolder?: boolean;
      autoIndexFilename?: boolean;
      addEpochTimeToFilename?: boolean;
    }
  ): string {
    let baseName = filename || `video-${Date.now()}`;

    // Remove .mp4 extension if present (we'll add it back at the end)
    if (baseName.endsWith(".mp4")) {
      baseName = baseName.slice(0, -4);
    }

    // Apply auto-indexing if enabled and videoIndex is provided
    if (settings?.autoIndexFilename && videoIndex !== undefined && videoIndex >= 0) {
      // Ensure 1-based indexing for user-friendly display (e.g., 001, 002, 003)
      const displayIndex = videoIndex > 0 ? videoIndex : videoIndex + 1;
      const paddedIndex = String(displayIndex).padStart(3, "0");
      baseName = `${paddedIndex}_${baseName}`;
    }

    // Apply epoch timestamp if enabled
    if (settings?.addEpochTimeToFilename) {
      const epoch = Date.now();
      baseName = `${baseName}_${epoch}`;
    }

    // Remove invalid characters
    baseName = baseName.replace(/[<>:"|?*]/g, "-");

    // Add .mp4 extension
    return `${baseName}.mp4`;
  }

  /**
   * Set callback to be called when a download completes successfully
   */
  setDownloadCompletedCallback(callback: DownloadCompletedCallback): void {
    this.downloadCompletedCallback = callback;
    console.log("[VideoDownloadService] Download completed callback registered");
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
  getStatus(): DownloadStatus {
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
    console.log("[VideoDownloadService] Terminating worker pool");
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
// Proxy pattern would delay instance creation, making callback registration timing unpredictable.
export const videoDownloadService = new VideoDownloadService();
