import { CookieRepository } from "../repository/cookie.repository";
import { Cookie } from "../shared/types";
import { logger } from "../../../utils/logger-backend";
import { ApiResponse } from "../../../../shared/types";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * Service for managing cookies
 * Handles business logic and validation
 */
export class CookieService {
  constructor(private cookieRepository: CookieRepository) {}

  /**
   * Extract cookies from browser using Puppeteer (gets HttpOnly cookies too)
   * @param profile - Profile with userDataDir containing browser cookies
   * @param targetUrl - URL to extract cookies for (e.g., "https://gemini.google.com")
   * @param domainFilter - Domain to filter cookies by (e.g., "google.com", "gemini")
   */
  async extractCookiesFromBrowser(
    profile: any,
    targetUrl: string = "https://gemini.google.com",
    domainFilter: string = "google.com"
  ): Promise<ApiResponse<{ cookieString: string; cookies: any[] }>> {
    let browser: any = null;
    let page: any = null;

    try {
      if (!profile || !profile.userDataDir) {
        return {
          success: false,
          error: "Profile with userDataDir is required",
        };
      }

      logger.info("[cookie.service] Extracting cookies from browser profile", {
        profileId: profile.id,
        userDataDir: profile.userDataDir,
        targetUrl,
        domainFilter,
      });

      // Determine browser executable path
      let executablePath = profile.browserPath;
      if (!executablePath) {
        // Try to find Chrome
        const possiblePaths = [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ];
        for (const chromePath of possiblePaths) {
          if (fs.existsSync(chromePath)) {
            executablePath = chromePath;
            break;
          }
        }
      }

      if (!executablePath) {
        return {
          success: false,
          error:
            "Browser executable not found. Please configure browser path in profile.",
        };
      }

      // Use a unique debugging port
      const debugPort = 9223 + Math.floor(Math.random() * 1000);

      const chromeArgs = [
        `--remote-debugging-port=${debugPort}`,
        "--remote-debugging-address=127.0.0.1",
        `--user-data-dir=${profile.userDataDir}`,
        "--start-maximized",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-popup-blocking",
        "--disable-sync",
      ];

      if (profile.userAgent) {
        chromeArgs.push(`--user-agent=${profile.userAgent}`);
      }

      logger.info("[cookie.service] Launching browser for cookie extraction");

      // Launch Chrome using spawn
      const { spawn } = require("child_process");
      const chromeProcess = spawn(executablePath, chromeArgs, {
        detached: true,
        stdio: "ignore",
      });
      chromeProcess.unref();

      // Wait and connect to debugging port
      const maxRetries = 10;
      const retryDelay = 500;
      let connected = false;

      for (let i = 0; i < maxRetries; i++) {
        try {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${debugPort}`,
            defaultViewport: null,
          });
          connected = true;
          logger.info("[cookie.service] Connected to browser");
          break;
        } catch (err) {
          if (i === maxRetries - 1) {
            return {
              success: false,
              error: `Failed to connect to browser on port ${debugPort}`,
            };
          }
        }
      }

      if (!connected) {
        return { success: false, error: "Failed to connect to browser" };
      }

      // Get or create page
      const pages = await browser.pages();
      page = pages.length > 0 ? pages[0] : await browser.newPage();

      // Navigate to target URL
      logger.info("[cookie.service] Navigating to target URL", { targetUrl });
      try {
        await page.goto(targetUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
      } catch (navError) {
        logger.warn(
          "[cookie.service] Navigation timeout or error (continuing)",
          navError
        );
        // Continue even if navigation times out - we just want the cookies
      }

      // Get ALL cookies from the browser (including HttpOnly!)
      const allCookies = await page.cookies();

      logger.info("[cookie.service] Retrieved all cookies from browser", {
        totalCookies: allCookies.length,
      });

      // Filter cookies by domain
      const filteredCookies = allCookies.filter(
        (c: any) =>
          c.domain.includes(domainFilter) ||
          c.domain.includes("." + domainFilter) ||
          c.domain === domainFilter
      );

      logger.info("[cookie.service] Filtered cookies by domain", {
        domainFilter,
        filteredCount: filteredCookies.length,
        cookieNames: filteredCookies.map((c: any) => c.name),
      });

      if (filteredCookies.length === 0) {
        await page.close();
        await browser.disconnect();
        return {
          success: false,
          error: `No cookies found for domain filter: ${domainFilter}. Please log into ${targetUrl} first.`,
        };
      }

      // Convert to cookie string format
      const cookieString = filteredCookies
        .map((c: any) => `${c.name}=${c.value}`)
        .join("; ");

      logger.info("[cookie.service] Successfully extracted cookies", {
        cookieCount: filteredCookies.length,
        cookieStringLength: cookieString.length,
        hasHttpOnlyCookies: filteredCookies.some((c: any) => c.httpOnly),
      });

      // Cleanup
      await page.close().catch(() => {});
      await browser.disconnect().catch(() => {});

      return {
        success: true,
        data: {
          cookieString,
          cookies: filteredCookies,
        },
      };
    } catch (error) {
      logger.error(
        "[cookie.service] Failed to extract cookies from browser",
        error
      );

      // Cleanup on error
      if (page) await page.close().catch(() => {});
      if (browser) await browser.disconnect().catch(() => {});

      return {
        success: false,
        error: `Failed to extract cookies: ${
          error instanceof Error ? error.message : String(error)
        }`,
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
  async getCookie(
    profileId: string,
    url: string
  ): Promise<ApiResponse<Cookie | null>> {
    try {
      if (!profileId || profileId.trim() === "") {
        return { success: false, error: "Profile ID is required" };
      }
      if (!url || url.trim() === "") {
        return { success: false, error: "URL is required" };
      }

      const cookie = await this.cookieRepository.findByProfileAndUrl(
        profileId,
        url
      );
      return { success: true, data: cookie };
    } catch (error) {
      logger.error("[cookie.service] Failed to get cookie", error);
      return { success: false, error: "Failed to retrieve cookie" };
    }
  }

  /**
   * Create a new cookie
   */
  async createCookie(
    profileId: string,
    url: string,
    service: string,
    data: Partial<Cookie>
  ): Promise<ApiResponse<Cookie>> {
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
      const exists = await this.cookieRepository.existsByProfileAndUrl(
        profileId,
        url
      );
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
        geminiToken: data.geminiToken,
        rawCookieString: data.rawCookieString,
        lastRotatedAt: data.lastRotatedAt,
        spidExpiration: data.spidExpiration,
        rotationData: data.rotationData,
        rotationIntervalMinutes: data.rotationIntervalMinutes ?? 1440, // Default 24 hours
        status: "active",
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
  async updateRotationInterval(
    id: string,
    rotationIntervalMinutes: number
  ): Promise<ApiResponse<void>> {
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
      logger.error(
        "[cookie.service] Failed to update rotation interval",
        error
      );
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
      geminiToken?: string;
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
  async updateStatus(
    id: string,
    status: "active" | "expired" | "renewal_failed"
  ): Promise<ApiResponse<void>> {
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
      logger.error(
        "[cookie.service] Failed to get cookies due for rotation",
        error
      );
      return {
        success: false,
        error: "Failed to retrieve cookies due for rotation",
      };
    }
  }

  /**
   * Get cookies by status
   */
  async getCookiesByStatus(
    status: "active" | "expired" | "renewal_failed"
  ): Promise<ApiResponse<Cookie[]>> {
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
   * This method filters cookies for a specific url and stores them in the cookie table
   * @param profileId - The profile ID to associate with the cookies
   * @param url - The url to filter cookies for (e.g., "labs.google")
   * @param pageUrl - The page URL used for cookie extraction (for reference)
   * @param cookies - Array of Puppeteer cookies from the page
   * @returns ApiResponse with the created Cookie entity
   */
  async extractAndStoreCookiesFromPage(
    profileId: string,
    url: string,
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
      if (!url || url.trim() === "") {
        return { success: false, error: "URL is required" };
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

      logger.info("[cookie.service] Extracting cookies from page", {
        profileId,
        url,
        pageUrl,
        totalCookies: cookies.length,
      });

      // Filter cookies for the specified domain
      // Be more permissive - include cookies from parent domains too
      // e.g., if url is "gemini.google.com", also get cookies from ".google.com"
      const urlCookies = cookies.filter((cookie) => {
        const domain = cookie.domain.toLowerCase();
        const urlLower = url.toLowerCase();

        return (
          domain === urlLower || // exact match: gemini.google.com
          domain.endsWith("." + urlLower) || // subdomain: .gemini.google.com
          domain === "." + urlLower || // .google.com
          urlLower.includes(domain.replace(/^\./, "")) // url contains domain (google.com contains .google.com)
        );
      });

      if (urlCookies.length === 0) {
        // If no cookies found with specific domain, include all cookies as fallback
        // This handles cases where we need parent domain cookies
        logger.warn(
          "[cookie.service] No cookies for specific domain, using all cookies",
          {
            profileId,
            url,
            allCookieCount: cookies.length,
            cookieNames: cookies.map((c) => c.name).join(", "),
          }
        );

        // Still return all cookies - they're needed for authentication
        urlCookies.push(...cookies);
      }

      // Convert cookies to standard cookie string format: "name=value; name2=value2"
      const cookieString = urlCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      logger.info("[cookie.service] Extracted cookie string", {
        profileId,
        url,
        cookieCount: urlCookies.length,
        cookieStringLength: cookieString.length,
        cookieNames: urlCookies.map((c) => c.name).join(", "),
        hasSecurePsid: urlCookies.some((c) => c.name === "__Secure-1PSID"),
        hasSecurePsidTs: urlCookies.some((c) => c.name === "__Secure-1PSIDTS"),
      });

      // Find the earliest expiry date among the cookies
      const expiryDates = urlCookies
        .filter((c) => c.expires && c.expires > 0)
        .map((c) => c.expires! * 1000);

      const earliestExpiry =
        expiryDates.length > 0 ? new Date(Math.min(...expiryDates)) : undefined;

      // Check if a cookie already exists for this profile and url
      const existingCookie = await this.cookieRepository.findByProfileAndUrl(
        profileId,
        url
      );

      const now = new Date().toISOString();
      const cookieData: Partial<Cookie> = {
        rawCookieString: cookieString,
        spidExpiration: earliestExpiry?.toISOString(),
        status: "active",
      };

      let result: Cookie;

      if (existingCookie) {
        // Update existing cookie
        await this.cookieRepository.update(existingCookie.id, {
          ...cookieData,
          updatedAt: now,
        } as Partial<Cookie>);

        logger.info("[cookie.service] Updated existing cookie", {
          profileId,
          url,
          cookieId: existingCookie.id,
        });

        result = {
          ...existingCookie,
          ...cookieData,
          updatedAt: now,
        } as Cookie;
      } else {
        // Create new cookie
        const { v4: uuidv4 } = await import("uuid");
        const newCookie: Cookie = {
          id: uuidv4(),
          profileId,
          url,
          service,
          rawCookieString: cookieString,
          spidExpiration: earliestExpiry?.toISOString(),
          rotationIntervalMinutes: 1440, // Default 24 hours
          status: "active",
          createdAt: now,
          updatedAt: now,
        };

        await this.cookieRepository.insert(newCookie);

        logger.info(
          "[cookie.service] Created new cookie from page extraction",
          {
            profileId,
            url,
            cookieId: newCookie.id,
          }
        );

        result = newCookie;
      }

      return { success: true, data: result };
    } catch (error) {
      logger.error(
        "[cookie.service] Failed to extract and store cookies from page",
        error
      );
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
    const { database } = require("../../../storage/database");
    const { CookieRepository } = require("../repository/cookie.repository");
    const db = database.getSQLiteDatabase();
    const cookieRepository = new CookieRepository(db);
    cookieServiceInstance = new CookieService(cookieRepository);
  }
  return cookieServiceInstance;
}

// Export default singleton
export const cookieService = getCookieService();
