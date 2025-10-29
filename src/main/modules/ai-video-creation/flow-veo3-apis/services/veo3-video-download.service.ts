import * as path from "path";
import * as fs from "fs";
import { Worker } from "worker_threads";

interface DownloadJob {
  id: string;
  videoUrl: string;
  filename: string;
  downloadPath: string;
  videoIndex?: number;
}

interface DownloadResult {
  id: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

interface PendingDownload {
  job: DownloadJob;
  resolve: (result: DownloadResult) => void;
  reject: (error: Error) => void;
}

/**
 * VEO3 Video Download Service
 *
 * Handles downloading videos from URLs to the local file system using worker threads.
 * Supports concurrent downloads without blocking the main application.
 * Bypasses CORS by running in the Node.js main process.
 */
export class Veo3VideoDownloadService {
  private workerPool: Worker[] = [];
  private downloadQueue: PendingDownload[] = [];
  private activeDownloads: Map<string, PendingDownload> = new Map();
  private maxWorkers: number = 4; // Number of concurrent downloads
  private workerPath: string;

  constructor() {
    this.workerPath = path.join(__dirname, "..", "workers", "video-download.worker.js");
    this.initializeWorkerPool();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkerPool(): void {
    console.log(`[Veo3VideoDownloadService] Initializing worker pool with ${this.maxWorkers} workers`);
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
        console.error("[Veo3VideoDownloadService] Worker error:", error);
        // Remove failed worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      worker.on("exit", (code) => {
        console.log(`[Veo3VideoDownloadService] Worker exited with code ${code}`);
        // Remove exited worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      this.workerPool.push(worker);
    } catch (error) {
      console.error("[Veo3VideoDownloadService] Failed to create worker:", error);
    }
  }

  /**
   * Download a single video
   */
  async downloadVideo(
    videoUrl: string,
    filename?: string,
    downloadPath?: string,
    videoIndex?: number
  ): Promise<{ success: boolean; filePath?: string; message?: string; error?: string }> {
    const finalFilename = this.sanitizeFilename(filename, videoIndex);
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const job: DownloadJob = {
        id,
        videoUrl,
        filename: finalFilename,
        downloadPath: downloadPath || "",
        videoIndex,
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
    videos: Array<{ videoUrl: string; filename?: string }>,
    onProgress?: (result: DownloadResult) => void,
    downloadPath?: string
  ): Promise<DownloadResult[]> {
    console.log(`[Veo3VideoDownloadService] Starting batch download of ${videos.length} videos`);

    const downloadPromises = videos.map((video) =>
      this.downloadVideo(video.videoUrl, video.filename, downloadPath).then((result) => {
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
        console.log(`[Veo3VideoDownloadService] Assigning download ${pendingDownload.job.id} to worker`);
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
    console.log(`[Veo3VideoDownloadService] Received result for download ${result.id}`);

    const pendingDownload = this.activeDownloads.get(result.id);
    if (pendingDownload) {
      this.activeDownloads.delete(result.id);
      pendingDownload.resolve(result);
    }
  }

  /**
   * Sanitize filename and apply naming conventions (indexing, epoch)
   * Also ensure .mp4 extension
   */
  private sanitizeFilename(filename?: string, videoIndex?: number): string {
    let baseName = filename || `video-${Date.now()}`;

    // Remove .mp4 extension if present (we'll add it back at the end)
    if (baseName.endsWith(".mp4")) {
      baseName = baseName.slice(0, -4);
    }

    // Apply auto-indexing if videoIndex is provided
    // Read from store settings (we'll import the store data via app.getPath userData)
    const settingsPath = this.getSettingsPath();
    const settings = this.loadSettings(settingsPath);

    if (settings?.options?.autoIndexFilename && videoIndex !== undefined) {
      const paddedIndex = String(videoIndex).padStart(3, "0");
      baseName = `${paddedIndex}_${baseName}`;
    }

    // Apply epoch timestamp if enabled
    if (settings?.options?.addEpochTimeToFilename) {
      const epoch = Date.now();
      baseName = `${baseName}_${epoch}`;
    }

    // Remove invalid characters
    baseName = baseName.replace(/[<>:"|?*]/g, "-");

    // Add .mp4 extension
    return `${baseName}.mp4`;
  }

  /**
   * Get settings path from app userData
   */
  private getSettingsPath(): string {
    const { app } = require("electron");
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, "file-paths-storage.json");
  }

  /**
   * Load settings from localStorage file (persisted by zustand)
   */
  private loadSettings(settingsPath: string): any {
    try {
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, "utf-8");
        const parsed = JSON.parse(data);
        return parsed.state || parsed;
      }
    } catch (error) {
      console.error("[Veo3VideoDownloadService] Failed to load settings:", error);
    }
    return null;
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
  getStatus(): { activeDownloads: number; queuedDownloads: number; workerCount: number } {
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
    console.log("[Veo3VideoDownloadService] Terminating worker pool");
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });
    this.workerPool = [];
    this.activeDownloads.clear();
    this.downloadQueue = [];
  }
}

// Export singleton instance
export const veo3VideoDownloadService = new Veo3VideoDownloadService();
