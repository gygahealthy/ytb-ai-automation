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
    const { id, videoUrl, filename, downloadPath, homeDir, userDataPath } = job;

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    // Use provided downloadPath or default to Downloads folder
    // Support both Windows and macOS/Linux home directory patterns
    const fallbackHome = homeDir || process.env.HOME || process.env.USERPROFILE || "";
    let targetPath = downloadPath || path.join(fallbackHome, "Downloads");

    // Load settings to check if auto-create date folder is enabled
    const settings = loadSettings(userDataPath) as Record<string, unknown> | null;
    if (
      settings &&
      typeof settings === "object" &&
      "options" in settings &&
      settings.options &&
      typeof settings.options === "object" &&
      "autoCreateDateFolder" in settings.options &&
      (settings.options as Record<string, unknown>).autoCreateDateFolder
    ) {
      const today = new Date();
      const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;
      targetPath = path.join(targetPath, dateFolder);
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

/**
 * Load settings from localStorage file (persisted by zustand)
 * @param userDataPath - Path to user data directory (passed from parent)
 */
function loadSettings(userDataPath?: string): unknown {
  try {
    if (!userDataPath) {
      console.warn("[Download Worker] No userDataPath provided, skipping settings load");
      return null;
    }

    const settingsPath = path.join(userDataPath, "file-paths-storage.json");

    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      const parsed = JSON.parse(data);
      return parsed.state || parsed;
    }
  } catch (error) {
    console.error("[Download Worker] Failed to load settings:", error);
  }
  return null;
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
