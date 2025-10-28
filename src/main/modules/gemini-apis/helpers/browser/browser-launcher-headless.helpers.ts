/**
 * Headless Browser Launcher Helper
 * Handles launching Chrome in HEADLESS (background) mode
 * Uses profile's user-data-dir to maintain cookies and login state
 */

import { logger } from "../../../../utils/logger-backend";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import { execSync } from "child_process";
import { chromePIDRegistry } from "./chrome-pid-registry";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Re-export for backward compatibility with main.ts imports
export { killAllTrackedChromePIDs } from "./chrome-pid-registry";

/**
 * Build Chrome arguments for HEADLESS mode with profile data
 * @param userDataDir - User profile directory path
 * @param debugPort - Remote debugging port number
 * @param userAgent - Optional custom user agent
 * @returns Array of Chrome command-line arguments for headless mode
 */
export function buildHeadlessChromeArgs(userDataDir: string, debugPort: number, userAgent?: string): string[] {
  const args = [
    `--remote-debugging-port=${debugPort}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${userDataDir}`,
    "--headless", // Old headless mode (more stable on Windows)
    "--disable-gpu", // Required for headless on Windows
    "--window-size=1920,1080", // Explicit window size for headless stability
    // Headless-specific optimizations
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
    "--disable-sync",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-breakpad",
    "--disable-component-extensions-with-background-pages",
    "--disable-dev-shm-usage",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
    "--disable-renderer-backgrounding",
    "--force-color-profile=srgb",
    "--metrics-recording-only",
    "--no-sandbox",
    "--mute-audio",
  ];

  if (userAgent) {
    args.push(`--user-agent=${userAgent}`);
  }

  return args;
}

/**
 * Launch Chrome in HEADLESS mode with profile data
 * Runs in background - NO VISIBLE WINDOW
 * Uses the profile's user-data-dir to load saved cookies and login state
 *
 * Uses spawn + connect pattern to ensure profile directory is properly loaded
 *
 * @param executablePath - Path to Chrome executable (optional, puppeteer will use bundled version if not provided)
 * @param userDataDir - Profile's user data directory path (REQUIRED)
 * @param debugPort - Remote debugging port number
 * @param userAgent - Optional custom user agent
 * @returns Puppeteer browser instance
 */
export async function launchHeadlessBrowser(
  executablePath: string | undefined,
  userDataDir: string,
  debugPort: number,
  userAgent?: string
): Promise<any> {
  // Validate user data directory
  if (!userDataDir) {
    throw new Error("userDataDir is required for headless browser launch with profile");
  }

  // Ensure user data directory exists
  if (!fs.existsSync(userDataDir)) {
    logger.info("[headless-launcher] Creating user data directory", {
      userDataDir,
    });
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  // Clean up stale lock files that might prevent Chrome from starting
  // Only remove the lock if it exists (indicates previous crash)
  try {
    const lockFile = `${userDataDir}\\SingletonLock`;
    if (fs.existsSync(lockFile)) {
      logger.debug("[headless-launcher] Removing stale SingletonLock file (previous crash detected)");
      fs.unlinkSync(lockFile);

      // If lock file exists, also clean up any orphaned Chrome processes on Windows
      // This indicates a previous Chrome instance didn't shut down cleanly
      if (process.platform === "win32") {
        try {
          const { execSync } = require("child_process");
          // Use WMIC to find Chrome processes with command line containing our profile path
          const normalizedPath = userDataDir.replace(/\\/g, "\\\\");
          const cmd = `wmic process where "name='chrome.exe' and CommandLine like '%${normalizedPath}%'" get ProcessId /format:list 2>nul`;
          const output = execSync(cmd, { timeout: 3000, windowsHide: true, encoding: "utf8" });

          // Parse PIDs from WMIC output
          const pidMatches = output.match(/ProcessId=(\d+)/g);
          if (pidMatches && pidMatches.length > 0) {
            const pids = pidMatches.map((m: string) => m.split("=")[1]);
            logger.debug("[headless-launcher] Found orphaned Chrome processes (lock file present)", {
              pids,
              count: pids.length,
            });

            // Kill each process
            for (const pid of pids) {
              try {
                execSync(`taskkill /F /PID ${pid}`, { timeout: 1000, windowsHide: true });
              } catch (killErr) {
                // Process might have already exited, ignore
              }
            }
            logger.debug("[headless-launcher] Cleaned up orphaned Chrome processes");
          }
        } catch (err) {
          // Ignore errors - WMIC might not find any processes
          logger.debug("[headless-launcher] No orphaned Chrome processes to clean up");
        }
      }
    }
  } catch (err) {
    // Ignore lock file cleanup errors (file might be in use)
    logger.debug("[headless-launcher] Could not remove lock file (may be in use)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const chromeArgs = buildHeadlessChromeArgs(userDataDir, debugPort, userAgent);

  logger.info("[headless-launcher] Launching HEADLESS browser", {
    mode: "HEADLESS (background - no visible window)",
    executablePath: executablePath || "puppeteer-bundled",
    userDataDir,
    debugPort,
    hasUserAgent: !!userAgent,
  });

  logger.debug("[headless-launcher] Chrome arguments", {
    args: chromeArgs,
    argsCount: chromeArgs.length,
  });

  let chromeProcess: any = null;

  try {
    // ALWAYS use spawn + connect pattern for consistency and proper profile loading
    // This works for both system Chrome and ensures user-data-dir is properly loaded
    const { spawn } = require("child_process");

    // If no executable path provided, we need one for spawn pattern
    if (!executablePath) {
      throw new Error(
        "Chrome executable path is required for headless mode. " +
          "Profile-based cookie extraction requires system Chrome. " +
          "Please configure browserPath in the profile settings."
      );
    }

    logger.info("[headless-launcher] Spawning Chrome process with user-data-dir (HEADLESS)");
    chromeProcess = spawn(executablePath, chromeArgs, {
      detached: true,
      stdio: "ignore",
    });

    // Track PID for cleanup
    const chromePid = chromeProcess.pid;
    logger.debug("[headless-launcher] Chrome process spawned", {
      pid: chromePid,
      debugPort,
    });

    // Register PID immediately for global tracking
    chromePIDRegistry.register(chromePid);

    // Unref so the parent can exit independently
    chromeProcess.unref();

    logger.info("[headless-launcher] Chrome process spawned, waiting for debugging port..."); // Give Chrome more time to initialize on Windows (headless mode needs 3-4 seconds to start debug server)
    logger.debug("[headless-launcher] Waiting 4000ms for Chrome to initialize debug port...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Retry connection to debugging port with quick failure detection
    // If Chrome fails to start, we want to fail fast and try a different port
    const maxRetries = 5; // Reduced from 20 - fail fast if Chrome won't start
    const initialRetryDelay = 1000; // Start with 1000ms (Windows headless needs more time)
    let browser: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Exponential backoff: 500ms, 750ms, 1125ms, 1687ms, 2531ms
        const retryDelay = Math.min(initialRetryDelay * Math.pow(1.5, i), 3000);

        logger.debug(`[headless-launcher] Connection attempt ${i + 1}/${maxRetries} (delay: ${retryDelay}ms)...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Try to connect
        browser = await puppeteer.connect({
          browserURL: `http://127.0.0.1:${debugPort}`,
          defaultViewport: null,
        });

        logger.info(`[headless-launcher] ✅ Successfully connected to Chrome instance on attempt ${i + 1}!`);
        break;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.debug(`[headless-launcher] Connection attempt ${i + 1} failed: ${errorMessage}`);

        if (i === maxRetries - 1) {
          logger.error("[headless-launcher] Failed to connect after quick retries", {
            error: errorMessage,
            debugPort,
            attempts: maxRetries,
            suggestion: "Chrome may have failed to start on this port. Will try a different port.",
          });

          // Force kill the Chrome process since we can't connect to it
          if (chromeProcess && chromeProcess.pid) {
            logger.warn("[headless-launcher] Force killing unresponsive Chrome process", {
              pid: chromeProcess.pid,
            });
            try {
              if (process.platform === "win32") {
                // Use /T to kill entire process tree (parent + all children)
                execSync(`taskkill /F /PID ${chromeProcess.pid} /T 2>nul`, { timeout: 2000, windowsHide: true });
              } else {
                process.kill(chromeProcess.pid, "SIGKILL");
              }
              chromePIDRegistry.unregister(chromeProcess.pid);
            } catch (killErr) {
              logger.debug("[headless-launcher] Failed to kill Chrome process (may have already exited)");
              chromePIDRegistry.unregister(chromeProcess.pid);
            }
          }

          throw new Error(
            `Failed to connect to Chrome after ${maxRetries} attempts on port ${debugPort}. ` +
              `Chrome process may have failed to start or port is not responsive.`
          );
        }
      }
    }

    if (!browser) {
      throw new Error("Failed to establish connection to Chrome");
    }

    logger.info("[headless-launcher] ✅ HEADLESS browser launched successfully");
    logger.debug("[headless-launcher] Browser details", {
      wsEndpoint: browser.wsEndpoint(),
      userDataDir,
      chromePid: chromeProcess?.pid,
    });

    // Return browser with chromeProcess for cleanup
    return { browser, chromeProcess };
  } catch (error) {
    logger.error("[headless-launcher] Failed to launch HEADLESS browser", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userDataDir,
      executablePath: executablePath || "puppeteer-bundled",
    });

    // Clean up Chrome process if it exists
    if (chromeProcess && chromeProcess.pid) {
      logger.warn("[headless-launcher] Cleaning up Chrome process after launch failure", {
        pid: chromeProcess.pid,
      });
      try {
        if (process.platform === "win32") {
          // Use /T to kill entire process tree (parent + all children)
          execSync(`taskkill /F /PID ${chromeProcess.pid} /T 2>nul`, { timeout: 2000, windowsHide: true });
        } else {
          process.kill(chromeProcess.pid, "SIGKILL");
        }
        chromePIDRegistry.unregister(chromeProcess.pid);
      } catch (killErr) {
        logger.debug("[headless-launcher] Failed to kill Chrome process (may have already exited)");
        chromePIDRegistry.unregister(chromeProcess.pid);
      }
    }

    throw error;
  }
}
