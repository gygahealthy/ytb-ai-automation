/**
 * HTTP Helper Functions
 * Common utilities for HTTP requests
 * Headers building, parsing, response handling
 */

import type { CookieManagerDB } from "../services/cookie-manager-db.js";
import { config } from "../shared/config/app-config.js";

/**
 * Build common HTTP headers that mimic a real Chrome browser
 */
export function createHttpCommonHeaders(
  cookieManager: CookieManagerDB
): Record<string, string> {
  return {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "sec-ch-ua":
      '"Google Chrome";v="120", "Chromium";v="120", "Not?A_Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cache-control": "no-cache",
    pragma: "no-cache",
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en-US,en;q=0.9",
    dnt: "1",
    "upgrade-insecure-requests": "1",
    cookie: cookieManager.getCookieHeader(),
  };
}

/**
 * Build headers specifically for Gemini API requests
 */
export function createGeminiHeaders(
  cookieManager: CookieManagerDB
): Record<string, string> {
  return {
    ...createHttpCommonHeaders(cookieManager),
    "content-type": "application/x-www-form-urlencoded;charset=utf-8",
    origin: config.geminiBaseUrl,
    referer: `${config.geminiBaseUrl}/`,
    "x-same-domain": "1",
  };
}

/**
 * Build headers for GET requests (token extraction, page fetching)
 */
export function createGetHeaders(
  cookieManager: CookieManagerDB
): Record<string, string> {
  return {
    ...createHttpCommonHeaders(cookieManager),
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  };
}

/**
 * Convert headers object to lowercase keys
 */
export function normalizeHeaders(
  headers: Record<string, string | string[]>
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

/**
 * Extract header value (handles both string and array values)
 */
export function getHeader(
  headers: Record<string, string | string[]>,
  key: string
): string | undefined {
  const value = headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Build status message from status code (undici doesn't provide statusMessage)
 */
export function getStatusMessage(statusCode: number): string {
  const statusMessages: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    408: "Request Timeout",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return statusMessages[statusCode] || "Unknown";
}
