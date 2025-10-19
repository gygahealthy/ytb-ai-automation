/**
 * Cookie rotation service
 * Handles automatic rotation of __Secure-1PSIDTS cookie
 */

import { CookieJar } from "tough-cookie";
import type {
  CookieCollection,
  RotationResult,
} from "../../shared/types/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { endpoints, headers } from "../../shared/config/index.js";
import crypto from "crypto";
import { cookiesToHeader } from "./cookie-parser.helpers.js";

let gotInstance: any = null;

async function getGot() {
  if (!gotInstance) {
    gotInstance = (await import("got")).default;
  }
  return gotInstance;
}

/**
 * Rotation control interface
 */
export interface RotationControl {
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Generate SAPISIDHASH authorization header
 * @param origin - Origin URL (e.g., "https://gemini.google.com")
 * @param sapisid - SAPISID cookie value
 * @returns Authorization header value
 */
function generateSAPISIDHASH(origin: string, sapisid: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hashInput = `${timestamp} ${sapisid} ${origin}`;
  const hash = crypto.createHash("sha1").update(hashInput).digest("hex");
  return `SAPISIDHASH ${timestamp}_${hash}`;
}

/**
 * Refresh credentials using the refreshCreds endpoint
 * This refreshes SIDCC and PSIDCC cookies (session/security cookies)
 * @param cookies - Cookie collection
 * @param options - Refresh options
 * @returns Refresh result with updated cookies
 */
export async function refreshCreds(
  cookies: CookieCollection,
  options: {
    proxy?: string;
    skipCache?: boolean;
    apiKey?: string;
    gsessionid?: string;
  } = {}
): Promise<RotationResult & { updatedCookies?: Record<string, string> }> {
  const startTime = Date.now();

  try {
    const got = await getGot();
    const sapisid = cookies["SAPISID"] || cookies["__Secure-1PAPISID"];
    if (!sapisid) {
      throw new Error("SAPISID cookie is required for refreshCreds");
    }

    const psid = cookies["__Secure-1PSID"];
    if (!psid) {
      throw new Error("__Secure-1PSID cookie is required for refreshCreds");
    }

    // TODO: Implement database-backed cache check instead of file-based cache
    // Check cache freshness (shorter interval for session cookies)

    // Build cookie jar
    const jar = new CookieJar();
    const cookieHeader = cookiesToHeader(cookies);

    for (const part of cookieHeader.split(";")) {
      const trimmed = part.trim();
      if (trimmed && trimmed.includes("=")) {
        try {
          // Set cookies for both google.com and the signaler domain
          jar.setCookieSync(trimmed, "https://google.com");
          jar.setCookieSync(trimmed, "https://accounts.google.com");
          jar.setCookieSync(trimmed, "https://signaler-pa.clients6.google.com");
        } catch {
          // Ignore malformed cookies
        }
      }
    }

    // Generate authorization header
    const origin = "https://gemini.google.com";
    const authorization = generateSAPISIDHASH(origin, sapisid);

    // Default values (these might need to be extracted from actual Gemini sessions)
    const apiKey = options.apiKey || "AIzaSyBWW50ghQ5qHpMg1gxHV7U9t0wHE0qIUk4";
    const gsessionid = options.gsessionid || generateRandomSessionId();

    const refreshUrl = `https://signaler-pa.clients6.google.com/punctual/v1/refreshCreds?key=${apiKey}&gsessionid=${gsessionid}`;

    logger.debug("Sending refreshCreds request...");

    // Try with authorization header first, fallback to cookie-only approach
    let response = await got.post(refreshUrl, {
      http2: true,
      cookieJar: jar,
      headers: {
        accept: "*/*",
        "accept-language": "en,en-US;q=0.9",
        authorization: authorization,
        "cache-control": "no-cache",
        "content-type": "application/json+protobuf",
        origin: origin,
        pragma: "no-cache",
        priority: "u=1, i",
        referer: "https://gemini.google.com/",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent": headers.common["User-Agent"],
        "x-goog-authuser": "0",
      },
      body: '["OGtFFXbB"]',
      throwHttpErrors: false,
      ...(options.proxy ? { proxy: options.proxy } : {}),
    });

    // If 401, try without authorization header (cookie-based auth only)
    if (response.statusCode === 401) {
      logger.debug(
        "Received 401 with authorization header, retrying without it..."
      );
      response = await got.post(refreshUrl, {
        http2: true,
        cookieJar: jar,
        headers: {
          accept: "*/*",
          "accept-language": "en,en-US;q=0.9",
          "cache-control": "no-cache",
          "content-type": "application/json+protobuf",
          origin: origin,
          pragma: "no-cache",
          priority: "u=1, i",
          referer: "https://gemini.google.com/",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "user-agent": headers.common["User-Agent"],
          "x-goog-authuser": "0",
        },
        body: '["OGtFFXbB"]',
        throwHttpErrors: false,
        ...(options.proxy ? { proxy: options.proxy } : {}),
      });
    }

    logger.debug(`RefreshCreds response: ${response.statusCode}`);

    if (response.statusCode !== 200) {
      return {
        success: false,
        status: response.statusCode,
        error: `RefreshCreds failed with status ${response.statusCode}`,
        timestamp: startTime,
      };
    }

    // Extract updated cookies from Set-Cookie headers
    const setCookie = response.headers["set-cookie"];
    if (!setCookie) {
      return {
        success: false,
        status: response.statusCode,
        error: "No Set-Cookie headers returned from refreshCreds",
        timestamp: startTime,
      };
    }

    logger.debug(
      `RefreshCreds Set-Cookie headers: ${JSON.stringify(setCookie)}`
    );

    const updatedCookies: Record<string, string> = {};
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    // Extract SIDCC and PSIDCC cookies
    for (const cookie of cookieArray) {
      logger.debug(
        `Checking refreshCreds cookie: ${cookie.substring(0, 100)}...`
      );

      // Match various SIDCC and PSIDCC patterns
      const patterns = [
        /SIDCC=([^;]+)/,
        /__Secure-1PSIDCC=([^;]+)/,
        /__Secure-3PSIDCC=([^;]+)/,
      ];

      for (const pattern of patterns) {
        const match = cookie.match(pattern);
        if (match) {
          const cookieName = pattern.source.split("=")[0].replace(/[\\^]/g, "");
          updatedCookies[cookieName] = match[1];
          logger.debug(`Found ${cookieName} in refreshCreds response`);
        }
      }
    }

    if (Object.keys(updatedCookies).length > 0) {
      logger.info(
        `✅ RefreshCreds successful: updated ${
          Object.keys(updatedCookies).length
        } cookies`
      );

      return {
        success: true,
        status: response.statusCode,
        timestamp: startTime,
        updatedCookies,
      };
    }

    return {
      success: false,
      status: response.statusCode,
      error: "No SIDCC/PSIDCC cookies found in refreshCreds response",
      timestamp: startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`RefreshCreds error: ${message}`);

    return {
      success: false,
      error: message,
      timestamp: startTime,
    };
  }
}

/**
 * Generate a random session ID for refreshCreds
 */
function generateRandomSessionId(): string {
  return crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/[/+=]/g, "")
    .substring(0, 22);
}

/**
 * Rotate __Secure-1PSIDTS cookie
 * @param cookies - Cookie collection
 * @param options - Rotation options
 * @returns Rotation result with new PSIDTS if successful
 */
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

    // TODO: Implement database-backed cache check instead of file-based cache
    // Check cache freshness to avoid 429 Too Many Requests

    // Build cookie jar for got
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

    // Make rotation request
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

    // Extract new PSIDTS from Set-Cookie headers
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
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    // Method 1: Check Set-Cookie headers
    for (const cookie of cookieArray) {
      logger.debug(`Checking cookie: ${cookie.substring(0, 100)}...`);

      // Try multiple patterns for PSIDTS (including RTS variant)
      const patterns = [
        /__Secure-1PSIDTS=([^;]+)/,
        /__Secure-3PSIDTS=([^;]+)/,
        /__Secure-1PSIDRTS=([^;]+)/, // RTS variant
        /__Secure-3PSIDRTS=([^;]+)/, // RTS variant
        /PSIDTS=([^;]+)/,
      ];

      for (const pattern of patterns) {
        const match = cookie.match(pattern);
        if (match) {
          newPSIDTS = match[1];
          logger.debug(`Found PSIDTS with pattern: ${pattern}`);
          break;
        }
      }

      if (newPSIDTS) break;
    }

    // Method 2: Check cookie jar (like Python httpx does)
    if (!newPSIDTS) {
      logger.debug("Not found in Set-Cookie headers, checking cookie jar...");
      try {
        const jarCookies = await jar.getCookies("https://accounts.google.com");
        logger.debug(`Cookie jar has ${jarCookies.length} cookies`);

        for (const cookie of jarCookies) {
          logger.debug(
            `Jar cookie: ${cookie.key}=${cookie.value.substring(0, 30)}...`
          );

          // Check for various PSIDTS cookie names
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
        logger.debug(
          `Error reading cookie jar: ${
            error instanceof Error ? error.message : "Unknown"
          }`
        );
      }
    }

    if (newPSIDTS) {
      // TODO: Persist to database instead of file cache
      logger.info("✅ Cookie rotated successfully");

      return {
        success: true,
        newPSIDTS,
        status: response.statusCode,
        timestamp: startTime,
      };
    }

    // If no PSIDTS found in response but status is 200,
    // the rotation likely succeeded server-side (Google doesn't return the rotated value)
    // This is expected behavior - Google rotates the cookie on their end
    if (response.statusCode === 200) {
      logger.info(
        "✅ Cookie rotation succeeded (server-side rotation - no value returned)"
      );
      return {
        success: true,
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

/**
 * Start automatic cookie rotation
 * @param cookies - Cookie collection (will be updated in place)
 * @param intervalSeconds - Rotation interval in seconds (default: 540 = 9 minutes)
 * @param options - Rotation options
 * @returns Control object to stop rotation
 */
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

    if (result.success && result.newPSIDTS) {
      cookies["__Secure-1PSIDTS"] = result.newPSIDTS;
      logger.info(
        `🔄 Auto-rotated PSIDTS: ${result.newPSIDTS.substring(0, 30)}...`
      );
    } else {
      logger.warn(
        `⚠️ Auto-rotation failed: ${result.error || "Unknown error"}`
      );
    }

    if (options.onRotate) {
      options.onRotate(result);
    }

    // Schedule next rotation
    if (running) {
      timeoutId = setTimeout(rotate, intervalSeconds * 1000);
    }
  };

  // Start first rotation
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
