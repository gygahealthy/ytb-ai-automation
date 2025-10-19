/**
 * Non-Headless (Visible) Browser Launcher Helper
 * Handles launching Chrome in NON-HEADLESS (visible) mode
 * Opens a visible browser window that the user can see and interact with
 * Uses profile's user-data-dir to maintain cookies and login state
 */

import { logger } from "../../../../utils/logger-backend";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Build Chrome arguments for NON-HEADLESS (visible) mode with profile data
 * @param userDataDir - User profile directory path
 * @param debugPort - Remote debugging port number
 * @param userAgent - Optional custom user agent
 * @returns Array of Chrome command-line arguments for visible mode
 */
export function buildVisibleChromeArgs(
  userDataDir: string,
  debugPort: number,
  userAgent?: string
): string[] {
  const args = [
    `--remote-debugging-port=${debugPort}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${userDataDir}`,
    // Visible mode - user can interact
    "--start-maximized",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
    "--disable-sync",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=TranslateUI",
  ];

  if (userAgent) {
    args.push(`--user-agent=${userAgent}`);
  }

  return args;
}

/**
 * Launch Chrome in NON-HEADLESS (visible) mode with profile data
 * Opens a VISIBLE browser window that the user can see and interact with
 * Uses the profile's user-data-dir to load saved cookies and login state
 *
 * Uses spawn + connect pattern to ensure profile directory is properly loaded
 *
 * @param executablePath - Path to Chrome executable (REQUIRED for visible mode)
 * @param userDataDir - Profile's user data directory path (REQUIRED)
 * @param debugPort - Remote debugging port number
 * @param userAgent - Optional custom user agent
 * @returns Puppeteer browser instance
 */
export async function launchVisibleBrowser(
  executablePath: string,
  userDataDir: string,
  debugPort: number,
  userAgent?: string
): Promise<any> {
  // Validate required parameters
  if (!executablePath) {
    throw new Error(
      "executablePath is required for non-headless browser launch"
    );
  }

  if (!userDataDir) {
    throw new Error(
      "userDataDir is required for non-headless browser launch with profile"
    );
  }

  // Ensure user data directory exists
  if (!fs.existsSync(userDataDir)) {
    logger.info("[visible-launcher] Creating user data directory", {
      userDataDir,
    });
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromeArgs = buildVisibleChromeArgs(userDataDir, debugPort, userAgent);

  logger.info("[visible-launcher] Launching NON-HEADLESS browser", {
    mode: "VISIBLE (user can see and interact with browser window)",
    executablePath,
    userDataDir,
    debugPort,
    hasUserAgent: !!userAgent,
  });

  logger.debug("[visible-launcher] Chrome arguments", {
    args: chromeArgs,
    argsCount: chromeArgs.length,
  });

  try {
    // Use spawn + connect pattern (same as profile.service.ts and browser-manager.ts)
    // This ensures the user-data-dir is properly loaded even if Chrome is already running
    const { spawn } = require("child_process");

    logger.info(
      "[visible-launcher] Spawning Chrome process with user-data-dir"
    );
    const chromeProcess = spawn(executablePath, chromeArgs, {
      detached: true,
      stdio: "ignore",
    });

    // Unref so the parent can exit independently
    chromeProcess.unref();

    logger.info(
      "[visible-launcher] Chrome process spawned, waiting for debugging port..."
    );

    // Wait and retry connection to debugging port
    const maxRetries = 15;
    const retryDelay = 1000; // 1 second
    let browser: any = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.debug(
          `[visible-launcher] Connection attempt ${i + 1}/${maxRetries}...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Try to connect
        browser = await puppeteer.connect({
          browserURL: `http://127.0.0.1:${debugPort}`,
          defaultViewport: null,
        });

        logger.info(
          "[visible-launcher] ✅ Successfully connected to Chrome instance!"
        );
        break;
      } catch (err) {
        if (i === maxRetries - 1) {
          logger.error(
            "[visible-launcher] Failed to connect after all retries",
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
      "[visible-launcher] ✅ NON-HEADLESS browser launched successfully"
    );
    logger.info(
      "[visible-launcher] 👁️  Browser window should be VISIBLE on your screen"
    );
    logger.debug("[visible-launcher] Browser details", {
      wsEndpoint: browser.wsEndpoint(),
      userDataDir,
    });

    return browser;
  } catch (error) {
    logger.error("[visible-launcher] Failed to launch NON-HEADLESS browser", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userDataDir,
      executablePath,
    });
    throw error;
  }
}
