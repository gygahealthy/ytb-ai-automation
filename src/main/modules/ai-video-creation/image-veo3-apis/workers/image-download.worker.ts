/**
 * Image Download Worker
 *
 * This worker runs in a separate thread to handle image downloads
 * without blocking the main application.
 *
 * CRITICAL: Cannot use Electron's 'app' module in worker threads.
 * All paths must be passed via environment variables or message data.
 */

import * as fs from "fs";
import * as path from "path";
import { parentPort } from "worker_threads";
import type { ImageDownloadJob, ImageDownloadResult } from "../types/download.types";

/**
 * Download a single image using either API fetch or fifeUrl fallback
 */
async function downloadImage(job: ImageDownloadJob): Promise<ImageDownloadResult> {
  try {
    const { id, imageName, mediaKey, fifeUrl, downloadPath, bearerToken, flowNextKey, homeDir } = job;

    // Use provided downloadPath or default to Downloads folder
    const fallbackHome = homeDir || process.env.HOME || process.env.USERPROFILE || "";
    const targetPath = downloadPath || path.join(fallbackHome, "Downloads");

    // Create date-based folder structure (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];
    const dateFolder = path.join(targetPath, today);

    // Ensure target folder exists
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder, { recursive: true });
    }

    const filename = `${mediaKey}.jpg`;
    const filePath = path.join(dateFolder, filename);

    console.log(`[Image Download Worker] Starting download ${id}: ${imageName}`);
    console.log(`[Image Download Worker] Target path: ${filePath}`);

    // Try API fetch first
    let downloadSuccess = false;
    let errorMessage = "";

    try {
      const apiUrl = buildApiUrl(imageName, flowNextKey);
      console.log(`[Image Download Worker] Fetching from API: ${apiUrl.substring(0, 100)}...`);

      const response = await fetch(apiUrl, {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          authorization: `Bearer ${bearerToken}`,
          origin: "https://labs.google",
          referer: "https://labs.google/",
          "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
          "x-browser-channel": "stable",
          "x-browser-copyright": "Copyright 2025 Google LLC. All rights reserved.",
          "x-browser-year": "2025",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const base64Image = data?.userUploadedImage?.image;

        if (base64Image) {
          // Convert base64 to buffer and save
          const buffer = Buffer.from(base64Image, "base64");
          fs.writeFileSync(filePath, buffer);
          downloadSuccess = true;
          console.log(`[Image Download Worker] Downloaded from API to ${filePath}`);
        } else {
          errorMessage = "No image data in API response";
        }
      } else {
        errorMessage = `API fetch failed: ${response.status} ${response.statusText}`;
      }
    } catch (apiError) {
      errorMessage = apiError instanceof Error ? apiError.message : "API fetch error";
      console.warn(`[Image Download Worker] API fetch error: ${errorMessage}`);
    }

    // If API failed and we have fifeUrl, try that as fallback
    if (!downloadSuccess && fifeUrl) {
      try {
        console.log(`[Image Download Worker] Trying fifeUrl fallback: ${fifeUrl.substring(0, 100)}...`);

        const response = await fetch(fifeUrl);

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(filePath, buffer);
          downloadSuccess = true;
          console.log(`[Image Download Worker] Downloaded from fifeUrl to ${filePath}`);
        } else {
          errorMessage = `FifeUrl fetch failed: ${response.status} ${response.statusText}`;
        }
      } catch (fifeError) {
        errorMessage = fifeError instanceof Error ? fifeError.message : "FifeUrl fetch error";
        console.warn(`[Image Download Worker] FifeUrl fetch error: ${errorMessage}`);
      }
    }

    if (!downloadSuccess) {
      return {
        id,
        imageName,
        success: false,
        error: errorMessage || "Failed to download image",
      };
    }

    const message = `Image saved to ${filePath}`;
    console.log(`[Image Download Worker] Completed download ${id}: ${message}`);

    return {
      id,
      imageName,
      success: true,
      filePath,
      message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[Image Download Worker] Download error for ${job.id}:`, message);
    return {
      id: job.id,
      imageName: job.imageName,
      success: false,
      error: message,
    };
  }
}

/**
 * Build API URL for fetching image (without encoding special characters)
 */
function buildApiUrl(imageName: string, flowNextKey: string): string {
  // Clean whitespace but don't encode special characters like $ or /
  const cleanImageName = imageName.replace(/[\s\r\n\t]+/g, "");
  const baseUrl = "https://aisandbox-pa.googleapis.com/v1";
  return `${baseUrl}/media/${cleanImageName}?key=${flowNextKey}&clientContext.tool=PINHOLE`;
}

// Listen for download jobs from the main thread
if (parentPort) {
  parentPort.on("message", async (job: ImageDownloadJob) => {
    const result = await downloadImage(job);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
