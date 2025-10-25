/**
 * Headless Browser Refresh Method
 * Launches a headless browser session to get completely fresh cookies
 * This is the most reliable but also the most resource-intensive method
 *
 * Integration Flow:
 * 1. Receives cookieId and profileId from rotation worker
 * 2. Fetches profile entity with userDataDir from database
 * 3. Delegates to CookieService.extractAndStoreCookiesFromBrowser() with headless=true
 * 4. Parses and returns updated CookieCollection
 */

import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import type { RotationMethodExecutor, RotationMethodResult } from "../types/rotation-method.types.js";
import { logger } from "../../../../utils/logger-backend.js";

export class HeadlessMethod implements RotationMethodExecutor {
  name = "headless" as const;

  async execute(
    _cookies: CookieCollection,
    options?: { proxy?: string; cookieId?: string; profileId?: string }
  ): Promise<RotationMethodResult> {
    const startTime = Date.now();

    try {
      // Validate required options
      if (!options?.cookieId || !options?.profileId) {
        return {
          success: false,
          method: this.name,
          error: "HeadlessMethod requires cookieId and profileId in options",
          duration: Date.now() - startTime,
        };
      }

      const { cookieId, profileId } = options;

      logger.info("[HeadlessMethod] Starting headless browser refresh", {
        cookieId,
        profileId,
      });

      // Step 1: Get cookie record from database to retrieve URL and service
      // Use worker-safe database instance (doesn't rely on Electron app.getPath())
      const db = await this.getWorkerSafeDatabase();
      const cookieRow = await db.get("SELECT * FROM cookies WHERE id = ?", [cookieId]);

      if (!cookieRow) {
        return {
          success: false,
          method: this.name,
          error: `Cookie ${cookieId} not found in database`,
          duration: Date.now() - startTime,
        };
      }

      const targetUrl = cookieRow.url || "https://gemini.google.com";
      const service = cookieRow.service || "gemini";

      logger.info("[HeadlessMethod] Cookie context retrieved", {
        targetUrl,
        service,
      });

      // Step 2: Get profile with userDataDir
      const profile = await this.getProfile(profileId);

      if (!profile) {
        return {
          success: false,
          method: this.name,
          error: `Profile ${profileId} not found`,
          duration: Date.now() - startTime,
        };
      }

      if (!profile.userDataDir) {
        return {
          success: false,
          method: this.name,
          error: `Profile ${profileId} missing userDataDir`,
          duration: Date.now() - startTime,
        };
      }

      logger.info("[HeadlessMethod] Profile loaded", {
        profileId: profile.id,
        profileName: profile.name,
        userDataDir: profile.userDataDir,
      });

      // Step 3: Use CookieService to extract fresh cookies
      // Initialize with worker-safe database to avoid singleton issues in worker process
      const { getCookieService } = await import("../../cookie/services/cookie.service.js");
      const cookieService = getCookieService(db);

      const extractResult = await cookieService.extractAndStoreCookiesFromBrowser(
        profile,
        targetUrl,
        "", // domainFilter not used
        true // Force headless mode
      );

      if (!extractResult.success || !extractResult.data) {
        return {
          success: false,
          method: this.name,
          error: extractResult.error || "Cookie extraction failed",
          duration: Date.now() - startTime,
        };
      }

      const { cookieString, cookies: extractedCookies } = extractResult.data;

      logger.info("[HeadlessMethod] Cookies extracted successfully", {
        cookieCount: extractedCookies.length,
        cookieNames: extractedCookies.map((c: any) => c.name),
      });

      // Step 4: Store extracted cookies in database using cookieService
      const storeResult = await cookieService.storeCookiesFromPage(
        profileId,
        "", // domainFilter not used
        service,
        targetUrl,
        extractedCookies
      );

      if (!storeResult.success) {
        return {
          success: false,
          method: this.name,
          error: `Failed to store cookies: ${storeResult.error}`,
          duration: Date.now() - startTime,
        };
      }

      logger.info("[HeadlessMethod] Cookies stored to database", {
        cookieId,
        storedCount: extractedCookies.length,
      });

      // Step 5: Parse extracted cookies into CookieCollection format for return
      const updatedCollection = this.parseCookiesToCollection(extractedCookies, cookieString);

      // Validate that we got essential cookies
      const hasEssentialCookies = updatedCollection["__Secure-1PSID"] || updatedCollection["__Secure-1PSIDTS"];

      if (!hasEssentialCookies) {
        logger.warn("[HeadlessMethod] Missing essential cookies, but stored what we got", {
          cookieNames: extractedCookies.map((c: any) => c.name),
        });
      }

      logger.info("[HeadlessMethod] ✅ Headless refresh completed successfully", {
        duration: Date.now() - startTime,
        essentialCookiesPresent: hasEssentialCookies,
        storedToDatabase: true,
      });

      return {
        success: true,
        method: this.name,
        updatedCookies: updatedCollection,
        duration: Date.now() - startTime,
        metadata: {
          extractedCount: extractedCookies.length,
          targetUrl,
          service,
          storedToDatabase: true,
        },
      };
    } catch (error) {
      logger.error("[HeadlessMethod] Execution failed", error);
      return {
        success: false,
        method: this.name,
        error: error instanceof Error ? error.message : "Unknown error during headless refresh",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get worker-safe database instance
   * Uses DB_PATH env var set by parent process instead of Electron app.getPath()
   */
  private async getWorkerSafeDatabase(): Promise<any> {
    const dbPath = process.env.DB_PATH;
    if (!dbPath) {
      throw new Error("DB_PATH environment variable not set. Worker process must receive DB path from parent.");
    }

    // Import SQLiteDatabase directly (not the singleton Database class which uses app.getPath())
    const { SQLiteDatabase } = await import("../../../../storage/sqlite-database.js");
    const db = new SQLiteDatabase(dbPath);
    await db.waitForInit();
    return db;
  }

  /**
   * Get profile by ID with proper property mapping
   */
  private async getProfile(profileId: string): Promise<any> {
    try {
      const db = await this.getWorkerSafeDatabase();
      const row = await db.get("SELECT * FROM profiles WHERE id = ?", [profileId]);

      if (!row) {
        logger.warn(`[HeadlessMethod] Profile ${profileId} not found`);
        return null;
      }

      // Convert snake_case DB columns to camelCase properties
      return {
        id: row.id,
        name: row.name,
        browserPath: row.browser_path || undefined,
        userDataDir: row.user_data_dir,
        userAgent: row.user_agent || undefined,
      };
    } catch (error) {
      logger.error("[HeadlessMethod] Failed to fetch profile", error);
      return null;
    }
  }

  /**
   * Parse Puppeteer cookies array into CookieCollection format
   */
  private parseCookiesToCollection(
    extractedCookies: Array<{ name: string; value: string; domain?: string }>,
    cookieString: string
  ): CookieCollection {
    const collection: Partial<CookieCollection> = {};

    // Build collection from extracted cookies
    for (const cookie of extractedCookies) {
      if (cookie.name && cookie.value) {
        (collection as any)[cookie.name] = cookie.value;
      }
    }

    // Ensure rawCookieString is included
    (collection as any).rawCookieString = cookieString;

    return collection as CookieCollection;
  }
}
