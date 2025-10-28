/**
 * Browser Launcher Coordinator
 * Coordinates between headless and non-headless browser launchers
 * Routes to the appropriate launcher based on mode
 * Implements profile-level queue to prevent simultaneous launches with same userDataDir
 */

import { logger } from "../../../../utils/logger-backend";
import * as fs from "fs";
import * as net from "net";
import { launchHeadlessBrowser } from "./browser-launcher-headless.helpers";
import { launchVisibleBrowser } from "./browser-launcher-visible.helpers";

/**
 * Profile-level browser launch queue with system-wide throttling
 * Ensures only one Chrome instance launches per userDataDir at a time
 * Also implements global throttling to prevent overwhelming Chrome
 */
class ProfileLaunchQueue {
  private queues = new Map<string, Array<() => Promise<void>>>();
  private processing = new Set<string>();
  private lastGlobalLaunch = 0; // Timestamp of last Chrome launch (any profile)
  private readonly GLOBAL_THROTTLE_MS = 2000; // Minimum delay between any Chrome launches

  /**
   * Add a launch operation to the queue for a specific profile
   * @param userDataDir - Profile's user data directory (queue key)
   * @param operation - Async operation to execute
   * @returns Promise that resolves when operation completes
   */
  async enqueue<T>(userDataDir: string, operation: () => Promise<T>): Promise<T> {
    // Normalize path for consistent queue key
    const queueKey = userDataDir.toLowerCase().replace(/\\/g, "/");

    return new Promise<T>((resolve, reject) => {
      const wrappedOp = async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      // Add to queue
      if (!this.queues.has(queueKey)) {
        this.queues.set(queueKey, []);
      }
      this.queues.get(queueKey)!.push(wrappedOp);

      // Process queue if not already processing
      this.processQueue(queueKey);
    });
  }

  /**
   * Process queued operations for a profile
   */
  private async processQueue(queueKey: string): Promise<void> {
    // Skip if already processing this profile's queue
    if (this.processing.has(queueKey)) {
      return;
    }

    const queue = this.queues.get(queueKey);
    if (!queue || queue.length === 0) {
      return;
    }

    this.processing.add(queueKey);

    try {
      while (queue.length > 0) {
        // Apply global throttle: ensure minimum time elapsed since ANY Chrome launch
        const now = Date.now();
        const timeSinceLastLaunch = now - this.lastGlobalLaunch;
        if (timeSinceLastLaunch < this.GLOBAL_THROTTLE_MS) {
          const throttleDelay = this.GLOBAL_THROTTLE_MS - timeSinceLastLaunch;
          logger.debug(`[browser-launcher] Global throttle: waiting ${throttleDelay}ms before next Chrome launch`, {
            queueKey,
            timeSinceLastLaunch,
          });
          await new Promise((resolve) => setTimeout(resolve, throttleDelay));
        }

        // Update global launch timestamp BEFORE starting the operation
        this.lastGlobalLaunch = Date.now();

        const operation = queue.shift()!;
        await operation();

        // Small delay between operations to ensure clean handoff (profile-level)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } finally {
      this.processing.delete(queueKey);
      // Clean up empty queue
      if (queue.length === 0) {
        this.queues.delete(queueKey);
      }
    }
  }
}

// Singleton queue manager
const profileLaunchQueue = new ProfileLaunchQueue();

/**
 * Generate a random port number in a range
 * @param min - Minimum port number (default: 9000)
 * @param max - Maximum port number (default: 32000)
 * @returns Random port number
 */
function getRandomPort(min: number = 9000, max: number = 32000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a port is available
 * @param port - Port number to check
 * @returns Promise<boolean> - true if port is available, false if in use
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, "127.0.0.1");
  });
}

/**
 * Find an available port using random selection with verification
 * This is simpler and more reliable than sequential scanning
 * @param minPort - Minimum port number (default: 9000)
 * @param maxPort - Maximum port number (default: 32000)
 * @param maxAttempts - Maximum number of random attempts
 * @returns Promise<number> - Available port number
 */
export async function findAvailablePort(
  minPort: number = 9000,
  maxPort: number = 32000,
  maxAttempts: number = 20
): Promise<number> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const port = getRandomPort(minPort, maxPort);
    const available = await isPortAvailable(port);

    if (available) {
      logger.debug("[browser-launcher] Found available port (random)", { port, attempt });
      return port;
    }

    logger.debug("[browser-launcher] Port in use, trying another random port", { port, attempt });
  }

  throw new Error(`No available ports found after ${maxAttempts} random attempts in range ${minPort}-${maxPort}`);
}

/**
 * Find Chrome executable path on Windows
 * @returns Path to chrome.exe or undefined if not found
 */
export function findChromeExecutable(): string | undefined {
  let executablePath = process.env.CHROME_EXECUTABLE_PATH;

  if (!executablePath) {
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Chromium\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    ];

    logger.debug("[browser-launcher] Searching for Chrome executable", {
      paths: possiblePaths,
    });

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        logger.debug("[browser-launcher] Found Chrome at", {
          path: chromePath,
        });
        executablePath = chromePath;
        break;
      }
    }

    if (!executablePath) {
      logger.warn("[browser-launcher] Chrome executable not found in any standard location");
    }
  }

  return executablePath;
}

/**
 * Launch browser based on mode (headless or visible)
 * Coordinates between headless and non-headless launchers
 * Each mode uses the profile's user-data-dir to maintain cookies and login state
 * Includes retry logic with different ports if Chrome fails to start
 *
 * @param profile - Profile object with userDataDir and optional browserPath/userAgent
 * @param headless - Whether to launch in headless (background) mode or visible mode
 * @returns Puppeteer browser instance
 */
export async function launchBrowser(
  profile: any,
  headless: boolean = false
): Promise<{ browser: any; chromeProcess: any | null }> {
  // Validate profile has userDataDir
  if (!profile || !profile.userDataDir) {
    throw new Error("Profile with userDataDir is required");
  }

  const executablePath = profile.browserPath || findChromeExecutable();

  // Ensure user data directory exists
  if (!fs.existsSync(profile.userDataDir)) {
    logger.info("[browser-launcher] Creating user data directory", {
      dir: profile.userDataDir,
    });
    try {
      fs.mkdirSync(profile.userDataDir, { recursive: true });
    } catch (err) {
      logger.error("[browser-launcher] Failed to create user data directory", {
        dir: profile.userDataDir,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new Error(`Failed to create user data directory: ${profile.userDataDir}`);
    }
  }

  // Use profile-level queue to prevent simultaneous launches with same userDataDir
  logger.debug("[browser-launcher] Enqueuing launch for profile", {
    profileId: profile.id,
    userDataDir: profile.userDataDir,
    mode: headless ? "HEADLESS" : "NON-HEADLESS",
  });

  return profileLaunchQueue.enqueue(profile.userDataDir, async () => {
    logger.info("[browser-launcher] Starting browser launch (queue slot acquired)", {
      profileId: profile.id,
      userDataDir: profile.userDataDir,
      mode: headless ? "HEADLESS" : "NON-HEADLESS",
    });

    // Retry logic: try up to 3 different ports if Chrome fails to start
    const maxPortRetries = 3;
    let lastError: Error | null = null;

    for (let portAttempt = 1; portAttempt <= maxPortRetries; portAttempt++) {
      try {
        // Find a new random port for each attempt
        logger.debug("[browser-launcher] Finding available debug port...", { attempt: portAttempt });
        const debugPort = await findAvailablePort(9000, 32000, 20);

        logger.info("[browser-launcher] Browser launch request", {
          profileId: profile.id,
          mode: headless ? "HEADLESS (background)" : "NON-HEADLESS (visible)",
          userDataDir: profile.userDataDir,
          executablePath: executablePath || "NOT FOUND (will use puppeteer-bundled)",
          debugPort,
          portAttempt,
        });

        if (headless) {
          // Launch in HEADLESS (background) mode
          logger.info("[browser-launcher] Routing to HEADLESS launcher (background mode)");
          const result = await launchHeadlessBrowser(executablePath, profile.userDataDir, debugPort, profile.userAgent);
          // launchHeadlessBrowser returns { browser, chromeProcess }, pass it through
          return result;
        } else {
          // Launch in NON-HEADLESS (visible) mode
          logger.info("[browser-launcher] Routing to NON-HEADLESS launcher (visible mode)");

          if (!executablePath) {
            throw new Error(
              "Chrome executable not found. Visible mode requires a Chrome installation. " +
                "Please install Chrome or set CHROME_EXECUTABLE_PATH environment variable."
            );
          }

          return await launchVisibleBrowser(executablePath, profile.userDataDir, debugPort, profile.userAgent);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (portAttempt < maxPortRetries) {
          logger.warn("[browser-launcher] Browser launch failed, trying different port", {
            error: lastError.message,
            attempt: portAttempt,
            maxAttempts: maxPortRetries,
          });
          // Short delay before trying next port
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          logger.error("[browser-launcher] Browser launch failed after all port attempts", {
            error: lastError.message,
            mode: headless ? "HEADLESS" : "NON-HEADLESS",
            profileId: profile.id,
            userDataDir: profile.userDataDir,
            attempts: maxPortRetries,
          });
        }
      }
    }

    // All attempts failed
    throw lastError || new Error("Failed to launch browser after multiple port attempts");
  });
}
