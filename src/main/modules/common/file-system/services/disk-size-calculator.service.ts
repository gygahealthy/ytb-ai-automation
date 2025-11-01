/**
 * File System Service
 *
 * Manages worker thread for file system operations:
 * - Calculate total disk size of files
 * - Read image files as base64 data URLs
 * Provides non-blocking API for UI.
 */
import { Worker } from "worker_threads";
import * as path from "path";
import { Logger } from "../../../../../shared/utils/logger";

const logger = new Logger("FileSystemService");

interface CalculateRequest {
  filePaths: string[];
  callback: (result: { totalSize: number; fileCount: number; errors: number }) => void;
}

interface ReadImageRequest {
  filePath: string;
  callback: (result: { dataUrl: string }) => void;
}

interface ReadFileRequest {
  filePath: string;
  callback: (result: { buffer: Buffer }) => void;
}

export class DiskSizeCalculatorService {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingCalculateRequests: CalculateRequest[] = [];
  private pendingImageRequests: ReadImageRequest[] = [];
  private pendingFileRequests: ReadFileRequest[] = [];

  /**
   * Initialize the worker thread
   */
  private initializeWorker(): void {
    if (this.worker) {
      return; // Already initialized
    }

    try {
      // Path to compiled worker file (go up from services/ to module root, then into workers/)
      const workerPath = path.join(__dirname, "../workers/disk-size-calculator.worker.js");

      logger.info(`Initializing file system worker: ${workerPath}`);

      this.worker = new Worker(workerPath);

      // Handle messages from worker
      this.worker.on("message", (message: any) => {
        if (message.type === "ready") {
          this.isReady = true;
          logger.info("File system worker is ready");

          // Process any pending requests
          this.processPendingRequests();
        } else if (message.type === "result") {
          // Result from disk size calculation
          this.handleSizeResult(message);
        } else if (message.type === "imageResult") {
          // Result from image file read
          this.handleImageResult(message);
        } else if (message.type === "fileResult") {
          // Result from raw file read
          this.handleFileResult(message);
        } else if (message.type === "error") {
          logger.error("Worker error:", message.error);
        }
      });

      this.worker.on("error", (error) => {
        logger.error("Worker thread error:", error);
        this.isReady = false;
        this.worker = null;
      });

      this.worker.on("exit", (code) => {
        if (code !== 0) {
          logger.error(`Worker stopped with exit code ${code}`);
        }
        this.isReady = false;
        this.worker = null;
      });
    } catch (error) {
      logger.error("Failed to initialize worker:", error);
    }
  }

  /**
   * Calculate total disk size for given file paths
   * Non-blocking - uses worker thread
   */
  async calculateTotalSize(filePaths: string[]): Promise<{ totalSize: number; fileCount: number; errors: number }> {
    return new Promise((resolve, reject) => {
      const request: CalculateRequest = {
        filePaths,
        callback: resolve,
      };

      if (!this.isReady || !this.worker) {
        // Worker not ready - queue the request
        this.pendingCalculateRequests.push(request);

        // Initialize worker if not already done
        if (!this.worker) {
          this.initializeWorker();
        }
        return;
      }

      // Send to worker
      try {
        this.worker.postMessage({
          type: "calculate",
          filePaths,
        });

        // Store callback for when result comes back
        this.pendingCalculateRequests.push(request);
      } catch (error) {
        logger.error("Failed to send message to worker:", error);
        reject(error);
      }
    });
  }

  /**
   * Read image file and convert to base64 data URL
   * Non-blocking - uses worker thread
   * Returns immediately, queues request if worker not ready
   */
  async readImageFile(filePath: string): Promise<{ dataUrl: string }> {
    // Initialize worker if not already started
    if (!this.worker) {
      this.initializeWorker();
    }

    return new Promise((resolve, reject) => {
      const request: ReadImageRequest = {
        filePath,
        callback: resolve,
      };

      // Queue the request (will be processed when worker is ready)
      this.pendingImageRequests.push(request);

      // If worker is ready, send immediately (don't wait for sequential processing)
      if (this.isReady && this.worker) {
        try {
          this.worker.postMessage({
            type: "readImageFile",
            filePath,
          });
        } catch (error) {
          logger.error("Failed to send message to worker:", error);
          // Remove from queue on error
          const index = this.pendingImageRequests.findIndex((r) => r.filePath === filePath);
          if (index > -1) {
            this.pendingImageRequests.splice(index, 1);
          }
          reject(error);
        }
      }
      // Otherwise, it will be processed by processPendingRequests() when worker becomes ready
    });
  }

  /**
   * Read file and return raw buffer
   * Non-blocking - uses worker thread
   */
  async readFile(filePath: string): Promise<{ buffer: Buffer }> {
    // Initialize worker if not already started
    if (!this.worker) {
      this.initializeWorker();
    }

    return new Promise((resolve, reject) => {
      const request: ReadFileRequest = {
        filePath,
        callback: resolve,
      };

      // Queue the request (will be processed when worker is ready)
      this.pendingFileRequests.push(request);

      // If worker is ready, send immediately
      if (this.isReady && this.worker) {
        try {
          this.worker.postMessage({
            type: "readFile",
            filePath,
          });
        } catch (error) {
          logger.error("Failed to send message to worker:", error);
          // Remove from queue on error
          const index = this.pendingFileRequests.findIndex((r) => r.filePath === filePath);
          if (index > -1) {
            this.pendingFileRequests.splice(index, 1);
          }
          reject(error);
        }
      }
      // Otherwise, it will be processed by processPendingRequests() when worker becomes ready
    });
  }

  /**
   * Handle size calculation result from worker
   */
  private handleSizeResult(result: { totalSize: number; fileCount: number; errors: number }): void {
    // Process first pending size request
    const request = this.pendingCalculateRequests.shift();
    if (request) {
      request.callback(result);
    }
  }

  /**
   * Handle image read result from worker
   */
  private handleImageResult(result: { dataUrl: string; filePath: string }): void {
    // Find and process the matching request by filePath
    const index = this.pendingImageRequests.findIndex((r) => r.filePath === result.filePath);
    if (index > -1) {
      const request = this.pendingImageRequests.splice(index, 1)[0];
      request.callback({ dataUrl: result.dataUrl });
    }
  }

  /**
   * Handle raw file read result from worker
   */
  private handleFileResult(result: { buffer: Buffer; filePath: string }): void {
    // Find and process the matching request by filePath
    const index = this.pendingFileRequests.findIndex((r) => r.filePath === result.filePath);
    if (index > -1) {
      const request = this.pendingFileRequests.splice(index, 1)[0];
      request.callback({ buffer: result.buffer });
    }
  }

  /**
   * Process any pending requests after worker becomes ready
   */
  private processPendingRequests(): void {
    // Process pending size calculations
    while (this.pendingCalculateRequests.length > 0 && this.isReady && this.worker) {
      const request = this.pendingCalculateRequests.shift();
      if (request) {
        try {
          this.worker.postMessage({
            type: "calculate",
            filePaths: request.filePaths,
          });

          // Re-add to queue to wait for result
          this.pendingCalculateRequests.push(request);
          break; // Process one at a time
        } catch (error) {
          logger.error("Failed to send pending size request to worker:", error);
          request.callback({ totalSize: 0, fileCount: 0, errors: request.filePaths.length });
        }
      }
    }

    // Process pending image reads - send ALL pending requests in parallel
    if (this.isReady && this.worker) {
      const imagesToProcess = [...this.pendingImageRequests];
      this.pendingImageRequests = []; // Clear pending list

      for (const request of imagesToProcess) {
        try {
          this.worker.postMessage({
            type: "readImageFile",
            filePath: request.filePath,
          });

          // Re-add to queue to wait for result
          this.pendingImageRequests.push(request);
        } catch (error) {
          logger.error("Failed to send pending image request to worker:", error);
          request.callback({ dataUrl: "" });
        }
      }
    }

    // Process pending file reads - send ALL pending requests in parallel
    if (this.isReady && this.worker) {
      const filesToProcess = [...this.pendingFileRequests];
      this.pendingFileRequests = []; // Clear pending list

      for (const request of filesToProcess) {
        try {
          this.worker.postMessage({
            type: "readFile",
            filePath: request.filePath,
          });

          // Re-add to queue to wait for result
          this.pendingFileRequests.push(request);
        } catch (error) {
          logger.error("Failed to send pending file request to worker:", error);
          request.callback({ buffer: Buffer.from([]) });
        }
      }
    }
  }

  /**
   * Shutdown the worker
   */
  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.pendingCalculateRequests = [];
      this.pendingImageRequests = [];
      this.pendingFileRequests = [];
      logger.info("File system worker terminated");
    }
  }
}

// Export singleton instance
export const diskSizeCalculatorService = new DiskSizeCalculatorService();
