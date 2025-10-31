/**
 * Video Download by Name Worker
 *
 * This worker runs in a separate thread to handle video downloads
 * using the VEO3 media name/ID endpoint without blocking the main application.
 *
 * CRITICAL: Cannot use Electron's 'app' module in worker threads.
 * All paths must be passed via environment variables or message data.
 */

import * as fs from "fs";
import * as path from "path";
import { parentPort } from "worker_threads";
import type { VideoDownloadByNameJob, VideoDownloadByNameResult } from "../types/video-download-name.types";

/**
 * Download a single video using API fetch with name/ID or fifeUrl fallback
 */
async function downloadVideo(job: VideoDownloadByNameJob): Promise<VideoDownloadByNameResult> {
  try {
    const { id, videoName, mediaKey, fifeUrl, downloadPath, bearerToken, flowNextKey, homeDir } = job;

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

    const filename = `${mediaKey}.mp4`;
    const filePath = path.join(dateFolder, filename);

    console.log(`[Video Download Worker] Starting download ${id}: ${videoName}`);
    console.log(`[Video Download Worker] Target path: ${filePath}`);

    // Try API fetch first
    let downloadSuccess = false;
    let errorMessage = "";

    try {
      const apiUrl = buildApiUrl(videoName, flowNextKey);
      console.log(`[Video Download Worker] Fetching from API: ${apiUrl.substring(0, 100)}...`);

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
        const base64Video = data?.video?.encodedVideo;

        if (base64Video) {
          // Convert base64 to buffer and save
          const buffer = Buffer.from(base64Video, "base64");
          fs.writeFileSync(filePath, buffer);
          downloadSuccess = true;
          console.log(`[Video Download Worker] Downloaded from API to ${filePath} (${buffer.length} bytes)`);
        } else {
          // If no encodedVideo but we have fifeUrl in response, extract it
          if (data?.video?.fifeUrl) {
            errorMessage = `No encodedVideo in API response, but found fifeUrl: ${data.video.fifeUrl}`;
          } else {
            errorMessage = "No video data in API response";
          }
        }
      } else {
        errorMessage = `API fetch failed: ${response.status} ${response.statusText}`;
      }
    } catch (apiError) {
      errorMessage = apiError instanceof Error ? apiError.message : "API fetch error";
      console.warn(`[Video Download Worker] API fetch error: ${errorMessage}`);
    }

    // If API failed and we have fifeUrl, try that as fallback
    if (!downloadSuccess && fifeUrl) {
      try {
        console.log(`[Video Download Worker] Trying fifeUrl fallback: ${fifeUrl.substring(0, 100)}...`);

        const response = await fetch(fifeUrl);

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(filePath, buffer);
          downloadSuccess = true;
          console.log(`[Video Download Worker] Downloaded from fifeUrl to ${filePath} (${buffer.length} bytes)`);
        } else {
          errorMessage = `FifeUrl fetch failed: ${response.status} ${response.statusText}`;
        }
      } catch (fifeError) {
        errorMessage = fifeError instanceof Error ? fifeError.message : "FifeUrl fetch error";
        console.warn(`[Video Download Worker] FifeUrl fetch error: ${errorMessage}`);
      }
    }

    if (!downloadSuccess) {
      return {
        id,
        videoName,
        success: false,
        error: errorMessage || "Failed to download video",
      };
    }

    const message = `Video saved to ${filePath}`;
    console.log(`[Video Download Worker] Completed download ${id}: ${message}`);

    return {
      id,
      videoName,
      success: true,
      filePath,
      message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[Video Download Worker] Download error for ${job.id}:`, message);
    return {
      id: job.id,
      videoName: job.videoName,
      success: false,
      error: message,
    };
  }
}

/**
 * Build API URL for fetching video by name/ID (without encoding special characters)
 */
function buildApiUrl(videoName: string, flowNextKey: string): string {
  // Clean whitespace but don't encode special characters like $ or /
  const cleanVideoName = videoName.replace(/[\s\r\n\t]+/g, "");
  const baseUrl = "https://aisandbox-pa.googleapis.com/v1";
  return `${baseUrl}/media/${cleanVideoName}?key=${flowNextKey}&clientContext.tool=PINHOLE`;
}

// Listen for download jobs from the main thread
if (parentPort) {
  parentPort.on("message", async (job: VideoDownloadByNameJob) => {
    const result = await downloadVideo(job);
    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
