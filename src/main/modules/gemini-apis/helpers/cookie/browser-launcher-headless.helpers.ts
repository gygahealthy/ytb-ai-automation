/**
 * Headless Browser Launcher Helper
 * Handles launching Chrome in HEADLESS (background) mode
 * Uses profile's user-data-dir to maintain cookies and login state
 */

import { logger } from "../../../../utils/logger-backend";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Build Chrome arguments for HEADLESS mode with profile data
 * @param userDataDir - User profile directory path
 * @param debugPort - Remote debugging port number
 * @param userAgent - Optional custom user agent
 * @returns Array of Chrome command-line arguments for headless mode
 */
export function buildHeadlessChromeArgs(
  userDataDir: string,
  debugPort: number,
  userAgent?: string
): string[] {
  const args = [
    `--remote-debugging-port=${debugPort}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${userDataDir}`,
    "--headless=new", // New headless mode (more stable)
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
    throw new Error(
      "userDataDir is required for headless browser launch with profile"
    );
  }

  // Ensure user data directory exists
  if (!fs.existsSync(userDataDir)) {
    logger.info("[headless-launcher] Creating user data directory", {
      userDataDir,
    });
    fs.mkdirSync(userDataDir, { recursive: true });
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

    logger.info(
      "[headless-launcher] Spawning Chrome process with user-data-dir (HEADLESS)"
    );
    const chromeProcess = spawn(executablePath, chromeArgs, {
      detached: true,
      stdio: "ignore",
    });

    // Unref so the parent can exit independently
    chromeProcess.unref();

    logger.info(
      "[headless-launcher] Chrome process spawned, waiting for debugging port..."
    );

    // Wait and retry connection to debugging port
    const maxRetries = 15;
    const retryDelay = 1000; // 1 second
    let browser: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.debug(
          `[headless-launcher] Connection attempt ${i + 1}/${maxRetries}...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Try to connect
        browser = await puppeteer.connect({
          browserURL: `http://127.0.0.1:${debugPort}`,
          defaultViewport: null,
        });

        logger.info(
          "[headless-launcher] ✅ Successfully connected to Chrome instance!"
        );
        break;
      } catch (err) {
        if (i === maxRetries - 1) {
          logger.error(
            "[headless-launcher] Failed to connect after all retries",
            {
              error: err instanceof Error ? err.message : String(err),
              debugPort,
            }
          );
          throw new Error(
            `Failed to connect to Chrome after ${maxRetries} attempts. Port: ${debugPort}`
          );
        }
      }
    }

    if (!browser) {
      throw new Error("Failed to establish connection to Chrome");
    }

    logger.info(
      "[headless-launcher] ✅ HEADLESS browser launched successfully"
    );
    logger.debug("[headless-launcher] Browser details", {
      wsEndpoint: browser.wsEndpoint(),
      userDataDir,
    });

    return browser;
  } catch (error) {
    logger.error("[headless-launcher] Failed to launch HEADLESS browser", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userDataDir,
      executablePath: executablePath || "puppeteer-bundled",
    });
    throw error;
  }
}
