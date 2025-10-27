import { Logger } from "../../../../../shared/utils/logger";

const logger = new Logger("VEO3Helper");

/**
 * Build request headers that mimic a real browser for VEO3 tRPC API
 * Used for project and general tRPC endpoint requests
 */
export function buildVEO3Headers(cookie: string): HeadersInit {
  return {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://labs.google",
    referer: "https://labs.google/fx/tools/flow",
    "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    cookie: cookie,
  };
}

/**
 * Build headers for Google AI Sandbox API requests
 * Used for video generation and status checking endpoints
 */
export function buildGoogleApiHeaders(bearerToken: string): HeadersInit {
  return {
    accept: "*/*",
    "accept-language": "en,en-US;q=0.9",
    authorization: `Bearer ${bearerToken}`,
    "cache-control": "no-cache",
    "content-type": "text/plain;charset=UTF-8",
    origin: "https://labs.google",
    pragma: "no-cache",
    priority: "u=1, i",
    referer: "https://labs.google/",
    "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    "x-browser-channel": "stable",
    "x-browser-copyright": "Copyright 2025 Google LLC. All rights reserved.",
    "x-browser-year": "2025",
  };
}

/**
 * Extract Bearer token from Flow page HTML
 * Fetches https://labs.google/fx/tools/flow and parses __NEXT_DATA__ script tag
 * @param cookie - Authentication cookie string from profile
 */
export async function extractBearerToken(cookie: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const flowUrl = "https://labs.google/fx/tools/flow";
    logger.info(`Fetching Flow page to extract Bearer token from: ${flowUrl}`);

    const response = await fetch(flowUrl, {
      method: "GET",
      headers: {
        accept: "text/html",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        cookie,
      },
    });

    if (!response.ok) {
      logger.error(`Failed to fetch Flow page: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const html = await response.text();
    logger.info(`Received HTML page (${html.length} bytes)`);

    // Extract __NEXT_DATA__ script tag content
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      logger.error("Could not find __NEXT_DATA__ script tag in HTML");
      return { success: false, error: "__NEXT_DATA__ script tag not found" };
    }

    const jsonData = JSON.parse(scriptMatch[1]);
    const accessToken = jsonData?.props?.pageProps?.session?.access_token;

    if (!accessToken) {
      logger.error("access_token not found in __NEXT_DATA__");
      return { success: false, error: "access_token not found in session data" };
    }

    logger.info(`Successfully extracted Bearer token (${accessToken.substring(0, 20)}...)`);
    return { success: true, token: accessToken };
  } catch (error) {
    logger.error("Error extracting Bearer token", error);
    return { success: false, error: String(error) };
  }
}
