/**
 * Video File Reader Worker
 *
 * This worker runs in a separate thread to read video files and convert to data URLs
 * without blocking the main application. Similar pattern to image-download.worker.
 *
 * Handles:
 * - Reading video files from disk
 * - Converting to base64 data URLs
 * - Detecting video codec/format
 * - Progressive streaming for large files
 */

import * as fs from "fs";
import * as path from "path";
import { parentPort } from "worker_threads";

interface VideoReadJob {
  id: string;
  filePath: string;
  maxSizeBytes?: number; // Optional: limit file size to read
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

/**
 * Read video file and convert to data URL
 * For large files, we may want to use file:// protocol instead of data URLs
 */
async function readVideoFile(job: VideoReadJob): Promise<VideoReadResult> {
  try {
    const { id, filePath, maxSizeBytes = 50 * 1024 * 1024 } = job; // 50MB default limit

    console.log(`[Video File Reader Worker] Starting read ${id}: ${filePath}`);

    // Security: validate file exists and is readable
    if (!fs.existsSync(filePath)) {
      return {
        id,
        filePath,
        success: false,
        error: `File not found: ${filePath}`,
      };
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    console.log(`[Video File Reader Worker] File size: ${fileSize} bytes`);

    // For very large files, use file:// protocol instead of data URL
    // This avoids memory issues and is more efficient
    if (fileSize > maxSizeBytes) {
      console.log(`[Video File Reader Worker] File exceeds ${maxSizeBytes} bytes, using file:// protocol`);
      const fileUrl = `file:///${filePath.replace(/\\/g, "/")}`;
      return {
        id,
        filePath,
        success: true,
        dataUrl: fileUrl,
        mimeType: "video/mp4",
        fileSize,
      };
    }

    // For smaller files, read into memory and convert to data URL
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");

    // Detect MIME type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = "video/mp4"; // default

    switch (ext) {
      case ".mp4":
        mimeType = "video/mp4";
        break;
      case ".webm":
        mimeType = "video/webm";
        break;
      case ".mov":
        mimeType = "video/quicktime";
        break;
      case ".mkv":
        mimeType = "video/x-matroska";
        break;
      case ".avi":
        mimeType = "video/x-msvideo";
        break;
      case ".flv":
        mimeType = "video/x-flv";
        break;
    }

    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`[Video File Reader Worker] Successfully read ${id}, mimeType: ${mimeType}, size: ${fileSize}`);

    return {
      id,
      filePath,
      success: true,
      dataUrl,
      mimeType,
      fileSize,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[Video File Reader Worker] Read error for ${job.id}:`, message);
    return {
      id: job.id,
      filePath: job.filePath,
      success: false,
      error: message,
    };
  }
}

// Listen for read jobs from the main thread
if (parentPort) {
  parentPort.on("message", async (job: VideoReadJob) => {
    const result = await readVideoFile(job);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
