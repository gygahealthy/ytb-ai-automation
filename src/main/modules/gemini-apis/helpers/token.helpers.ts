/**
 * Token Service
 * Handles token extraction from Gemini page
 * Shared by all modules that need API tokens
 */

import { config } from "../shared/config/index.js";
import { logger } from "../../../utils/logger-backend.js";
import { createHttpService } from "../services/http.service.js";
import type { CookieManagerDB } from "../services/cookie-manager-db.js";

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
    // Primary patterns for SNlM0e token
    /"SNlM0e":"(.*?)"/, // "SNlM0e":"token"
    /SNlM0e\s*:\s*"(.*?)"/, // SNlM0e : "token"
    /"SNlM0e"\s*,\s*"(.*?)"/, // "SNlM0e" , "token"
    /SNlM0e\\":\\"(.*?)\\"/, // Escaped version

    // Alternative patterns for different Google frontend versions
    /SNlM0e['"]\s*:\s*['"]([\w\-]+)['"]/, // SNlM0e' : 'token' or SNlM0e" : "token"
    /\['SNlM0e'\]\s*=\s*['"]([^'"]+)/, // ['SNlM0e'] = 'token'
    /\["SNlM0e"\]\s*=\s*["']([^"']+)/, // ["SNlM0e"] = "token"

    // Modern JS patterns (from webpack bundles)
    /[,:]SNlM0e[,:]"([^"]{60,}?)"/, // ,SNlM0e:"longtokenstring"
    /window\.SNlM0e\s*=\s*['"]([\w\-]+)['"]/, // window.SNlM0e = 'token'

    // Encoded/minified patterns
    /snlm0e["\']?\s*:\s*["\']?([a-zA-Z0-9\-_]{60,}?)["\']?[,\}]/i, // Case-insensitive minified
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const token = match[1].trim();
      // Validate token looks reasonable (should be 60+ chars typically)
      if (token.length > 10) {
        logger.debug(`✅ Token extracted with pattern: ${pattern.source}`);
        return token;
      }
    }
  }

  // FALLBACK: If standard patterns fail, search for any token-like string
  // that appears in the HTML. Google may have changed the structure entirely.
  logger.warn(
    "⚠️ Standard SNlM0e patterns failed, trying fallback extraction..."
  );

  // Search for strings that look like tokens (long alphanumeric sequences)
  const fallbackPattern = /["']([a-zA-Z0-9\-_]{80,300})["']/g;
  let match;
  const potentialTokens = [];

  while ((match = fallbackPattern.exec(html)) !== null) {
    const token = match[1];
    // Skip known non-token strings
    if (
      !token.includes("http") &&
      !token.includes("css") &&
      !token.includes("font") &&
      !token.includes("image") &&
      token.length > 60
    ) {
      potentialTokens.push(token);
    }
  }

  // Use the longest token found
  if (potentialTokens.length > 0) {
    const longestToken = potentialTokens.sort((a, b) => b.length - a.length)[0];
    logger.warn(
      `Found potential token via fallback (length: ${longestToken.length})`
    );
    return longestToken;
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
  logger.info("🔍 Extracting fresh token from Gemini page...");

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
        `Failed to fetch Gemini page: ${response.statusCode} ${response.statusMessage}`
      );
    }

    const html = response.body;

    // Clean up HTTP service
    await httpService.close();

    // Step 4: Extract token
    const snlm0e = extractSnlm0eToken(html);

    if (!snlm0e) {
      // Throw a detailed error if token extraction fails
      const errorDetails = {
        message: "SNlM0e token not found in HTML response.",
        htmlLength: html.length,
        htmlExcerpt: html.substring(0, 500), // First 500 chars
      };
      logger.error("❌ Token extraction failed.", errorDetails);

      // Try to find out why the page content might be wrong
      if (html.includes("accounts.google.com")) {
        logger.error(
          "Page content suggests a redirect to login page. Cookies might be invalid or expired."
        );
        throw new Error(
          "Token extraction failed: Redirected to login page. Cookies may be invalid."
        );
      }
      if (html.includes("consent.google.com")) {
        logger.error(
          "Page content suggests a cookie consent screen is blocking access."
        );
        throw new Error(
          "Token extraction failed: Blocked by cookie consent screen."
        );
      }
      if (html.length < 1000) {
        logger.error(
          "HTML content is unusually small, suggesting an error page or incomplete load."
        );
      }

      throw new Error(errorDetails.message);
    }

    logger.info(`✅ Fresh token extracted: ${snlm0e.substring(0, 40)}...`);

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
