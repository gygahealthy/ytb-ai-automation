/**
 * Token Service
 * Handles token extraction from Gemini page
 * Shared by all modules that need API tokens
 */

import { config } from "../shared/config/index.js";
import { logger } from "../../../utils/logger-backend.js";
import type { CookieManagerDB } from "../services/cookie-manager-db.js";
import { createHttpService } from "../services/http.service.js";

/**
 * Token data interface
 */
export interface TokenData {
  snlm0e: string;
  timestamp: number;
}

/**
 * Extract SNlM0e token from HTML using multiple patterns
 */
function extractSnlm0eToken(html: string): string | null {
  const patterns = [
    /"SNlM0e":"(.*?)"/, // Primary: "SNlM0e":"token"
    /SNlM0e\s*:\s*"(.*?)"/, // Alternative: SNlM0e : "token"
    /"SNlM0e"\s*,\s*"(.*?)"/, // Alternative: "SNlM0e" , "token"
    /SNlM0e\\":\\"(.*?)\\"/, // Escaped version
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract tokens from Gemini page
 * @param cookieManager - Database-integrated cookie manager instance
 * @returns Token data
 */
export async function extractTokens(
  cookieManager: CookieManagerDB
): Promise<TokenData> {
  logger.info("🔍 Extracting tokens from Gemini page...");

  // Validate cookies
  const validation = cookieManager.validate();
  if (!validation.valid) {
    throw new Error(`Invalid cookies: ${validation.error}`);
  }

  const cookies = cookieManager.getCookies();

  logger.debug(`Using PSID: ${cookies["__Secure-1PSID"]?.substring(0, 20)}...`);
  if (cookies["__Secure-1PSIDTS"]) {
    logger.debug(
      `Using PSIDTS: ${cookies["__Secure-1PSIDTS"]?.substring(0, 20)}...`
    );
  }

  try {
    // Fetch Gemini page using HTTP/2 service
    logger.debug(`Fetching: ${config.geminiBaseUrl}/app`);

    const httpService = createHttpService(cookieManager);
    const response = await httpService.get(`${config.geminiBaseUrl}/app`);

    logger.debug(
      `Response: ${response.statusCode} (${(
        response.body.length / 1024
      ).toFixed(2)} KB)`
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to fetch: ${response.statusCode} ${response.statusMessage}`
      );
    }

    const html = response.body;

    // Clean up HTTP service
    await httpService.close();

    // Extract token
    const snlm0e = extractSnlm0eToken(html);

    if (!snlm0e) {
      logger.error("Failed to extract SNlM0e token from HTML");
      throw new Error("SNlM0e token not found in HTML");
    }

    logger.info(`✅ Token extracted: ${snlm0e.substring(0, 40)}...`);

    return {
      snlm0e,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error("Token extraction failed:", error);
    throw error;
  }
}

/**
 * Validate token format
 */
export function validateToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Token should be at least 20 characters
  if (token.length < 20) {
    return false;
  }

  return true;
}
