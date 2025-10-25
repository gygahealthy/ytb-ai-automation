/**
 * Cookie Extraction Helper Functions
 * Handles page navigation and cookie extraction logic
 */

import { logger } from "../../../../utils/logger-backend";

/**
 * Navigate page to target URL in non-headless mode
 * Non-headless assumes user might need to log in manually
 * The browser window will be VISIBLE so the user can interact with it
 * @param page - Puppeteer page instance
 * @param targetUrl - Target URL to navigate to
 * @returns Array of ALL cookies from the page (not filtered by domain)
 */
export async function extractCookiesNonHeadless(
  page: any,
  targetUrl: string
): Promise<any[]> {
  logger.info(
    "[cookie-extraction] NON-HEADLESS mode: Opening visible browser window"
  );
  logger.info(
    "[cookie-extraction] 🌐 The browser window will appear on your screen - you can interact with it"
  );

  try {
    logger.info("[cookie-extraction] Navigating to target URL", { targetUrl });

    await page.goto(targetUrl, {
      waitUntil: "load", // Just wait for page load, not networkidle
      timeout: 30000,
    });

    logger.info(
      "[cookie-extraction] ✅ Target URL loaded in visible browser window"
    );

    // Wait for page to settle
    logger.info(
      "[cookie-extraction] Waiting for page to settle... (3 seconds)"
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Extract ALL cookies from the page (no domain filtering)
    const initialCookies = await page.cookies();
    const hasSecurePSID = initialCookies.some(
      (c: any) => c.name === "__Secure-1PSID" && c.value
    );

    logger.info("[cookie-extraction] Initial cookie check", {
      totalCookies: initialCookies.length,
      hasSecurePSID,
      cookieNames: initialCookies.map((c: any) => c.name),
      domains: [...new Set(initialCookies.map((c: any) => c.domain))],
    });

    // If auth cookies are already present, we're done
    if (hasSecurePSID) {
      logger.info(
        "[cookie-extraction] ✅ Auth cookies found in profile! Extracting ALL cookies..."
      );
      logger.info("[cookie-extraction] Extracted cookies from domains:", {
        domains: [...new Set(initialCookies.map((c: any) => c.domain))],
      });
      return initialCookies;
    }

    // If not, the user might need to log in
    logger.info(
      "[cookie-extraction] ⚠️  No auth cookies found yet. The browser is visible - please log in if needed."
    );
    logger.info(
      "[cookie-extraction] 👤 Waiting up to 5 minutes for user to authenticate..."
    );

    // Poll for secure cookies every 2 seconds, timeout after 5 minutes
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();
    let foundAuth = false;

    while (Date.now() - startTime < maxWaitTime) {
      const currentCookies = await page.cookies();
      const hasSecure = currentCookies.some(
        (c: any) => c.name === "__Secure-1PSID" && c.value
      );

      if (hasSecure) {
        logger.info(
          "[cookie-extraction] ✅ Authentication detected! User logged in successfully."
        );
        logger.info(
          "[cookie-extraction] Extracting ALL cookies from all domains..."
        );
        logger.info("[cookie-extraction] Extracted cookies from domains:", {
          domains: [...new Set(currentCookies.map((c: any) => c.domain))],
        });
        foundAuth = true;
        return currentCookies;
      }

      logger.debug(
        "[cookie-extraction] Still waiting for authentication... (polling)"
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    if (!foundAuth) {
      logger.warn(
        "[cookie-extraction] ⚠️  Authentication timeout after 5 minutes. Extracting available cookies anyway."
      );
    }

    // Return ALL cookies that are available (no domain filtering)
    const finalCookies = await page.cookies();
    logger.info(
      "[cookie-extraction] Extracting ALL cookies from all domains:",
      {
        totalCookies: finalCookies.length,
        domains: [...new Set(finalCookies.map((c: any) => c.domain))],
      }
    );
    return finalCookies;
  } catch (gotoError) {
    logger.warn(
      "[cookie-extraction] Error navigating to target URL in non-headless mode",
      gotoError
    );
    // Continue anyway - extract whatever cookies are available
    const cookies = await page.cookies();
    logger.info(
      "[cookie-extraction] Extracting ALL available cookies after error:",
      {
        totalCookies: cookies.length,
        domains: [...new Set(cookies.map((c: any) => c.domain))],
      }
    );
    return cookies;
  }
}

/**
 * Navigate page to target URL in headless mode
 * Headless mode uses spawned Chrome with profile's user-data-dir
 * This gives access to the profile's stored authentication cookies
 * Browser runs in background - no visible window
 * @param page - Puppeteer page instance
 * @param targetUrl - Target URL to navigate to
 * @returns Array of ALL cookies from the page (not filtered by domain)
 */
export async function extractCookiesHeadless(
  page: any,
  targetUrl: string
): Promise<any[]> {
  logger.info(
    "[cookie-extraction] HEADLESS mode: Running in background (no visible window)"
  );
  logger.info(
    "[cookie-extraction] Loading profile cookies from user-data-dir..."
  );

  // Navigate to base URL first to load cookies from profile
  const baseUrl = "https://gemini.google.com";
  logger.info("[cookie-extraction] Step 1: Navigating to base URL", {
    baseUrl,
  });

  try {
    await page.goto(baseUrl, {
      waitUntil: "load",
      timeout: 30000,
    });

    logger.info(
      "[cookie-extraction] Base URL loaded, cookies should be loaded from profile"
    );

    // Wait for cookies to be loaded from profile
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Extract ALL cookies (no domain filtering)
    let cookies = await page.cookies();
    const hasSecurePSID = cookies.some(
      (c: any) => c.name === "__Secure-1PSID" && c.value
    );

    logger.info(
      "[cookie-extraction] Checking for auth cookies after base URL",
      {
        totalCookies: cookies.length,
        hasSecurePSID,
        cookieNames: cookies.map((c: any) => c.name),
        domains: [...new Set(cookies.map((c: any) => c.domain))],
      }
    );

    // If we have auth cookies, the profile is logged in
    if (hasSecurePSID) {
      logger.info(
        "[cookie-extraction] ✅ Auth cookies loaded from profile! User is logged in."
      );
      // Navigate to app URL to get any app-specific cookies
      logger.info("[cookie-extraction] Step 2: Navigating to app URL", {
        targetUrl,
      });
      await page.goto(targetUrl, {
        waitUntil: "load",
        timeout: 30000,
      });

      logger.info("[cookie-extraction] App URL loaded");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract ALL cookies from all domains
      cookies = await page.cookies();

      logger.info(
        "[cookie-extraction] Retrieved ALL cookies after full navigation",
        {
          totalCookies: cookies.length,
          cookieNames: cookies.map((c: any) => c.name),
          domains: [...new Set(cookies.map((c: any) => c.domain))],
        }
      );

      return cookies;
    } else {
      logger.warn(
        "[cookie-extraction] ⚠️  No auth cookies in profile. Profile may not be logged in."
      );
      logger.info(
        "[cookie-extraction] Extracting ALL available cookies from profile anyway"
      );
      logger.info("[cookie-extraction] Cookies from domains:", {
        domains: [...new Set(cookies.map((c: any) => c.domain))],
      });
      return cookies;
    }
  } catch (headlessNavError) {
    logger.warn(
      "[cookie-extraction] Navigation error in headless mode (continuing anyway)",
      headlessNavError
    );
    const cookies = await page.cookies();
    logger.info(
      "[cookie-extraction] Extracting ALL available cookies after error:",
      {
        totalCookies: cookies.length,
        domains: [...new Set(cookies.map((c: any) => c.domain))],
      }
    );
    return cookies;
  }
}

/**
 * Extract cookies from page based on headless mode
 * Handles both visible (non-headless) and background (headless) scenarios
 * @param page - Puppeteer page instance
 * @param targetUrl - Target URL to navigate to
 * @param headless - Whether running in headless mode
 * @returns Array of cookies extracted from page
 */
export async function navigateAndExtractCookies(
  page: any,
  targetUrl: string,
  headless: boolean = false
): Promise<any[]> {
  logger.info("[cookie-extraction] Starting cookie extraction", {
    targetUrl,
    headless,
  });

  try {
    if (!headless) {
      return await extractCookiesNonHeadless(page, targetUrl);
    } else {
      return await extractCookiesHeadless(page, targetUrl);
    }
  } catch (navError) {
    logger.warn(
      "[cookie-extraction] Unexpected error during navigation",
      navError
    );
    // Continue anyway - we still want to extract whatever cookies are available
    return await page.cookies();
  }
}

/**
 * Log cookie extraction summary
 * Shows details about ALL extracted cookies from all domains
 * @param allCookies - Array of extracted cookies
 */
export function logCookieExtractionSummary(allCookies: any[]): void {
  const hasSecurePSID = allCookies.some(
    (c: any) => c.name === "__Secure-1PSID"
  );
  const hasSecurePSIDTS = allCookies.some(
    (c: any) => c.name === "__Secure-1PSIDTS"
  );

  // Get unique domains
  const domains = [...new Set(allCookies.map((c: any) => c.domain))];

  logger.info(
    "[cookie-extraction] Retrieved ALL cookies from browser (all domains)",
    {
      totalCookies: allCookies.length,
      domains: domains,
      domainCount: domains.length,
      cookieNames: allCookies.map((c: any) => c.name),
      hasSecurePSID,
      hasSecurePSIDTS,
      message: !hasSecurePSID
        ? "⚠️  No __Secure-1PSID found - user may not be logged into Gemini in this profile"
        : "✅ Secure authentication cookies found",
    }
  );

  // Log cookies grouped by domain for better visibility
  logger.info("[cookie-extraction] Cookies grouped by domain:", {
    cookiesByDomain: domains.map((domain) => ({
      domain,
      count: allCookies.filter((c: any) => c.domain === domain).length,
      cookies: allCookies
        .filter((c: any) => c.domain === domain)
        .map((c: any) => c.name),
    })),
  });
}

/**
 * Convert cookie array to cookie string format
 * @param cookies - Array of Puppeteer cookies
 * @returns Cookie string in "name=value; name2=value2" format
 */
export function toCookieString(cookies: any[]): string {
  return cookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Log successful cookie extraction
 * @param cookies - Array of extracted cookies
 * @param cookieString - Formatted cookie string
 */
export function logCookieExtractionSuccess(
  cookies: any[],
  cookieString: string
): void {
  logger.info("[cookie-extraction] Successfully extracted all cookies", {
    cookieCount: cookies.length,
    cookieStringLength: cookieString.length,
    hasHttpOnlyCookies: cookies.some((c: any) => c.httpOnly),
  });
}
