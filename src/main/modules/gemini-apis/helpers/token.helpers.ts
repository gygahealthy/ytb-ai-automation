/**
 * Token Service
 * Handles token extraction from Gemini page
 * Shared by all modules that need API tokens
 */

import { config } from "../shared/config/index.js";
import { logger } from "../../../utils/logger-backend.js";
import type { CookieManagerDB } from "../services/cookie-manager-db.js";
import { createHttpService } from "../services/http.service.js";
import type { Cookie } from "../shared/types/index.js";

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
 * Checks database for cached token first, fetches fresh if needed
 * @param cookieManager - Database-integrated cookie manager instance
 * @param cookieEntity - Optional: Cookie entity from database to check for cached token
 * @returns Token data
 */
export async function extractTokens(
  cookieManager: CookieManagerDB,
  cookieEntity?: Cookie
): Promise<TokenData> {
  logger.info("🔍 Extracting tokens from Gemini page...");

  // Step 1: Check if we have a cached token in the database
  if (cookieEntity?.geminiToken) {
    logger.info(
      "📦 Found cached geminiToken in database, attempting to use it..."
    );
    logger.debug(
      `Cached token: ${cookieEntity.geminiToken.substring(0, 40)}...`
    );

    return {
      snlm0e: cookieEntity.geminiToken,
      timestamp: Date.now(),
    };
  }

  logger.info(
    "⬇️ No cached token found, fetching fresh token from Gemini page..."
  );

  // Step 2: Validate cookies before fetching
  const validation = cookieManager.validate();
  if (!validation.valid) {
    const cookies = cookieManager.getCookies();
    logger.error("❌ Cookie validation failed", {
      validationError: validation.error,
      parsedCookies: {
        __Secure_1PSID: cookies["__Secure-1PSID"] ? "✅ present" : "❌ MISSING",
        __Secure_1PSIDTS: cookies["__Secure-1PSIDTS"]
          ? "✅ present"
          : "❌ MISSING",
      },
      totalCookies: Object.keys(cookies).length,
      cookieNames: Object.keys(cookies),
    });
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
    // Step 3: Fetch Gemini page using HTTP/2 service
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

    // Step 4: Extract token
    const snlm0e = extractSnlm0eToken(html);

    if (!snlm0e) {
      logger.error("Failed to extract SNlM0e token from HTML");
      logger.debug(
        `HTML length: ${html.length}, first 500 chars: ${html.substring(
          0,
          500
        )}`
      );

      // Provide user-friendly error with recovery instructions
      throw new Error(
        "Failed to extract Gemini token from page. This usually means your authentication cookies have expired or are invalid.\n\n" +
          "Please:\n" +
          "1. Go to the 'Profiles' tab\n" +
          "2. Select your profile and click 'Extract Cookies' button\n" +
          "3. Log into Gemini if prompted\n" +
          "4. Once cookies are extracted, try sending your message again\n\n" +
          "If this persists, your browser session may need to be refreshed. Try logging out and back into Gemini in your browser."
      );
    }

    logger.info(`✅ Fresh token extracted: ${snlm0e.substring(0, 40)}...`);

    // Step 5: Update database with new token if cookieEntity provided
    if (cookieEntity) {
      try {
        logger.info("💾 Updating database with new token...");
        // This will be done by the caller using cookieService.updateRotation()
        // We just return the token and let the caller handle storage
      } catch (updateError) {
        logger.warn(
          "Failed to update token in database, but returning token anyway",
          updateError
        );
      }
    }

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
