import * as path from "path";
import { Worker } from "worker_threads";

interface VideoReadJob {
  id: string;
  filePath: string;
  maxSizeBytes?: number;
}

interface VideoReadResult {
  id: string;
  filePath: string;
  success: boolean;
  dataUrl?: string;
  mimeType?: string;
  fileSize?: number;
  error?: string;
}

interface PendingVideoRead {
  job: VideoReadJob;
  resolve: (result: VideoReadResult) => void;
  reject: (error: Error | string) => void;
}

interface VideoFileReaderStatus {
  activeReads: number;
  queuedReads: number;
  workerCount: number;
}

/**
 * Video File Reader Service
 *
 * Handles reading video files from disk and converting to data URLs using worker threads.
 * Supports concurrent reads without blocking the main application.
 * Similar architecture to ImageDownloadService.
 *
 * Features:
 * - Non-blocking file I/O via worker threads
 * - Automatic file:// protocol for large files (>50MB)
 * - Base64 data URLs for small files
 * - Progressive caching
 */
export class VideoFileReaderService {
  private workerPool: Worker[] = [];
  private readQueue: PendingVideoRead[] = [];
  private activeReads: Map<string, PendingVideoRead> = new Map();
  private maxWorkers: number = 2; // Number of concurrent reads (file I/O intensive)
  private workerPath: string;
  private readCache: Map<string, VideoReadResult> = new Map(); // Simple cache for repeated reads

  constructor() {
    this.workerPath = path.join(__dirname, "..", "workers", "video-file-reader.worker.js");
    this.initializeWorkerPool();
  }

  /**
   * Initialize the worker pool
   */
  private initializeWorkerPool(): void {
    console.log(`[VideoFileReaderService] Initializing worker pool with ${this.maxWorkers} workers`);
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

      worker.on("message", (result: VideoReadResult) => {
        this.handleReadResult(result);
      });

      worker.on("error", (error) => {
        console.error("[VideoFileReaderService] Worker error:", error);
        // Remove failed worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      worker.on("exit", (code) => {
        console.log(`[VideoFileReaderService] Worker exited with code ${code}`);
        // Remove exited worker from pool and create a new one
        const index = this.workerPool.indexOf(worker);
        if (index > -1) {
          this.workerPool.splice(index, 1);
        }
        this.createWorker();
      });

      this.workerPool.push(worker);
    } catch (error) {
      console.error("[VideoFileReaderService] Failed to create worker:", error);
    }
  }

  /**
   * Read a single video file and convert to data URL or file:// protocol
   */
  async readVideoFile(filePath: string, maxSizeBytes?: number): Promise<VideoReadResult> {
    // Check cache first
    const cached = this.readCache.get(filePath);
    if (cached) {
      console.log(`[VideoFileReaderService] Cache hit for ${filePath}`);
      return cached;
    }

    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const job: VideoReadJob = {
        id,
        filePath,
        maxSizeBytes,
      };

      const pendingRead: PendingVideoRead = {
        job,
        resolve: (result) => {
          // Cache successful results
          if (result.success) {
            this.readCache.set(filePath, result);
          }
          resolve(result);
        },
        reject,
      };

      this.activeReads.set(id, pendingRead);
      this.readQueue.push(pendingRead);
      this.processQueue();
    });
  }

  /**
   * Read multiple video files concurrently
   */
  async readMultipleVideoFiles(filePaths: string[], maxSizeBytes?: number): Promise<VideoReadResult[]> {
    console.log(`[VideoFileReaderService] Starting batch read of ${filePaths.length} files`);

    const readPromises = filePaths.map((filePath) => this.readVideoFile(filePath, maxSizeBytes));

    return Promise.all(readPromises);
  }

  /**
   * Process the read queue
   */
  private processQueue(): void {
    while (this.readQueue.length > 0 && this.workerPool.length > 0) {
      const worker = this.workerPool.shift();
      const pendingRead = this.readQueue.shift();

      if (worker && pendingRead) {
        console.log(`[VideoFileReaderService] Assigning read ${pendingRead.job.id} to worker`);

        // Create job-specific handler that cleans up after itself
        const messageHandler = (result: VideoReadResult) => {
          if (result.id === pendingRead.job.id) {
            // Remove this specific listener immediately
            worker.removeListener("message", messageHandler);

            // Handle the result
            this.handleReadResult(result);

            // Return worker to pool and process next job (if any)
            if (this.workerPool.indexOf(worker) === -1) {
              this.workerPool.push(worker);
            }

            // Process queue in next tick to avoid deep recursion
            if (this.readQueue.length > 0) {
              setImmediate(() => this.processQueue());
            }
          }
        };

        worker.on("message", messageHandler);
        worker.postMessage(pendingRead.job);
      }
    }
  }

  /**
   * Handle read result from worker
   */
  private handleReadResult(result: VideoReadResult): void {
    console.log(`[VideoFileReaderService] Received result for read ${result.id}`);

    const pendingRead = this.activeReads.get(result.id);
    if (pendingRead) {
      this.activeReads.delete(result.id);
      pendingRead.resolve(result);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear cache for a specific file or all files
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.readCache.delete(filePath);
      console.log(`[VideoFileReaderService] Cleared cache for ${filePath}`);
    } else {
      this.readCache.clear();
      console.log("[VideoFileReaderService] Cleared all cache");
    }
  }

  /**
   * Get read queue status
   */
  getStatus(): VideoFileReaderStatus {
    return {
      activeReads: this.activeReads.size,
      queuedReads: this.readQueue.length,
      workerCount: this.workerPool.length,
    };
  }

  /**
   * Cleanup and terminate all workers
   */
  terminate(): void {
    console.log("[VideoFileReaderService] Terminating worker pool");
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });
    this.workerPool = [];
    this.activeReads.clear();
    this.readQueue = [];
    this.readCache.clear();
  }
}

// CRITICAL: Use eager singleton initialization (not Proxy pattern)
// Similar to videoDownloadService, the event listener needs callbacks registered immediately
export const videoFileReaderService = new VideoFileReaderService();
