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
 * Checks database for cached token first, fetches fresh if needed
 * @param cookieManager - Database-integrated cookie manager instance
 * @param cookieEntity - Optional: Cookie entity from database to check for cached token
 * @param forceRefresh - If true, skip cache and always fetch fresh token from page
 * @returns Token data
 */
export async function extractTokens(
  cookieManager: CookieManagerDB,
  cookieEntity?: Cookie,
  forceRefresh: boolean = false
): Promise<TokenData> {
  logger.info("🔍 Extracting tokens from Gemini page...");

  // Step 1: Check if we have a cached token in the database (unless force refresh)
  if (!forceRefresh && cookieEntity?.geminiToken) {
    // Validate the cached token
    if (validateToken(cookieEntity.geminiToken)) {
      logger.info(
        "✅ Using cached geminiToken from database (gemini_token field)"
      );
      logger.debug(
        `Cached token: ${cookieEntity.geminiToken.substring(0, 40)}...`
      );

      return {
        snlm0e: cookieEntity.geminiToken,
        timestamp: Date.now(),
      };
    } else {
      logger.warn(
        "⚠️ Cached token in database is invalid, fetching fresh token..."
      );
    }
  } else if (forceRefresh) {
    logger.info(
      "🔄 Force refresh requested - bypassing cache, fetching fresh token from page..."
    );
  } else {
    logger.info(
      "⬇️ No cached token found in database (gemini_token is null), fetching fresh token..."
    );
  }

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

      // Debug: Try to understand why the token isn't found
      logger.warn("🔍 Debugging token extraction failure...");

      // Write the HTML to a debug file for analysis
      try {
        const fs = await import("fs").then((m) => m.promises);
        const path = await import("path");
        const debugDir = path.join(process.cwd(), ".debug");

        // Ensure debug directory exists
        await fs.mkdir(debugDir, { recursive: true });

        // Save the HTML response for manual inspection
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const debugFile = path.join(debugDir, `gemini-html-${timestamp}.txt`);
        await fs.writeFile(debugFile, html, "utf-8");

        logger.warn(`📄 HTML response saved to: ${debugFile}`);
        logger.warn(`📝 File size: ${html.length} bytes`);
      } catch (writeError) {
        logger.warn(
          `⚠️ Failed to save debug HTML: ${
            writeError instanceof Error ? writeError.message : "Unknown error"
          }`
        );
      }

      // Check for various patterns to diagnose
      const patterns = {
        hasSnlm0eQuote: html.includes('"SNlM0e"'),
        hasSnlm0eSingleQuote: html.includes("'SNlM0e'"),
        hasSnlm0eNoQuote: html.includes("SNlM0e"),
        count_SNlM0e: (html.match(/SNlM0e/g) || []).length,
        count_snlm0e: (html.match(/snlm0e/gi) || []).length,
      };

      logger.debug(`Pattern checks: ${JSON.stringify(patterns)}`);

      // Try to find what long tokens ARE in the HTML
      const longStrings = html.match(/["'][a-zA-Z0-9\-_]{40,}/g) || [];
      logger.debug(`Found ${longStrings.length} long strings in HTML`);
      if (longStrings.length > 0) {
        logger.debug(
          `Sample long strings: ${longStrings.slice(0, 3).join(", ")}`
        );
      }

      // Check for specific script patterns
      const scriptMatches =
        html.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
      logger.debug(`Found ${scriptMatches.length} script tags`);

      // Look for any "SNlM0e" in ANY context
      const snlm0eMatches =
        html.match(/SNlM0e[^,}\]]*["':[a-zA-Z0-9\-_]{20,}['"]/g) || [];
      if (snlm0eMatches.length > 0) {
        logger.warn(`❗ Found SNlM0e in these contexts:`);
        snlm0eMatches.slice(0, 3).forEach((match) => {
          logger.debug(`  → ${match.substring(0, 100)}`);
        });
      } else {
        logger.error(`❌ SNlM0e not found in ANY context in the HTML`);
      }

      // Provide user-friendly error with clear recovery instructions
      throw new Error(
        "Failed to extract Gemini token - your session may need refresh.\n\n" +
          "This happens when Google's session expires. Please:\n" +
          "1. Go to the 'Profiles' tab\n" +
          "2. Click 'Extract Cookies' button\n" +
          "3. A browser window will open - log in if needed\n" +
          "4. Once extracted, try sending your message again\n\n" +
          "If you're already logged in, try logging out and back in on that page."
      );
    }

    logger.info(`✅ Fresh token extracted: ${snlm0e.substring(0, 40)}...`);

    // NOTE: Token will be persisted to database by the HttpService.getToken() method
    // We just return it here and let the caller handle the storage
    logger.debug(
      "Token extracted successfully, caller will persist to database"
    );

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
