/**
 * Cookie rotation service
 * Handles automatic rotation of __Secure-1PSIDTS cookie
 */

import { CookieJar } from "tough-cookie";
import type { CookieCollection, RotationResult } from "../../../gemini-apis/shared/types/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { endpoints, headers } from "../../../gemini-apis/shared/config/index.js";
import { cookiesToHeader } from "../../cookie/helpers/cookie-parser.helpers.js";

let gotInstance: any = null;

async function getGot() {
  if (!gotInstance) {
    gotInstance = (await import("got")).default;
  }
  return gotInstance;
}

export interface RotationControl {
  stop: () => void;
  isRunning: () => boolean;
}

export async function rotate1psidts(
  cookies: CookieCollection,
  options: { proxy?: string; skipCache?: boolean } = {}
): Promise<RotationResult> {
  const startTime = Date.now();

  try {
    const got = await getGot();
    const psid = cookies["__Secure-1PSID"];
    if (!psid) {
      throw new Error("__Secure-1PSID cookie is required for rotation");
    }

    const jar = new CookieJar();
    const cookieHeader = cookiesToHeader(cookies);

    for (const part of cookieHeader.split(";")) {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes("=")) {
        try {
          jar.setCookieSync(trimmed, "https://accounts.google.com");
        } catch {
          // Ignore malformed cookies
        }
      }
    }

    logger.debug("Sending rotation request...");

    const response = await got.post(endpoints.rotateCookies, {
      http2: true,
      cookieJar: jar,
      headers: {
        ...headers.rotateCookies,
        "User-Agent": headers.common["User-Agent"],
      },
      body: '[000,"-0000000000000000000"]',
      throwHttpErrors: false,
      ...(options.proxy ? { proxy: options.proxy } : {}),
    });

    logger.debug(`Rotation response: ${response.statusCode}`);

    if (response.statusCode !== 200) {
      return {
        success: false,
        status: response.statusCode,
        error: `Cookie rotation failed with status ${response.statusCode}`,
        timestamp: startTime,
      };
    }

    const setCookie = response.headers["set-cookie"];
    if (!setCookie) {
      return {
        success: false,
        status: response.statusCode,
        error: "No Set-Cookie headers returned",
        timestamp: startTime,
      };
    }

    logger.debug(`Set-Cookie headers: ${JSON.stringify(setCookie)}`);

    let newPSIDTS: string | undefined;
    let newSIDCC: string | undefined;
    let newSecure1PSIDCC: string | undefined;
    let newSecure3PSIDCC: string | undefined;
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const cookie of cookieArray) {
      logger.debug(`Checking cookie: ${cookie.substring(0, 100)}...`);

      const psidtsPatterns = [
        /__Secure-1PSIDTS=([^;]+)/,
        /__Secure-3PSIDTS=([^;]+)/,
        /__Secure-1PSIDRTS=([^;]+)/,
        /__Secure-3PSIDRTS=([^;]+)/,
        /PSIDTS=([^;]+)/,
      ];

      for (const pattern of psidtsPatterns) {
        const match = cookie.match(pattern);
        if (match) {
          newPSIDTS = match[1];
          logger.debug(`Found PSIDTS with pattern: ${pattern}`);
          break;
        }
      }

      const sidccMatch = cookie.match(/^SIDCC=([^;]+)/);
      if (sidccMatch) {
        newSIDCC = sidccMatch[1];
        logger.debug(`Found SIDCC cookie`);
      }

      const secure1psidccMatch = cookie.match(/__Secure-1PSIDCC=([^;]+)/);
      if (secure1psidccMatch) {
        newSecure1PSIDCC = secure1psidccMatch[1];
        logger.debug(`Found __Secure-1PSIDCC cookie`);
      }

      const secure3psidccMatch = cookie.match(/__Secure-3PSIDCC=([^;]+)/);
      if (secure3psidccMatch) {
        newSecure3PSIDCC = secure3psidccMatch[1];
        logger.debug(`Found __Secure-3PSIDCC cookie`);
      }
    }

    if (!newPSIDTS) {
      logger.debug("Not found in Set-Cookie headers, checking cookie jar...");
      try {
        const jarCookies = await jar.getCookies("https://accounts.google.com");
        logger.debug(`Cookie jar has ${jarCookies.length} cookies`);

        for (const cookie of jarCookies) {
          logger.debug(`Jar cookie: ${cookie.key}=${cookie.value.substring(0, 30)}...`);

          if (
            cookie.key === "__Secure-1PSIDTS" ||
            cookie.key === "__Secure-3PSIDTS" ||
            cookie.key === "__Secure-1PSIDRTS" ||
            cookie.key === "__Secure-3PSIDRTS"
          ) {
            newPSIDTS = cookie.value;
            logger.debug(`Found ${cookie.key} in cookie jar`);
            break;
          }
        }
      } catch (error) {
        logger.debug(`Error reading cookie jar: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    if (newPSIDTS) {
      logger.info("✅ Cookie rotated successfully");

      return {
        success: true,
        newPSIDTS,
        newSIDCC,
        newSecure1PSIDCC,
        newSecure3PSIDCC,
        status: response.statusCode,
        timestamp: startTime,
      };
    }

    if (response.statusCode === 200) {
      logger.info("✅ Cookie rotation succeeded (server-side rotation - no value returned)");
      return {
        success: true,
        newSIDCC,
        newSecure1PSIDCC,
        newSecure3PSIDCC,
        status: response.statusCode,
        timestamp: startTime,
      };
    }

    return {
      success: false,
      status: response.statusCode,
      error: "__Secure-1PSIDTS not found in response",
      timestamp: startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Cookie rotation error: ${message}`);

    return {
      success: false,
      error: message,
      timestamp: startTime,
    };
  }
}

export function startAutoRotation(
  cookies: CookieCollection,
  intervalSeconds = 540,
  options: { proxy?: string; onRotate?: (result: RotationResult) => void } = {}
): RotationControl {
  let timeoutId: NodeJS.Timeout | null = null;
  let running = true;

  const rotate = async () => {
    if (!running) return;

    logger.debug("⏰ Auto-rotation triggered");
    const result = await rotate1psidts(cookies, options);

    if (result.success) {
      if (result.newPSIDTS) {
        cookies["__Secure-1PSIDTS"] = result.newPSIDTS;
        logger.info(`🔄 Auto-rotated PSIDTS: ${result.newPSIDTS.substring(0, 30)}...`);
      }
      if (result.newSIDCC) {
        cookies["SIDCC"] = result.newSIDCC;
        logger.info(`🔄 Auto-rotated SIDCC`);
      }
      if (result.newSecure1PSIDCC) {
        cookies["__Secure-1PSIDCC"] = result.newSecure1PSIDCC;
        logger.info(`🔄 Auto-rotated __Secure-1PSIDCC`);
      }
      if (result.newSecure3PSIDCC) {
        cookies["__Secure-3PSIDCC"] = result.newSecure3PSIDCC;
        logger.info(`🔄 Auto-rotated __Secure-3PSIDCC`);
      }
    } else {
      logger.warn(`⚠️ Auto-rotation failed: ${result.error || "Unknown error"}`);
    }

    if (options.onRotate) {
      options.onRotate(result);
    }

    if (running) {
      timeoutId = setTimeout(rotate, intervalSeconds * 1000);
    }
  };

  timeoutId = setTimeout(rotate, intervalSeconds * 1000);
  logger.info(`🔄 Auto-rotation started (interval: ${intervalSeconds}s)`);

  return {
    stop: () => {
      running = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      logger.info("🛑 Auto-rotation stopped");
    },
    isRunning: () => running,
  };
}
export function formatMonitorRow(row: any) {
  return {
    id: row.id,
    cookieId: row.cookieId,
    lastRunAt: row.lastRunAt,
  };
}
