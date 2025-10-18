import { IpcRegistration } from "../../../../core/ipc/types";
import { profileRepository } from "../../../../main/storage/repositories";
import { logger } from "../../../utils/logger-backend";
import { browserManager } from "../../instance-management/services/browser-manager";
import { ChatService } from "../services/chat.service";
import { CookieManagerDB } from "../services/cookie-manager-db";
import { cookieService } from "../services/cookie.service";

// Global cookie manager instance (initialized on demand)
let cookieManager: CookieManagerDB | null = null;

export const cookieRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:cookies:list",
    description: "Get all cookies for a profile",
    handler: async (req: { profileId: string }) => {
      const { profileId } = req as any;
      return await cookieService.getCookiesByProfile(profileId);
    },
  },
  {
    channel: "gemini:cookies:get",
    description: "Get a specific cookie by profile and url",
    handler: async (req: { profileId: string; url: string }) => {
      const { profileId, url } = req as any;
      return await cookieService.getCookie(profileId, url);
    },
  },
  {
    channel: "gemini:cookies:create",
    description: "Create a new cookie",
    handler: async (req: any) => {
      const { profileId, url, service, data } = req as any;
      return await cookieService.createCookie(profileId, url, service, data);
    },
  },
  {
    channel: "gemini:cookies:updateRotationInterval",
    description: "Update cookie rotation interval",
    handler: async (req: { id: string; rotationIntervalMinutes: number }) => {
      const { id, rotationIntervalMinutes } = req as any;
      return await cookieService.updateRotationInterval(
        id,
        rotationIntervalMinutes
      );
    },
  },
  {
    channel: "gemini:cookies:updateStatus",
    description: "Update cookie status",
    handler: async (req: {
      id: string;
      status: "active" | "expired" | "renewal_failed";
    }) => {
      const { id, status } = req as any;
      return await cookieService.updateStatus(id, status);
    },
  },
  {
    channel: "gemini:cookies:delete",
    description: "Delete a cookie",
    handler: async (req: { id: string }) => {
      const { id } = req as any;
      return await cookieService.deleteCookie(id);
    },
  },
  {
    channel: "gemini:cookies:deleteByProfile",
    description: "Delete all cookies for a profile",
    handler: async (req: { profileId: string }) => {
      const { profileId } = req as any;
      return await cookieService.deleteProfileCookies(profileId);
    },
  },
  {
    channel: "gemini:cookies:getDueForRotation",
    description: "Get cookies due for rotation",
    handler: async () => {
      return await cookieService.getCookiesDueForRotation();
    },
  },
  {
    channel: "gemini:cookies:getByStatus",
    description: "Get cookies by status",
    handler: async (req: {
      status: "active" | "expired" | "renewal_failed";
    }) => {
      const { status } = req as any;
      return await cookieService.getCookiesByStatus(status);
    },
  },
  {
    channel: "gemini:cookies:extractAndStore",
    description: "Extract cookies from page and store in database",
    handler: async (req: {
      profileId: string;
      url: string;
      service: string;
      pageUrl: string;
      cookies: Array<{
        name: string;
        value: string;
        domain: string;
        expires?: number;
      }>;
    }) => {
      const { profileId, url, service, pageUrl, cookies } = req as any;
      return await cookieService.extractAndStoreCookiesFromPage(
        profileId,
        url,
        service,
        pageUrl,
        cookies
      );
    },
  },
  {
    channel: "gemini:cookies:extractAndCreate",
    description: "Extract cookies from URL for a profile",
    handler: async (req: {
      profileId: string;
      service: string;
      url: string;
    }) => {
      const { profileId, service, url } = req as any;

      // Validate inputs
      if (!profileId || !service || !url) {
        return {
          success: false,
          error: "Missing required fields: profileId, service, url",
        };
      }

      try {
        // Get the profile
        const profile = await profileRepository.findById(profileId);
        if (!profile) {
          return {
            success: false,
            error: "Profile not found",
          };
        }

        logger.info("[cookies:extractAndCreate] Starting cookie extraction", {
          profileId,
          service,
          url,
        });

        // Launch browser with the profile
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
          // Create a new page
          page = await browser.newPage();

          // Set viewport
          await page.setViewport({ width: 1280, height: 720 });

          // Navigate to the URL
          logger.info("[cookies:extractAndCreate] Navigating to URL", { url });
          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

          // Wait a bit for any additional scripts to load
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Get cookies from the page
          const cookies = await page.cookies();

          if (cookies.length === 0) {
            await page.close();
            await browser.disconnect();
            return {
              success: false,
              error: `No cookies found on the page. Make sure you're logged in to ${service}.`,
            };
          }

          logger.info("[cookies:extractAndCreate] Extracted cookies", {
            profileId,
            cookieCount: cookies.length,
          });

          // Extract domain from the URL for filtering
          const urlObj = new URL(url);
          const domain = urlObj.hostname;

          // Store the cookies
          const storeResult =
            await cookieService.extractAndStoreCookiesFromPage(
              profileId,
              domain,
              service,
              url,
              cookies
            );

          // Close the page and disconnect
          await page.close();
          await browser.disconnect();

          if (!storeResult.success) {
            return {
              success: false,
              error: `Failed to store cookies: ${storeResult.error}`,
            };
          }

          logger.info(
            "[cookies:extractAndCreate] Successfully extracted and stored cookies",
            {
              profileId,
              service,
              cookieId: storeResult.data?.id,
            }
          );

          return storeResult;
        } catch (error) {
          // Clean up browser on error
          if (page) {
            try {
              await page.close();
            } catch (e) {
              logger.error("[cookies:extractAndCreate] Error closing page", e);
            }
          }
          if (browser) {
            try {
              await browser.disconnect();
            } catch (e) {
              logger.error(
                "[cookies:extractAndCreate] Error disconnecting browser",
                e
              );
            }
          }

          logger.error(
            "[cookies:extractAndCreate] Error during extraction",
            error
          );
          return {
            success: false,
            error: `Error extracting cookies: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      } catch (error) {
        logger.error("[cookies:extractAndCreate] Unexpected error", error);
        return {
          success: false,
          error: `Unexpected error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    },
  },
  {
    channel: "gemini:cookies:extractFromBrowser",
    description: "Extract cookies from browser user data directory",
    handler: async (req: { profileId: string }) => {
      const { profileId } = req as any;

      if (!profileId) {
        return {
          success: false,
          error: "Profile ID is required",
        };
      }

      try {
        const profile = await profileRepository.findById(profileId);
        if (!profile) {
          return {
            success: false,
            error: "Profile not found",
          };
        }

        logger.info(
          "[cookies:extractFromBrowser] Extracting cookies from browser profile",
          {
            profileId,
            userDataDir: profile.userDataDir,
          }
        );

        // Use the browser manager to extract cookies
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

          // Navigate to Gemini to ensure cookies are available
          logger.info("[cookies:extractFromBrowser] Navigating to Gemini");
          await page
            .goto("https://gemini.google.com", {
              waitUntil: "networkidle2",
              timeout: 30000,
            })
            .catch(() => {
              // Timeout or navigation error is ok, we just want the cookies
            });

          // Get ALL cookies from the browser (including HttpOnly!)
          const cookies = await page.cookies();

          logger.info(
            "[cookies:extractFromBrowser] Retrieved cookies from browser",
            {
              totalCookies: cookies.length,
              cookieNames: cookies.map((c) => c.name),
            }
          );

          // Filter for Gemini-related cookies
          const geminCookies = cookies.filter(
            (c) =>
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

          // Convert cookies to header format
          const cookieString = geminCookies
            .map((c) => `${c.name}=${c.value}`)
            .join("; ");

          logger.info(
            "[cookies:extractFromBrowser] Creating/updating cookie record",
            {
              cookieCount: geminCookies.length,
              cookieStringLength: cookieString.length,
            }
          );

          // Create or update the cookie in the database
          await cookieService.createCookie(
            profileId,
            "https://gemini.google.com",
            "gemini",
            {
              rawCookieString: cookieString,
            }
          );

          await page.close();
          await browser.disconnect();

          return {
            success: true,
            data: {
              cookieCount: geminCookies.length,
              cookies: geminCookies.map((c) => ({
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
          } catch (e) {
            logger.warn("[cookies:extractFromBrowser] Error cleaning up", e);
          }

          return {
            success: false,
            error: `Failed to extract cookies: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      } catch (error) {
        logger.error("[cookies:extractFromBrowser] Unexpected error", error);
        return {
          success: false,
          error: `Unexpected error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    },
  },
];

export const chatRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:chat:send",
    description: "Send a message to Gemini chat API",
    handler: async (req: any) => {
      return await sendChatMessage(req);
    },
  },
];

/**
 * Send chat message handler
 */
async function sendChatMessage(req: {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
}): Promise<any> {
  try {
    const { profileId, prompt, conversationContext } = req;

    // Validate required fields
    if (!profileId || !prompt) {
      return {
        success: false,
        error: "Missing required fields: profileId, prompt",
      };
    }

    // Verify profile exists
    const profile = await profileRepository.findById(profileId);
    if (!profile) {
      return {
        success: false,
        error: `Profile not found: ${profileId}`,
      };
    }

    // Get cookies for the profile
    const cookiesResult = await cookieService.getCookiesByProfile(profileId);
    logger.info(`[chat] Cookies from database for profile ${profileId}:`, {
      found: cookiesResult.success,
      count: cookiesResult.data?.length || 0,
      firstCookie: cookiesResult.data?.[0]
        ? {
            id: cookiesResult.data[0].id,
            service: cookiesResult.data[0].service,
            url: cookiesResult.data[0].url,
            hasRawString: !!cookiesResult.data[0].rawCookieString,
            rawStringLength: cookiesResult.data[0].rawCookieString?.length,
          }
        : null,
    });

    if (!cookiesResult.success || !cookiesResult.data?.length) {
      return {
        success: false,
        error: `No cookies found for profile ${profileId}. Please log into Gemini (https://gemini.google.com) using this profile's browser, then the cookies will be automatically detected.`,
      };
    }

    // Initialize cookie manager with proper repository
    if (!cookieManager) {
      const cookies = cookiesResult.data[0];
      const cookieObj: any = {};

      // Parse raw cookie string into object
      if (cookies.rawCookieString) {
        for (const part of cookies.rawCookieString.split(";")) {
          const trimmed = part.trim();
          if (trimmed && trimmed.includes("=")) {
            const [name, value] = trimmed.split("=", 2);
            cookieObj[name.trim()] = value.trim();
          }
        }
      }

      // Import database and create cookie repository
      const { database } = require("../../../storage/database");
      const { CookieRepository } = require("../repository/cookie.repository");
      const db = database.getSQLiteDatabase();
      const cookieRepository = new CookieRepository(db);

      // Create cookie manager with proper initialization
      cookieManager = new CookieManagerDB(
        cookieObj,
        cookieRepository,
        profileId,
        "gemini.google.com",
        {
          autoValidate: false,
          validateOnInit: false,
          verbose: false,
        }
      );

      // Initialize the cookie manager
      try {
        await cookieManager.init();
      } catch (initError) {
        logger.warn(
          `Cookie manager initialization warning: ${initError}`,
          initError
        );
        // Continue even if init fails - the cookies might still be usable
      }
    }

    // Create chat service
    const chatService = new ChatService(cookieManager!);

    // Load conversation context if provided
    if (conversationContext) {
      chatService.loadMetadata({
        cid: conversationContext.chatId,
        rid: conversationContext.replyId,
        rcid: conversationContext.rcId,
      });
    }

    // Send the message
    const response = await chatService.sendMessage(prompt);

    return {
      success: response.success,
      data: response.fullText,
      metadata: response.metadata,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Chat error: ${message}`,
    };
  }
}
