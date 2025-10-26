import { profileRepository } from "@main/storage/repositories";
import { instanceManager as iManager } from "@modules/instance-management/services/instance-manager";
import { cookieService } from "../services/cookie.service";
import { logger } from "@main/utils/logger-backend";

/**
 * Unified cookie extraction handler
 *
 * Consolidates all cookie extraction methods into a single, comprehensive handler.
 * Extracts cookies from a given URL using the profile's browser context,
 * then stores them in the database.
 *
 * Features:
 * - Extracts ALL cookies from profile's browser
 * - Filters by domain (more inclusive than just exact matches)
 * - Stores full cookie data including HttpOnly, Secure flags
 * - Supports both headless and visible browser modes
 * - Handles profile locking to prevent concurrent extractions
 * - Applies rotation configuration if provided
 */
export const extractAndCreateHandler = async (req: {
  profileId: string;
  service: string;
  url: string;
  headless?: boolean;
  rotationConfig?: any;
}) => {
  const { profileId, service, url, headless = true, rotationConfig } = req as any;

  if (!profileId || !service || !url) {
    return {
      success: false,
      error: "Missing required fields: profileId, service, url",
    };
  }

  const profile = await profileRepository.findById(profileId);
  if (!profile) return { success: false, error: "Profile not found" };

  // Check if profile is already running/locked
  if (!iManager.canLaunchProfile(profileId)) {
    return {
      success: false,
      error: "Profile is currently running an automation. Please wait for it to complete before extracting cookies.",
    };
  }

  logger.info("[cookies:extractAndCreate] Starting unified cookie extraction", {
    profileId,
    service,
    url,
  });

  try {
    // Extract domain from URL for cookie filtering
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const domainFilter = domain.replace(/^www\./, ""); // Remove www prefix if present

    logger.info("[cookies:extractAndCreate] Extracted domain information", {
      originalUrl: url,
      hostname: domain,
      domainFilter: domainFilter,
    });

    // Extract cookies using the specified browser mode (headless or visible)
    logger.info("[cookies:extractAndCreate] Using browser mode:", {
      headless: headless,
      mode: headless ? "HEADLESS (background)" : "VISIBLE (interactive)",
      requiredCookies: rotationConfig?.requiredCookies,
    });

    // Extract requiredCookies from rotationConfig if provided
    const requiredCookies = rotationConfig?.requiredCookies;

    const extractResult = await cookieService.extractAndStoreCookiesFromBrowser(
      profile,
      url,
      domainFilter,
      headless, // Use the actual headless parameter
      requiredCookies // Pass requiredCookies for polling validation
    );

    if (!extractResult.success) {
      logger.error("[cookies:extractAndCreate] Browser extraction failed", {
        error: extractResult.error,
      });
      return {
        success: false,
        error: extractResult.error || "Failed to extract cookies from browser",
      };
    }

    logger.info("[cookies:extractAndCreate] Browser extraction successful", {
      extractedCookieCount: extractResult.data!.cookies.length,
      cookieNames: extractResult.data!.cookies.map((c: any) => c.name),
    });

    // Store the extracted cookies in database
    // domainFilter is used for cookie filtering, url is stored as the reference URL
    const storeResult = await cookieService.storeCookiesFromPage(
      profileId,
      domainFilter, // Used for filtering cookies by domain
      service,
      url, // Full URL stored in database
      extractResult.data!.cookies
    );

    if (!storeResult.success) {
      logger.error("[cookies:extractAndCreate] Failed to store cookies", {
        error: storeResult.error,
      });
      return {
        success: false,
        error: `Failed to store cookies: ${storeResult.error}`,
      };
    }

    // If rotation config was provided, update the stored cookie with rotation settings
    if (rotationConfig && storeResult.data) {
      logger.info("[cookies:extractAndCreate] Applying rotation config to extracted cookie", {
        cookieId: storeResult.data.id,
        rotationConfig: rotationConfig,
      });

      await cookieService.repository.updateRotationConfig(storeResult.data.id, rotationConfig);

      // Fetch updated cookie with rotation config applied
      const updatedCookie = await cookieService.repository.findById(storeResult.data.id);
      if (updatedCookie) {
        storeResult.data = updatedCookie;
      }
    }

    logger.info("[cookies:extractAndCreate] Extraction and storage completed successfully", {
      service,
      url,
      totalExtracted: extractResult.data!.cookies.length,
      rotationConfigApplied: !!rotationConfig,
    });

    return storeResult;
  } catch (error) {
    logger.error("[cookies:extractAndCreate] Unexpected error during extraction", error);
    return {
      success: false,
      error: `Error extracting cookies: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
