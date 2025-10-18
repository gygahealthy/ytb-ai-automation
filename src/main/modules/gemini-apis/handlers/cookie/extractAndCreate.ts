import { profileRepository } from "../../../../storage/repositories";
import { browserManager } from "../../../instance-management/services/browser-manager";
import { instanceManager as iManager } from "../../../instance-management/services/instance-manager";
import { cookieService } from "../../services/cookie.service";
import { logger } from "../../../../utils/logger-backend";

export const extractAndCreateHandler = async (req: {
  profileId: string;
  service: string;
  url: string;
}) => {
  const { profileId, service, url } = req as any;

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
      error:
        "Profile is currently running an automation. Please wait for it to complete before extracting cookies.",
    };
  }

  logger.info("[cookies:extractAndCreate] Starting cookie extraction", {
    profileId,
    service,
    url,
  });

  const launchResult = await browserManager.launchBrowserWithDebugging(
    profile,
    { headless: false }
  );
  if (!launchResult.success || !launchResult.browser) {
    return {
      success: false,
      error: `Failed to launch browser: ${launchResult.error}`,
    };
  }

  const browser = launchResult.browser;
  let page = null;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const cookies = await page.cookies();

    if (cookies.length === 0) {
      await page.close();
      await browser.disconnect();
      return {
        success: false,
        error: `No cookies found on the page. Make sure you're logged in to ${service}.`,
      };
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const storeResult = await cookieService.extractAndStoreCookiesFromPage(
      profileId,
      domain,
      service,
      url,
      cookies
    );

    await page.close();
    await browser.disconnect();

    if (!storeResult.success)
      return {
        success: false,
        error: `Failed to store cookies: ${storeResult.error}`,
      };

    return storeResult;
  } catch (error) {
    try {
      if (page) await page.close();
      await browser.disconnect();
    } catch (e) {
      // Ignore cleanup errors
    }
    logger.error("[cookies:extractAndCreate] Error during extraction", error);
    return {
      success: false,
      error: `Error extracting cookies: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
