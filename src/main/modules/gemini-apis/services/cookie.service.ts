import { CookieRepository } from "../repository/cookie.repository";
import { Cookie } from "../shared/types";
import { logger } from "../../../utils/logger-backend";
import { ApiResponse } from "../../../../shared/types";
import { database } from "../../../storage/database";
import { launchBrowser } from "../helpers/browser/browser-launcher.helpers";
import {
  navigateAndExtractCookies,
  logCookieExtractionSummary,
  toCookieString,
  logCookieExtractionSuccess,
} from "../helpers/cookie/cookie-extraction.helpers";
import { containsDtsCookie, hasCookieChanged } from "../helpers/cookie/cookie-check.helpers";

/**
 * Service for managing cookies
 * Handles business logic and validation
 */
export class CookieService {
  constructor(private cookieRepository: CookieRepository) {}

  /**
   * Extract cookies from browser using Puppeteer (gets HttpOnly cookies too)
   * Extracts ALL cookies from the loaded page, regardless of domain
   * @param profile - Profile with userDataDir containing browser cookies
   * @param targetUrl - URL to extract cookies for (e.g., "https://gemini.google.com")
   * @param _domainFilter - Domain to filter cookies by (e.g., "google.com", "gemini") - DEPRECATED, kept for compatibility, not used
   * @param headless - Whether to run in headless (background) mode or visible mode
   */
  async extractCookiesFromBrowser(
    profile: any,
    targetUrl: string = "https://gemini.google.com",
    _domainFilter: string = "google.com",
    headless: boolean = false
  ): Promise<ApiResponse<{ cookieString: string; cookies: any[] }>> {
    let browser: any = null;
    let page: any = null;
    let chromeProcess: any = null;

    try {
      if (!profile || !profile.userDataDir) {
        return {
          success: false,
          error: "Profile with userDataDir is required",
        };
      }

      logger.info("[cookie.service] Extracting ALL cookies from browser profile", {
        profileId: profile.id,
        userDataDir: profile.userDataDir,
        targetUrl,
        mode: headless ? "HEADLESS (background)" : "NON-HEADLESS (visible)",
        note: "Will extract ALL cookies from ALL domains on the page",
      });

      // Launch browser (headless or visible) with profile's user-data-dir
      try {
        logger.info("[cookie.service] Launching browser with profile user-data-dir", {
          userDataDir: profile.userDataDir,
          headless,
        });
        const launchResult = await launchBrowser(profile, headless);
        // launchBrowser now returns { browser, chromeProcess }
        browser = launchResult.browser;
        chromeProcess = (launchResult as any).chromeProcess || null;
      } catch (launchError) {
        logger.error("[cookie.service] Failed to launch browser", launchError);
        return {
          success: false,
          error: `Failed to launch browser: ${launchError instanceof Error ? launchError.message : String(launchError)}`,
        };
      }

      // Get or create page
      const pages = await browser.pages();
      page = pages.length > 0 ? pages[0] : await browser.newPage();

      // Navigate and extract ALL cookies (not filtered by domain)
      logger.info("[cookie.service] Extracting cookies with mode:", {
        headless,
        targetUrl,
      });
      let allCookies = await navigateAndExtractCookies(page, targetUrl, headless);

      // If running in visible (interactive) mode, wait for the DTS cookie
      // or until 30s of inactivity (no cookie changes). This prevents the
      // browser from being closed before the user finishes interactive login/2FA.
      if (!headless) {
        if (!containsDtsCookie(allCookies)) {
          logger.info("[cookie.service] DTS cookie not present yet. Waiting for interactive login/rotation...", {
            checkIntervalMs: 1000,
            inactivityThresholdMs: 30000,
          });

          const inactivityThresholdMs = 30000; // 30s
          const maxOverallWaitMs = 5 * 60 * 1000; // 5 minutes max as safety
          const checkIntervalMs = 1000;

          let lastCookies = allCookies;
          let lastChangeAt = Date.now();
          const startAt = Date.now();

          while (Date.now() - startAt < maxOverallWaitMs) {
            await new Promise((r) => setTimeout(r, checkIntervalMs));

            try {
              const currentCookies = await page.cookies();

              // If we now have DTS, break and use the new cookies
              if (containsDtsCookie(currentCookies)) {
                logger.info("[cookie.service] DTS cookie detected during wait", {
                  cookieNames: currentCookies.map((c: any) => c.name),
                });
                allCookies = currentCookies;
                break;
              }

              // Detect whether cookies changed
              const changed = hasCookieChanged(lastCookies, currentCookies);

              if (changed) {
                lastChangeAt = Date.now();
                lastCookies = currentCookies;
                logger.debug("[cookie.service] Cookie jar changed, continuing to wait...", {
                  cookieCount: currentCookies.length,
                });
              } else {
                // No change - check inactivity
                if (Date.now() - lastChangeAt >= inactivityThresholdMs) {
                  logger.info("[cookie.service] No cookie activity for 30s, proceeding with extraction.");
                  allCookies = currentCookies;
                  break;
                }
              }
            } catch (err) {
              logger.warn(
                "[cookie.service] Error while polling cookies during interactive wait",
                err instanceof Error ? err.message : String(err)
              );
            }
          }
        }
      }

      // Log extraction summary (shows ALL cookies from ALL domains)
      logCookieExtractionSummary(allCookies);

      // Convert ALL cookies to cookie string
      const cookieString = toCookieString(allCookies);

      // Log success
      logCookieExtractionSuccess(allCookies, cookieString);

      // Cleanup
      try {
        if (page) await page.close().catch(() => {});
      } catch (e) {}

      try {
        // Prefer closing the browser if close() exists
        if (browser && typeof browser.close === "function") {
          await browser.close().catch(() => {});
        } else if (browser && typeof browser.disconnect === "function") {
          await browser.disconnect().catch(() => {});
        }
      } catch (e) {}

      // Kill spawned chrome process if provided
      try {
        if (chromeProcess && typeof chromeProcess.kill === "function") {
          chromeProcess.kill();
        }
      } catch (e) {}

      return {
        success: true,
        data: {
          cookieString,
          cookies: allCookies,
        },
      };
    } catch (error) {
      logger.error("[cookie.service] Failed to extract cookies from browser", error);

      // Cleanup on error
      try {
        if (page) await page.close().catch(() => {});
      } catch (e) {}

      try {
        if (browser && typeof browser.close === "function") {
          await browser.close().catch(() => {});
        } else if (browser && typeof browser.disconnect === "function") {
          await browser.disconnect().catch(() => {});
        }
      } catch (e) {}

      try {
        if (chromeProcess && typeof chromeProcess.kill === "function") {
          chromeProcess.kill();
        }
      } catch (e) {}

      return {
        success: false,
        error: `Failed to extract cookies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Get all cookies for a profile
   */
  async getCookiesByProfile(profileId: string): Promise<ApiResponse<Cookie[]>> {
    try {
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }

      const cookies = await this.cookieRepository.findByProfileId(profileId);
      return { success: true, data: cookies };
    } catch (error) {
      logger.error("[cookie.service] Failed to get cookies by profile", error);
      return { success: false, error: "Failed to retrieve cookies" };
    }
  }

  /**
   * Get a specific cookie by profile and url
   */
  async getCookie(profileId: string, url: string): Promise<ApiResponse<Cookie | null>> {
    try {
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }
      if (!url || url.trim() === "") {
        return { success: false, error: "URL is required" };
      }

      const cookie = await this.cookieRepository.findByProfileAndUrl(profileId, url);
      return { success: true, data: cookie };
    } catch (error) {
      logger.error("[cookie.service] Failed to get cookie", error);
      return { success: false, error: "Failed to retrieve cookie" };
    }
  }

  /**
   * Create a new cookie
   */
  async createCookie(profileId: string, url: string, service: string, data: Partial<Cookie>): Promise<ApiResponse<Cookie>> {
    try {
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }
      if (!url || url.trim() === "") {
        return { success: false, error: "URL is required" };
      }
      if (!service || service.trim() === "") {
        return { success: false, error: "Service is required" };
      }

      // Check if cookie already exists
      const exists = await this.cookieRepository.existsByProfileAndUrl(profileId, url);
      if (exists) {
        return {
          success: false,
          error: "Cookie already exists for this profile and url",
        };
      }

      const { v4: uuidv4 } = await import("uuid");
      const now = new Date().toISOString();
      const cookie: Cookie = {
        id: uuidv4(),
        profileId,
        url,
        service,
        rawCookieString: data.rawCookieString,
        lastRotatedAt: data.lastRotatedAt,
        spidExpiration: data.spidExpiration,
        rotationData: data.rotationData,
        rotationIntervalMinutes: data.rotationIntervalMinutes ?? 1440, // Default 24 hours
        status: "active",
        launchWorkerOnStartup: data.launchWorkerOnStartup ?? 0,
        enabledRotationMethods: data.enabledRotationMethods ?? '["refreshCreds","rotateCookie"]',
        rotationMethodOrder: data.rotationMethodOrder ?? '["refreshCreds","rotateCookie","headless"]',
        createdAt: now,
        updatedAt: now,
      };

      await this.cookieRepository.insert(cookie);

      logger.info("[cookie.service] Created new cookie", {
        profileId,
        url,
        id: cookie.id,
      });

      return { success: true, data: cookie };
    } catch (error) {
      logger.error("[cookie.service] Failed to create cookie", error);
      return { success: false, error: "Failed to create cookie" };
    }
  }

  /**
   * Update cookie rotation interval
   */
  async updateRotationInterval(id: string, rotationIntervalMinutes: number): Promise<ApiResponse<void>> {
    try {
      if (!id || id.trim() === "") {
        return { success: false, error: "Cookie ID is required" };
      }
      if (rotationIntervalMinutes < 1) {
        return {
          success: false,
          error: "Rotation interval must be at least 1 minute",
        };
      }

      const exists = await this.cookieRepository.exists(id);
      if (!exists) {
        return { success: false, error: "Cookie not found" };
      }

      const now = new Date().toISOString();
      await this.cookieRepository.update(id, {
        rotationIntervalMinutes,
        updatedAt: now,
      } as Partial<Cookie>);

      logger.info("[cookie.service] Updated rotation interval", {
        id,
        rotationIntervalMinutes,
      });

      return { success: true };
    } catch (error) {
      logger.error("[cookie.service] Failed to update rotation interval", error);
      return { success: false, error: "Failed to update rotation interval" };
    }
  }

  /**
   * Update cookie with rotation data
   */
  async updateRotation(
    id: string,
    data: {
      lastRotatedAt: string;
      rawCookieString?: string;
      rotationData?: string;
      status?: "active" | "expired" | "renewal_failed";
    }
  ): Promise<ApiResponse<void>> {
    try {
      if (!id || id.trim() === "") {
        return { success: false, error: "Cookie ID is required" };
      }

      const exists = await this.cookieRepository.exists(id);
      if (!exists) {
        return { success: false, error: "Cookie not found" };
      }

      await this.cookieRepository.updateRotation(id, data);

      logger.info("[cookie.service] Updated cookie rotation", {
        id,
        status: data.status,
      });

      return { success: true };
    } catch (error) {
      logger.error("[cookie.service] Failed to update rotation", error);
      return { success: false, error: "Failed to update cookie rotation" };
    }
  }

  /**
   * Update cookie status
   */
  async updateStatus(id: string, status: "active" | "expired" | "renewal_failed"): Promise<ApiResponse<void>> {
    try {
      if (!id || id.trim() === "") {
        return { success: false, error: "Cookie ID is required" };
      }

      const exists = await this.cookieRepository.exists(id);
      if (!exists) {
        return { success: false, error: "Cookie not found" };
      }

      await this.cookieRepository.updateStatus(id, status);

      logger.info("[cookie.service] Updated cookie status", { id, status });

      return { success: true };
    } catch (error) {
      logger.error("[cookie.service] Failed to update cookie status", error);
      return { success: false, error: "Failed to update cookie status" };
    }
  }

  /**
   * Delete a cookie
   */
  async deleteCookie(id: string): Promise<ApiResponse<void>> {
    try {
      if (!id || id.trim() === "") {
        return { success: false, error: "Cookie ID is required" };
      }

      const exists = await this.cookieRepository.exists(id);
      if (!exists) {
        return { success: false, error: "Cookie not found" };
      }

      await this.cookieRepository.delete(id);

      logger.info("[cookie.service] Deleted cookie", { id });

      return { success: true };
    } catch (error) {
      logger.error("[cookie.service] Failed to delete cookie", error);
      return { success: false, error: "Failed to delete cookie" };
    }
  }

  /**
   * Delete all cookies for a profile
   */
  async deleteProfileCookies(profileId: string): Promise<ApiResponse<void>> {
    try {
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }

      await this.cookieRepository.deleteByProfileId(profileId);

      logger.info("[cookie.service] Deleted all cookies for profile", {
        profileId,
      });

      return { success: true };
    } catch (error) {
      logger.error("[cookie.service] Failed to delete profile cookies", error);
      return { success: false, error: "Failed to delete profile cookies" };
    }
  }

  /**
   * Get cookies due for rotation
   */
  async getCookiesDueForRotation(): Promise<ApiResponse<Cookie[]>> {
    try {
      const cookies = await this.cookieRepository.findCookiesDueForRotation();
      return { success: true, data: cookies };
    } catch (error) {
      logger.error("[cookie.service] Failed to get cookies due for rotation", error);
      return {
        success: false,
        error: "Failed to retrieve cookies due for rotation",
      };
    }
  }

  /**
   * Get cookies by status
   */
  async getCookiesByStatus(status: "active" | "expired" | "renewal_failed"): Promise<ApiResponse<Cookie[]>> {
    try {
      const cookies = await this.cookieRepository.findByStatus(status);
      return { success: true, data: cookies };
    } catch (error) {
      logger.error("[cookie.service] Failed to get cookies by status", error);
      return { success: false, error: "Failed to retrieve cookies by status" };
    }
  }

  /**
   * Extract cookies from a Puppeteer page and store them in the database
   * ✅ STORES ALL COOKIES FROM THE PAGE - NO DOMAIN FILTERING
   * This ensures we capture all cookies from all domains on the loaded page
   * @param profileId - The profile ID to associate with the cookies
   * @param _url - Deprecated: previously used for domain filtering, now kept for backward compatibility
   * @param service - The service name (e.g., "gemini")
   * @param pageUrl - The page URL used for cookie extraction (for reference)
   * @param cookies - Array of Puppeteer cookies from the page (ALL DOMAINS)
   * @returns ApiResponse with the created Cookie entity
   */
  async extractAndStoreCookiesFromPage(
    profileId: string,
    _url: string,  
    service: string,
    pageUrl: string,
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      expires?: number;
    }>
  ): Promise<ApiResponse<Cookie>> {
    try {
      // Validate inputs
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }
      if (!service || service.trim() === "") {
        return { success: false, error: "Service is required" };
      }
      if (!pageUrl || pageUrl.trim() === "") {
        return { success: false, error: "Page URL is required" };
      }
      if (!Array.isArray(cookies) || cookies.length === 0) {
        return { success: false, error: "No cookies provided" };
      }

      // Get unique domains from cookies
      const domains = [...new Set(cookies.map((c) => c.domain))];

      logger.info("[cookie.service] Storing ALL cookies from page (all domains)", {
        profileId,
        pageUrl,
        totalCookies: cookies.length,
        domains: domains,
        domainCount: domains.length,
      });

      // ✅ Store ALL cookies without any filtering - convert to cookie string
      // Format: "name=value; name2=value2"
      const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

      logger.info("[cookie.service] Extracted cookie string from ALL domains", {
        profileId,
        cookieCount: cookies.length,
        cookieStringLength: cookieString.length,
        cookieNames: cookies.map((c) => c.name).join(", "),
        cookiesByDomain: domains.map((domain) => ({
          domain,
          count: cookies.filter((c) => c.domain === domain).length,
        })),
      });

      // Find the earliest expiry date among the cookies
      const expiryDates = cookies.filter((c) => c.expires && c.expires > 0).map((c) => c.expires! * 1000);

      const earliestExpiry = expiryDates.length > 0 ? new Date(Math.min(...expiryDates)) : undefined;

      // Check if a cookie already exists for this profile and pageUrl (full URL)
      const existingCookie = await this.cookieRepository.findByProfileAndUrl(profileId, pageUrl);

      const now = new Date().toISOString();

      if (existingCookie) {
        // ✅ UPDATE existing cookie using ID
        const updates: Partial<Cookie> = {
          rawCookieString: cookieString,
          spidExpiration: earliestExpiry?.toISOString(),
          status: "active",
          updatedAt: now,
        };

        await this.cookieRepository.update(existingCookie.id, updates);

        logger.info("[cookie.service] Updated existing cookie with ALL cookies from page", {
          cookieId: existingCookie.id,
          cookieCount: cookies.length,
          domains: domains,
        });

        return {
          success: true,
          data: {
            ...existingCookie,
            ...updates,
          },
        };
      } else {
        // ✅ CREATE new cookie
        const { v4: uuidv4 } = await import("uuid");
        const newCookie: Cookie = {
          id: uuidv4(),
          profileId: profileId, // Ensure profileId is explicitly set
          url: pageUrl, // Store full page URL
          service: service, // Ensure service is explicitly set
          rawCookieString: cookieString,
          spidExpiration: earliestExpiry?.toISOString(),
          rotationIntervalMinutes: 1440, // Default 24 hours
          status: "active",
          launchWorkerOnStartup: 0,
          enabledRotationMethods: '["refreshCreds","rotateCookie"]',
          rotationMethodOrder: '["refreshCreds","rotateCookie","headless"]',
          createdAt: now,
          updatedAt: now,
        };

        logger.info("[cookie.service] Creating new cookie with ALL cookies from page", {
          cookieId: newCookie.id,
          profileId: newCookie.profileId,
          service: newCookie.service,
          pageUrl: newCookie.url,
          cookieCount: cookies.length,
          domains: domains,
        });

        await this.cookieRepository.insert(newCookie);

        logger.info("[cookie.service] Created new cookie from page extraction (ALL domains)", {
          cookieId: newCookie.id,
          profileId,
          pageUrl,
          cookieCount: cookies.length,
          domains: domains,
        });

        return { success: true, data: newCookie };
      }
    } catch (error) {
      logger.error("[cookie.service] Failed to extract and store cookies from page", error);
      return {
        success: false,
        error: "Failed to extract and store cookies from page",
      };
    }
  }
}

/**
 * Create and export singleton instance
 */
let cookieServiceInstance: CookieService | null = null;

export function getCookieService(): CookieService {
  if (!cookieServiceInstance) {
    // Import here to avoid circular dependencies
    const db = database.getSQLiteDatabase();
    const cookieRepository = new CookieRepository(db);
    cookieServiceInstance = new CookieService(cookieRepository);
  }
  return cookieServiceInstance;
}

// Export default singleton
export const cookieService = getCookieService();
