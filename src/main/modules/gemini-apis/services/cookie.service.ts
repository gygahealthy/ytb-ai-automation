import { CookieRepository } from "../repository/cookie.repository";
import { Cookie } from "../shared/types";
import { logger } from "../../../utils/logger-backend";
import { ApiResponse } from "../../../../shared/types";

/**
 * Service for managing cookies
 * Handles business logic and validation
 */
export class CookieService {
  constructor(private cookieRepository: CookieRepository) {}

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
      const urlCookies = cookies.filter(
        (cookie) =>
          cookie.domain.includes(url) ||
          cookie.domain.includes("." + url) ||
          cookie.domain === url
      );

      if (urlCookies.length === 0) {
        return {
          success: false,
          error: `No cookies found for url: ${url}`,
        };
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
    const {
      database,
      CookieRepository,
    } = require("../../../../storage/database");
    const db = database.getSQLiteDatabase();
    const cookieRepository = new CookieRepository(db);
    cookieServiceInstance = new CookieService(cookieRepository);
  }
  return cookieServiceInstance;
}

// Export default singleton
export const cookieService = getCookieService();
