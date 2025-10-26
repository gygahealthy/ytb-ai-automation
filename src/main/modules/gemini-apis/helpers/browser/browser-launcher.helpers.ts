/**
 * Browser Launcher Coordinator
 * Coordinates between headless and non-headless browser launchers
 * Routes to the appropriate launcher based on mode
 */

import { logger } from "../../../../utils/logger-backend";
import * as fs from "fs";
import * as net from "net";
import { launchHeadlessBrowser } from "./browser-launcher-headless.helpers";
import { launchVisibleBrowser } from "./browser-launcher-visible.helpers";

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
 * Find an available port in a range
 * @param startPort - Starting port number
 * @param maxAttempts - Maximum number of ports to try
 * @returns Promise<number> - Available port number
 */
export async function findAvailablePort(startPort: number = 9223, maxAttempts: number = 50): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      logger.debug("[browser-launcher] Found available port", { port, attempt: i + 1 });
      return port;
    }
    logger.debug("[browser-launcher] Port in use, trying next", { port });
  }

  throw new Error(`No available ports found in range ${startPort}-${startPort + maxAttempts - 1}`);
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

  // Find an available port instead of random selection
  logger.debug("[browser-launcher] Finding available debug port...");
  const debugPort = await findAvailablePort(9223, 50);

  logger.info("[browser-launcher] Browser launch request", {
    profileId: profile.id,
    mode: headless ? "HEADLESS (background)" : "NON-HEADLESS (visible)",
    userDataDir: profile.userDataDir,
    executablePath: executablePath || "NOT FOUND (will use puppeteer-bundled)",
    debugPort,
  });

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

  try {
    if (headless) {
      // Launch in HEADLESS (background) mode
      logger.info("[browser-launcher] Routing to HEADLESS launcher (background mode)");
      const headlessBrowser = await launchHeadlessBrowser(executablePath, profile.userDataDir, debugPort, profile.userAgent);
      return { browser: headlessBrowser, chromeProcess: null };
    } else {
      // Launch in NON-HEADLESS (visible) mode
      logger.info("[browser-launcher] Routing to NON-HEADLESS launcher (visible mode)");

      if (!executablePath) {
        throw new Error(
          "Chrome executable not found. Visible mode requires a Chrome installation. " +
            "Please install Chrome or set CHROME_EXECUTABLE_PATH environment variable."
        );
      }

      const visibleResult = await launchVisibleBrowser(executablePath, profile.userDataDir, debugPort, profile.userAgent);
      return visibleResult;
    }
  } catch (error) {
    logger.error("[browser-launcher] Browser launch failed", {
      error: error instanceof Error ? error.message : String(error),
      mode: headless ? "HEADLESS" : "NON-HEADLESS",
      profileId: profile.id,
      userDataDir: profile.userDataDir,
    });
    throw error;
  }
}
