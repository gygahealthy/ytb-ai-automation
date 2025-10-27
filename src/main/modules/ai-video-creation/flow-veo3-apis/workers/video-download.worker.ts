/**
 * Video Download Worker
 *
 * This worker runs in a separate thread to handle video downloads
 * without blocking the main application.
 */

import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import { parentPort } from "worker_threads";

interface DownloadJob {
  id: string;
  videoUrl: string;
  filename: string;
  downloadPath: string;
}

interface DownloadResult {
  id: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

async function downloadVideo(job: DownloadJob): Promise<DownloadResult> {
  try {
    const { id, videoUrl, filename, downloadPath } = job;

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    // Use provided downloadPath or default to Downloads folder
    const targetPath = downloadPath || path.join(app.getPath("home"), "Downloads");

    // Ensure target folder exists
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const filePath = path.join(targetPath, filename);

    console.log(`[Download Worker] Starting download ${id}: ${videoUrl}`);

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
