/**
 * Headless browser cookie refresh helper
 * Spawns a child process to extract fresh cookies using Puppeteer
 * Used as fallback when HTTP-based rotation fails
 */

import { spawn } from "child_process";
import path from "path";
import { logger } from "../../../../utils/logger-backend.js";
import type { CookieCollection } from "../../shared/types/index.js";

export interface HeadlessRefreshResult {
  success: boolean;
  cookies?: CookieCollection;
  error?: string;
  duration?: number;
}

/**
 * Extract fresh cookies using headless browser
 * Runs in a child process for isolation and safety
 *
 * @param userDataDir - Chrome user data directory with logged-in session
 * @param targetUrl - URL to navigate to (default: https://gemini.google.com)
 * @param timeoutMs - Maximum time to wait (default: 60000ms = 1 minute)
 */
export async function refreshCookiesHeadless(
  userDataDir: string,
  targetUrl = "https://gemini.google.com",
  timeoutMs = 60000
): Promise<HeadlessRefreshResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    logger.info("[headless-refresh] Starting headless cookie extraction", {
      userDataDir,
      targetUrl,
      timeoutMs,
    });

    // Path to the worker script
    const workerScript = path.join(
      __dirname,
      "../../workers/headless-cookie-worker.js"
    );

    // Spawn child process
    const child = spawn(
      process.execPath,
      [
        workerScript,
        JSON.stringify({
          userDataDir,
          targetUrl,
          timeoutMs,
        }),
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";
    let timeoutHandle: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      try {
        if (!child.killed) {
          child.kill("SIGTERM");
        }
      } catch (e) {
        // Ignore kill errors
      }
    };

    const resolveOnce = (result: HeadlessRefreshResult) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    // Set timeout
    timeoutHandle = setTimeout(() => {
      logger.warn(
        `[headless-refresh] Timeout after ${timeoutMs}ms, killing process`
      );
      resolveOnce({
        success: false,
        error: `Headless refresh timed out after ${timeoutMs}ms`,
        duration: Date.now() - startTime,
      });
    }, timeoutMs);

    // Collect stdout
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle exit
    child.on("exit", (code, signal) => {
      const duration = Date.now() - startTime;

      if (code === 0) {
        // Success - parse cookies from stdout
        try {
          const result = JSON.parse(stdout);

          if (result.success && result.cookies) {
            logger.info(
              `[headless-refresh] ✅ Successfully extracted cookies (${duration}ms)`,
              {
                cookieCount: Object.keys(result.cookies).length,
              }
            );

            resolveOnce({
              success: true,
              cookies: result.cookies,
              duration,
            });
          } else {
            logger.error(
              `[headless-refresh] ❌ Worker reported failure: ${result.error}`
            );

            resolveOnce({
              success: false,
              error: result.error || "Worker reported failure",
              duration,
            });
          }
        } catch (parseError) {
          logger.error(
            `[headless-refresh] ❌ Failed to parse worker output`,
            parseError
          );

          resolveOnce({
            success: false,
            error: `Failed to parse worker output: ${
              parseError instanceof Error ? parseError.message : "Unknown"
            }`,
            duration,
          });
        }
      } else {
        // Failure
        logger.error(
          `[headless-refresh] ❌ Worker process exited with code ${code}, signal ${signal}`,
          {
            stderr: stderr.substring(0, 500),
          }
        );

        resolveOnce({
          success: false,
          error: `Worker process failed (code: ${code}, signal: ${signal})${
            stderr ? `: ${stderr.substring(0, 200)}` : ""
          }`,
          duration,
        });
      }
    });

    // Handle spawn errors
    child.on("error", (error) => {
      logger.error(`[headless-refresh] ❌ Failed to spawn worker`, error);

      resolveOnce({
        success: false,
        error: `Failed to spawn worker: ${error.message}`,
        duration: Date.now() - startTime,
      });
    });
  });
}

/**
 * Check if headless refresh is available
 * (i.e., Puppeteer is installed and worker script exists)
 */
export async function isHeadlessRefreshAvailable(): Promise<boolean> {
  try {
    // Check if puppeteer is available
    await import("puppeteer");

    // Check if worker script exists
    const fs = await import("fs/promises");
    const workerScript = path.join(
      __dirname,
      "../../workers/headless-cookie-worker.js"
    );

    await fs.access(workerScript);

    return true;
  } catch (error) {
    logger.debug(
      "[headless-refresh] Headless refresh not available",
      error instanceof Error ? error.message : "Unknown"
    );
    return false;
  }
}
