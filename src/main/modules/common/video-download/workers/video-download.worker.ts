/**
 * Video Download Worker
 *
 * This worker runs in a separate thread to handle video downloads
 * without blocking the main application.
 *
 * CRITICAL: Cannot use Electron's 'app' module in worker threads.
 * All paths must be passed via environment variables or message data.
 */

import * as fs from "fs";
import * as path from "path";
import { parentPort } from "worker_threads";
import type { DownloadJob, DownloadResult } from "../types/download.types";

async function downloadVideo(job: DownloadJob): Promise<DownloadResult> {
  try {
    const { id, videoUrl, filename, downloadPath, homeDir, settings } = job;

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    // Use provided downloadPath or default to Downloads folder
    // Support both Windows and macOS/Linux home directory patterns
    const fallbackHome = homeDir || process.env.HOME || process.env.USERPROFILE || "";
    let targetPath = downloadPath || path.join(fallbackHome, "Downloads");

    // Check if auto-create date folder is enabled
    if (settings?.autoCreateDateFolder) {
      const today = new Date();
      const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

      // Check if the target path already ends with today's date folder (YYYY-MM-DD pattern)
      // to prevent creating duplicate nested date folders (e.g., YYYY-MM-DD/YYYY-MM-DD)
      const lastFolder = path.basename(targetPath);
      const datePattern = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD format

      if (lastFolder === dateFolder || (datePattern.test(lastFolder) && lastFolder === dateFolder)) {
        // Path already ends with today's date folder, don't create it again
        console.log(`[Download Worker] Target path already ends with ${dateFolder}, skipping duplicate date folder creation`);
      } else if (datePattern.test(lastFolder)) {
        // Path ends with a different date folder, still add today's date folder
        targetPath = path.join(targetPath, dateFolder);
      } else {
        // Path doesn't end with any date folder, add today's date folder
        targetPath = path.join(targetPath, dateFolder);
      }
    }

    // Ensure target folder exists (Node's path module handles OS-specific separators)
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const filePath = path.join(targetPath, filename);

    console.log(`[Download Worker] Starting download ${id}: ${videoUrl}`);
    console.log(`[Download Worker] Target path: ${filePath}`);

    // Dynamically import got to avoid ESM module issues
    const got = await import("got");
    const gotInstance = got.default;

    // Download the video using got and save to file
    const response = await gotInstance(videoUrl, {
      timeout: { request: 300000 }, // 5 minutes timeout
      retry: { limit: 2 },
    });

    // Write the buffer to file
    fs.writeFileSync(filePath, response.rawBody);

    const message = `Video saved to ${filePath}`;
    console.log(`[Download Worker] Completed download ${id}: ${message}`);

    return {
      id,
      success: true,
      filePath,
      message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[Download Worker] Download error for ${job.id}:`, message);
    return {
      id: job.id,
      success: false,
      error: message,
    };
  }
}

// Listen for download jobs from the main thread
if (parentPort) {
  parentPort.on("message", async (job: DownloadJob) => {
    const result = await downloadVideo(job);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
