/**
 * Cookie Extraction Service
 * Handles browser-based cookie extraction with validation support
 *
 * This service separates cookie extraction concerns from CookieService,
 * providing reusable, testable extraction logic for any service/page.
 */

import { logger } from "../../../../utils/logger-backend.js";
import { ApiResponse } from "../../../../../shared/types/index.js";
import { launchBrowser } from "../../../gemini-apis/helpers/browser/browser-launcher.helpers.js";
import {
  navigateAndExtractCookies,
  toCookieString,
  logCookieExtractionSummary,
  logCookieExtractionSuccess,
} from "../helpers/cookie-extraction.helpers.js";
import { containsDtsCookie, hasCookieChanged } from "../helpers/cookie-check.helpers.js";
import type { ExtractOptions, ExtractResult, CookieValidation, CookiesForDb } from "../types/extraction.types.js";

/**
 * Service for extracting cookies from browsers using Puppeteer
 * Supports both headless and visible (interactive) extraction modes
 */
export class CookieExtractionService {
  /**
   * Extract cookies from browser using a profile's user-data-dir
   *
   * @param profile - Profile object with userDataDir
   * @param options - Extraction options
   * @returns ApiResponse with extraction results and validation
   */
  async extractCookiesFromBrowser(profile: any, options: ExtractOptions = {}): Promise<ApiResponse<ExtractResult>> {
    const {
      targetUrl = "https://gemini.google.com",
      headless = false,
      requiredCookies = [],
      maxWaitMs = 5 * 60 * 1000, // 5 minutes
      inactivityThresholdMs = 30000, // 30 seconds
    } = options;

    let browser: any = null;
    let page: any = null;
    let chromeProcess: any = null;

    try {
      // Validate profile
      if (!profile || !profile.userDataDir) {
        return {
          success: false,
          error: "Profile with userDataDir is required",
        };
      }

      logger.info("[CookieExtractionService] Starting cookie extraction", {
        profileId: profile.id,
        userDataDir: profile.userDataDir,
        targetUrl,
        mode: headless ? "HEADLESS (background)" : "NON-HEADLESS (visible)",
        requiredCookies,
      });

      // Launch browser
      try {
        const launchResult = await launchBrowser(profile, headless);
        browser = launchResult.browser;
        chromeProcess = (launchResult as any).chromeProcess || null;

        logger.info("[CookieExtractionService] Browser launched successfully", {
          headless,
        });
      } catch (launchError) {
        logger.error("[CookieExtractionService] Failed to launch browser", launchError);
        return {
          success: false,
          error: `Failed to launch browser: ${launchError instanceof Error ? launchError.message : String(launchError)}`,
        };
      }

      // Get or create page
      const pages = await browser.pages();
      page = pages.length > 0 ? pages[0] : await browser.newPage();

      // Navigate and extract cookies using helpers
      logger.info("[CookieExtractionService] Navigating and extracting cookies", {
        headless,
        targetUrl,
        requiredCookies,
      });

      let allCookies = await navigateAndExtractCookies(page, targetUrl, headless, requiredCookies);

      // Non-headless mode: wait for interactive login if needed
      if (!headless) {
        allCookies = await this.handleInteractiveExtraction(page, allCookies, maxWaitMs, inactivityThresholdMs);
      }

      // Log extraction summary
      logCookieExtractionSummary(allCookies);

      // Convert to cookie string
      const cookieString = toCookieString(allCookies);

      // Calculate earliest expiry
      const earliestExpiry = this.calculateEarliestExpiry(allCookies);

      // Extract unique domains
      const domains = this.extractUniqueDomains(allCookies);

      // Validate against required cookies
      const validation = this.validateCookies(allCookies, requiredCookies);

      // Log validation result
      if (validation.valid) {
        logger.info("[CookieExtractionService] ✅ Validation passed", {
          cookieCount: allCookies.length,
          requiredCookies,
        });
      } else {
        logger.warn("[CookieExtractionService] ⚠️  Validation failed", {
          missing: validation.missing,
          requiredCookies,
        });
      }

      // Log success
      logCookieExtractionSuccess(allCookies, cookieString);

      // Build result
      const result: ExtractResult = {
        cookieString,
        cookies: allCookies,
        validation,
        earliestExpiry,
        domains,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error("[CookieExtractionService] Failed to extract cookies", error);
      return {
        success: false,
        error: `Failed to extract cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      // Robust cleanup
      await this.cleanup(page, browser, chromeProcess);
    }
  }

  /**
   * Convert raw Puppeteer cookies to database-friendly format
   *
   * @param cookies - Array of Puppeteer cookie objects
   * @returns Formatted data for database storage
   */
  convertCookiesForDb(cookies: any[]): CookiesForDb {
    return {
      cookieString: toCookieString(cookies),
      earliestExpiry: this.calculateEarliestExpiry(cookies),
      domains: this.extractUniqueDomains(cookies),
    };
  }

  /**
   * Validate cookies against required cookie names
   *
   * @param cookies - Array of cookie objects with `name` property
   * @param requiredCookies - Array of required cookie names
   * @returns Validation result with missing cookies
   */
  validateCookies(cookies: Array<{ name: string; value?: string }>, requiredCookies?: string[]): CookieValidation {
    // If no required cookies specified, always valid
    if (!requiredCookies || requiredCookies.length === 0) {
      return { valid: true, missing: [] };
    }

    const cookieNames = new Set(cookies.map((c) => c.name));
    const missing = requiredCookies.filter((name) => !cookieNames.has(name));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Handle interactive extraction in non-headless mode
   * Waits for user to complete login/2FA or for inactivity threshold
   *
   * @private
   */
  private async handleInteractiveExtraction(
    page: any,
    initialCookies: any[],
    maxWaitMs: number,
    inactivityThresholdMs: number
  ): Promise<any[]> {
    // If we already have DTS cookie, no need to wait
    if (containsDtsCookie(initialCookies)) {
      logger.info("[CookieExtractionService] DTS cookie already present, skipping wait");
      return initialCookies;
    }

    logger.info("[CookieExtractionService] DTS cookie not present, waiting for interactive login", {
      maxWaitMs,
      inactivityThresholdMs,
    });

    let lastCookies = initialCookies;
    let lastChangeAt = Date.now();
    const startAt = Date.now();
    const checkIntervalMs = 1000; // Check every second

    while (Date.now() - startAt < maxWaitMs) {
      await new Promise((r) => setTimeout(r, checkIntervalMs));

      try {
        const currentCookies = await page.cookies();

        // If we now have DTS, break and use the new cookies
        if (containsDtsCookie(currentCookies)) {
          logger.info("[CookieExtractionService] ✅ DTS cookie detected during wait", {
            cookieNames: currentCookies.map((c: any) => c.name),
          });
          return currentCookies;
        }

        // Detect whether cookies changed
        const changed = hasCookieChanged(lastCookies, currentCookies);

        if (changed) {
          lastChangeAt = Date.now();
          lastCookies = currentCookies;
          logger.debug("[CookieExtractionService] Cookie jar changed, continuing to wait", {
            cookieCount: currentCookies.length,
          });
        } else {
          // No change - check inactivity
          if (Date.now() - lastChangeAt >= inactivityThresholdMs) {
            logger.info("[CookieExtractionService] No cookie activity for threshold duration, proceeding", {
              inactivityThresholdMs,
            });
            return currentCookies;
          }
        }
      } catch (err) {
        logger.warn(
          "[CookieExtractionService] Error polling cookies during interactive wait",
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    // Timeout reached
    logger.warn("[CookieExtractionService] ⚠️  Max wait time reached, proceeding with available cookies", {
      maxWaitMs,
    });
    return lastCookies;
  }

  /**
   * Calculate earliest expiry date from cookies
   *
   * @private
   */
  private calculateEarliestExpiry(cookies: any[]): string | undefined {
    const expiryDates = cookies.filter((c) => c.expires && c.expires > 0).map((c) => c.expires! * 1000); // Convert to milliseconds

    if (expiryDates.length === 0) {
      return undefined;
    }

    const earliest = Math.min(...expiryDates);
    return new Date(earliest).toISOString();
  }

  /**
   * Extract unique domains from cookies
   *
   * @private
   */
  private extractUniqueDomains(cookies: any[]): string[] {
    const domains = new Set(cookies.map((c) => c.domain));
    return Array.from(domains);
  }

  /**
   * Cleanup browser resources
   *
   * @private
   */
  private async cleanup(page: any, browser: any, chromeProcess: any): Promise<void> {
    // Close page
    try {
      if (page) await page.close().catch(() => {});
    } catch (e) {
      logger.debug("[CookieExtractionService] Error closing page (ignored)", e);
    }

    // Close or disconnect browser
    try {
      if (browser && typeof browser.close === "function") {
        await browser.close().catch(() => {});
      } else if (browser && typeof browser.disconnect === "function") {
        await browser.disconnect().catch(() => {});
      }
    } catch (e) {
      logger.debug("[CookieExtractionService] Error closing browser (ignored)", e);
    }

    // Kill spawned chrome process
    try {
      if (chromeProcess && typeof chromeProcess.kill === "function") {
        chromeProcess.kill();
      }
    } catch (e) {
      logger.debug("[CookieExtractionService] Error killing chrome process (ignored)", e);
    }
  }
}

/**
 * Singleton instance
 */
let cookieExtractionServiceInstance: CookieExtractionService | null = null;

export function getCookieExtractionService(): CookieExtractionService {
  if (!cookieExtractionServiceInstance) {
    cookieExtractionServiceInstance = new CookieExtractionService();
  }
  return cookieExtractionServiceInstance;
}

// Export default singleton
export const cookieExtractionService = getCookieExtractionService();
