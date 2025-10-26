import { Cookie } from "../../../gemini-apis/shared/types/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { ApiResponse } from "../../../../../shared/types/index.js";
// Removed top-level database import to support worker processes
// import { database } from "@main/storage/database";
import { cookieExtractionService } from "../../cookie-extraction/index.js";
import { CookieRepository } from "../repository/cookie.repository.js";

/**
 * Service for managing cookies
 * Handles business logic and validation
 */
export class CookieService {
  constructor(private cookieRepository: CookieRepository) {}

  // Expose repository for cases where direct repository access is needed
  get repository(): CookieRepository {
    return this.cookieRepository;
  }

  /**
   * Extract cookies from browser and prepare them with DB context
   * Loads required cookies from DB, delegates extraction to CookieExtractionService,
   * and logs validation results. Does NOT store cookies - use storeCookiesFromPage() for that.
   *
   * ⚠️  DEPRECATED: This method is now a thin wrapper around CookieExtractionService.
   * Consider using CookieExtractionService directly for new code.
   *
   * @param profile - Profile with userDataDir containing browser cookies
   * @param targetUrl - URL to extract cookies for (e.g., "https://gemini.google.com")
   * @param _domainFilter - Domain to filter cookies by (DEPRECATED, not used)
   * @param headless - Whether to run in headless (background) mode or visible mode
   * @param providedRequiredCookies - Optional array of required cookie names to validate (overrides DB)
   */
  async extractAndStoreCookiesFromBrowser(
    profile: any,
    targetUrl: string = "https://gemini.google.com",
    _domainFilter: string = "google.com",
    headless: boolean = false,
    providedRequiredCookies?: string[]
  ): Promise<ApiResponse<{ cookieString: string; cookies: any[] }>> {
    logger.info("[cookie.service] Delegating extraction to CookieExtractionService", {
      profileId: profile?.id,
      targetUrl,
      headless,
    });

    try {
      // Use provided requiredCookies, or try to load from DB
      let requiredCookies: string[] | undefined = providedRequiredCookies;

      if (!requiredCookies && profile?.id) {
        try {
          const existingCookie = await this.cookieRepository.findByProfileAndUrl(profile.id, targetUrl);

          if (existingCookie?.requiredCookies) {
            requiredCookies = existingCookie.requiredCookies;
            logger.info("[cookie.service] Loaded required cookies from DB for validation", {
              requiredCookies,
            });
          }
        } catch (dbError) {
          logger.warn("[cookie.service] Failed to load required cookies from DB (continuing)", dbError);
        }
      }

      if (requiredCookies) {
        logger.info("[cookie.service] Using required cookies for extraction validation", {
          requiredCookies,
        });
      }

      // Delegate to extraction service
      const result = await cookieExtractionService.extractCookiesFromBrowser(profile, {
        targetUrl,
        headless,
        requiredCookies,
      });

      if (!result.success || !result.data) {
        return result;
      }

      // Log validation result
      if (!result.data.validation.valid) {
        logger.warn("[cookie.service] Cookie validation failed", {
          missing: result.data.validation.missing,
          requiredCookies,
        });
      }

      // Return in the same shape as before for backward compatibility
      return {
        success: true,
        data: {
          cookieString: result.data.cookieString,
          cookies: result.data.cookies,
        },
      };
    } catch (error) {
      logger.error("[cookie.service] Failed to extract cookies", error);
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

      // Extract rotation config if provided in data.rotationConfig or at root level
      const rotationConfig = (data as any).rotationConfig || {};
      const requiredCookies = rotationConfig.required_cookies
        ? typeof rotationConfig.required_cookies === "string"
          ? JSON.parse(rotationConfig.required_cookies)
          : rotationConfig.required_cookies
        : ["__Secure-3PSIDCC"];

      const cookie: Cookie = {
        id: uuidv4(),
        profileId,
        url,
        service,
        rawCookieString: data.rawCookieString,
        lastRotatedAt: data.lastRotatedAt,
        spidExpiration: data.spidExpiration,
        rotationData: data.rotationData,
        rotationIntervalMinutes: rotationConfig.rotation_interval_minutes ?? data.rotationIntervalMinutes ?? 1440, // Default 24 hours
        status: "active",
        launchWorkerOnStartup: rotationConfig.launch_worker_on_startup ?? data.launchWorkerOnStartup ?? 0,
        enabledRotationMethods:
          typeof rotationConfig.enabled_rotation_methods === "string"
            ? rotationConfig.enabled_rotation_methods
            : JSON.stringify(rotationConfig.enabled_rotation_methods ?? ["refreshCreds", "rotateCookie"]),
        rotationMethodOrder:
          typeof rotationConfig.rotation_method_order === "string"
            ? rotationConfig.rotation_method_order
            : JSON.stringify(rotationConfig.rotation_method_order ?? ["refreshCreds", "rotateCookie", "headless"]),
        requiredCookies,
        createdAt: now,
        updatedAt: now,
      };

      logger.info("[cookie.service] Creating new cookie with rotation config", {
        cookieId: cookie.id,
        profileId,
        url,
        service,
        launchWorkerOnStartup: cookie.launchWorkerOnStartup,
        rotationIntervalMinutes: cookie.rotationIntervalMinutes,
        enabledRotationMethods: cookie.enabledRotationMethods,
        requiredCookies: cookie.requiredCookies,
      });

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
   * Store pre-extracted cookies in the database
   * Takes already-extracted Puppeteer cookies and persists them to the database.
   * Creates a new cookie record or updates existing one for the profile/service/URL combination.
   * ✅ STORES ALL COOKIES FROM THE PAGE - NO DOMAIN FILTERING
   * This ensures we capture all cookies from all domains on the loaded page
   * @param profileId - The profile ID to associate with the cookies
   * @param _url - Deprecated: previously used for domain filtering, now kept for backward compatibility
   * @param service - The service name (e.g., "gemini")
   * @param pageUrl - The page URL used for cookie extraction (for reference)
   * @param cookies - Array of Puppeteer cookies from the page (ALL DOMAINS)
   * @returns ApiResponse with the created or updated Cookie entity
   */
  async storeCookiesFromPage(
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

      // ✅ Use extraction service's convertCookiesForDb helper
      const dbCookies = cookieExtractionService.convertCookiesForDb(cookies);

      logger.info("[cookie.service] Converted cookies using extraction service", {
        profileId,
        cookieCount: cookies.length,
        cookieStringLength: dbCookies.cookieString.length,
        cookieNames: cookies.map((c) => c.name).join(", "),
        cookiesByDomain: domains.map((domain) => ({
          domain,
          count: cookies.filter((c) => c.domain === domain).length,
        })),
        earliestExpiry: dbCookies.earliestExpiry,
        domains: dbCookies.domains,
      });

      // Check if a cookie already exists for this profile and pageUrl (full URL)
      const existingCookie = await this.cookieRepository.findByProfileAndUrl(profileId, pageUrl);

      const now = new Date().toISOString();

      if (existingCookie) {
        // ✅ UPDATE existing cookie using ID
        const updates: Partial<Cookie> = {
          rawCookieString: dbCookies.cookieString,
          spidExpiration: dbCookies.earliestExpiry,
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
          rawCookieString: dbCookies.cookieString,
          spidExpiration: dbCookies.earliestExpiry,
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

/**
 * Get cookie service singleton (lazy initialization)
 * Can be called from worker processes if a worker-safe database is provided
 */
export function getCookieService(db?: any): CookieService {
  if (!cookieServiceInstance) {
    // Use provided db or lazy-load from main process database
    const database =
      db ||
      (() => {
        // Lazy import to avoid triggering database initialization at module load time
        const { database: mainDb } = require("../../../../storage/database.js");
        return mainDb.getSQLiteDatabase();
      })();

    const cookieRepository = new CookieRepository(database);
    cookieServiceInstance = new CookieService(cookieRepository);
  }
  return cookieServiceInstance;
}

// Export lazy getter instead of direct singleton to avoid module-load-time database access
export const cookieService = new Proxy({} as CookieService, {
  get(_target, prop) {
    const instance = getCookieService();
    return instance[prop as keyof CookieService];
  },
});
