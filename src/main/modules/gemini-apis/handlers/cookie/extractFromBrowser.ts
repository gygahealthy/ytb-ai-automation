import { profileRepository } from "../../../../storage/repositories";
import { browserManager } from "../../../instance-management/services/browser-manager";
import { cookieService } from "../../services/cookie.service";
import { logger } from "../../../../utils/logger-backend";

export const extractFromBrowserHandler = async (req: { profileId: string }) => {
  const { profileId } = req as any;
  if (!profileId) return { success: false, error: "Profile ID is required" };

  const profile = await profileRepository.findById(profileId);
  if (!profile) return { success: false, error: "Profile not found" };

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
    await page
      .goto("https://gemini.google.com", {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
      .catch(() => {});
    const cookies = await page.cookies();
    const geminCookies = cookies.filter(
      (c: any) =>
        c.domain?.includes("google.com") || c.domain?.includes("gemini")
    );

    if (geminCookies.length === 0) {
      await page.close();
      await browser.disconnect();
      return {
        success: false,
        error:
          "No Gemini cookies found. Please log into https://gemini.google.com first.",
      };
    }

    const cookieString = geminCookies
      .map((c: any) => `${c.name}=${c.value}`)
      .join("; ");
    await cookieService.createCookie(
      profileId,
      "https://gemini.google.com",
      "gemini",
      { rawCookieString: cookieString }
    );

    await page.close();
    await browser.disconnect();

    return {
      success: true,
      data: {
        cookieCount: geminCookies.length,
        cookies: geminCookies.map((c: any) => ({
          name: c.name,
          domain: c.domain,
          httpOnly: c.httpOnly,
        })),
      },
    };
  } catch (error) {
    try {
      if (page) await page.close();
      await browser.disconnect();
    } catch (e) {}
    logger.error("[cookies:extractFromBrowser] Unexpected error", error);
    return {
      success: false,
      error: `Failed to extract cookies: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
