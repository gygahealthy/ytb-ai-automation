import * as path from "path";
import { Worker } from "worker_threads";
import { app } from "electron";
import type { ImageDownloadJob, ImageDownloadResult, PendingImageDownload, ImageDownloadStatus } from "../types/download.types";

/**
 * Image Download Service
 *
 * Handles downloading images using worker threads for non-blocking operation.
 * Supports concurrent downloads without blocking the main application.
 */
export class ImageDownloadService {
  private workerPool: Worker[] = [];
  private downloadQueue: PendingImageDownload[] = [];
  private activeDownloads: Map<string, PendingImageDownload> = new Map();
  private maxWorkers: number = 4; // Number of concurrent downloads
  private workerPath: string;

  constructor() {
    this.workerPath = path.join(__dirname, "..", "workers", "image-download.worker.js");
    this.initializeWorkerPool();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkerPool(): void {
    console.log(`[ImageDownloadService] Initializing worker pool with ${this.maxWorkers} workers`);
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

      worker.on("message", (result: ImageDownloadResult) => {
        this.handleDownloadResult(result);
      });

      worker.on("error", (error) => {
        console.error("[ImageDownloadService] Worker error:", error);
        // Remove failed worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      worker.on("exit", (code) => {
        console.log(`[ImageDownloadService] Worker exited with code ${code}`);
        // Remove exited worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      this.workerPool.push(worker);
    } catch (error) {
      console.error("[ImageDownloadService] Failed to create worker:", error);
    }
  }

  /**
   * Download a single image
   */
  async downloadImage(
    profileId: string,
    imageName: string,
    mediaKey: string,
    bearerToken: string,
    flowNextKey: string,
    downloadPath: string,
    fifeUrl?: string
  ): Promise<ImageDownloadResult> {
    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const job: ImageDownloadJob = {
        id,
        profileId,
        imageName,
        mediaKey,
        fifeUrl,
        downloadPath,
        bearerToken,
        flowNextKey,
        // Pass paths from main process to worker
        userDataPath: app.getPath("userData"),
        homeDir: app.getPath("home"),
      };

      const pendingDownload: PendingImageDownload = {
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
   * Download multiple images concurrently
   */
  async downloadMultipleImages(
    images: Array<{
      profileId: string;
      imageName: string;
      mediaKey: string;
      fifeUrl?: string;
    }>,
    bearerToken: string,
    flowNextKey: string,
    downloadPath: string,
    onProgress?: (result: ImageDownloadResult) => void
  ): Promise<ImageDownloadResult[]> {
    console.log(`[ImageDownloadService] Starting batch download of ${images.length} images`);

    const downloadPromises = images.map((image) =>
      this.downloadImage(
        image.profileId,
        image.imageName,
        image.mediaKey,
        bearerToken,
        flowNextKey,
        downloadPath,
        image.fifeUrl
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
        console.log(`[ImageDownloadService] Assigning download ${pendingDownload.job.id} to worker`);
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
  private handleDownloadResult(result: ImageDownloadResult): void {
    console.log(`[ImageDownloadService] Received result for download ${result.id}`);

    const pendingDownload = this.activeDownloads.get(result.id);
    if (pendingDownload) {
      this.activeDownloads.delete(result.id);
      pendingDownload.resolve(result);
    }
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
  getStatus(): ImageDownloadStatus {
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
    console.log("[ImageDownloadService] Terminating worker pool");
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });
    this.workerPool = [];
    this.activeDownloads.clear();
    this.downloadQueue = [];
  }
}

// Use lazy Proxy pattern to avoid eager initialization
let _imageDownloadServiceInstance: ImageDownloadService | null = null;

function getImageDownloadService(): ImageDownloadService {
  if (!_imageDownloadServiceInstance) {
    _imageDownloadServiceInstance = new ImageDownloadService();
  }
  return _imageDownloadServiceInstance;
}

export const imageDownloadService = new Proxy({} as ImageDownloadService, {
  get(_target, prop) {
    return getImageDownloadService()[prop as keyof ImageDownloadService];
  },
});
