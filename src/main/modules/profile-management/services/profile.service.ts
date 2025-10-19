import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
// Use puppeteer-extra with stealth plugin for better automation detection bypass
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { profileRepository } from "../../../storage/database";
import { ApiResponse } from "../../../../shared/types";
import { Logger } from "../../../../shared/utils/logger";
import { StringUtil } from "../../../../shared/utils/string";
import { CreateProfileInput, Profile } from "../profile.types";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

const logger = new Logger("ProfileService");

export class ProfileService {
  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<ApiResponse<Profile[]>> {
    try {
      const profiles = await profileRepository.findAll();
      return { success: true, data: profiles };
    } catch (error) {
      logger.error("Failed to get profiles", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get profile by ID
   */
  async getProfileById(id: string): Promise<ApiResponse<Profile>> {
    try {
      const profile = await profileRepository.findById(id);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }
      return { success: true, data: profile };
    } catch (error) {
      logger.error("Failed to get profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create new profile
   */
  async createProfile(
    input: CreateProfileInput
  ): Promise<ApiResponse<Profile>> {
    try {
      const profileId = StringUtil.generateId("profile");

      // Sanitize profile name for use in folder name (replace spaces and special chars with underscore)
      const sanitizedName = input.name
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_");
      const folderName = `${sanitizedName}_${profileId}`;

      // Determine profile directory path
      let profileDir: string;
      if (input.userDataDir) {
        // User selected a path - append profile folder name
        profileDir = path.join(input.userDataDir, folderName);
      } else {
        // Use default app profiles directory
        profileDir = path.join(app.getPath("userData"), "profiles", folderName);
      }

      // Create profile directory if it doesn't exist
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
        logger.info(`Created profile directory: ${profileDir}`);
      }

      const profile: Profile = {
        id: profileId,
        name: input.name,
        browserPath: input.browserPath,
        userDataDir: profileDir,
        userAgent: input.userAgent,
        proxy: input.proxy,
        creditRemaining: input.creditRemaining || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await profileRepository.insert(profile);
      logger.info(`Profile created: ${profile.id}`);

      return { success: true, data: profile };
    } catch (error) {
      logger.error("Failed to create profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update profile
   */
  async updateProfile(
    id: string,
    updates: Partial<Profile>
  ): Promise<ApiResponse<Profile>> {
    try {
      if (!(await profileRepository.exists(id))) {
        return { success: false, error: "Profile not found" };
      }

      await profileRepository.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      const updatedProfile = await profileRepository.findById(id);
      logger.info(`Profile updated: ${id}`);
      return { success: true, data: updatedProfile! };
    } catch (error) {
      logger.error("Failed to update profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete profile
   */
  async deleteProfile(id: string): Promise<ApiResponse<boolean>> {
    try {
      const profile = await profileRepository.findById(id);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Delete from database first
      await profileRepository.delete(id);
      logger.info(`Profile deleted from database: ${id}`);

      // Delete profile directory from disk
      if (profile.userDataDir && fs.existsSync(profile.userDataDir)) {
        try {
          // Use rimraf-like recursive delete
          fs.rmSync(profile.userDataDir, { recursive: true, force: true });
          logger.info(`Profile directory deleted: ${profile.userDataDir}`);
        } catch (dirError) {
          logger.error(
            `Failed to delete profile directory: ${profile.userDataDir}`,
            dirError
          );
          // Don't fail the whole operation if directory deletion fails
          // The profile is already removed from database
        }
      }

      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update credit
   */
  async updateCredit(
    id: string,
    amount: number
  ): Promise<ApiResponse<Profile>> {
    try {
      const profile = await profileRepository.findById(id);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      const newCredit = profile.creditRemaining + amount;
      if (newCredit < 0) {
        return { success: false, error: "Insufficient credit" };
      }

      await profileRepository.updateCredit(id, newCredit);
      const updatedProfile = await profileRepository.findById(id);

      logger.info(`Profile credit updated: ${id}`);
      return { success: true, data: updatedProfile! };
    } catch (error) {
      logger.error("Failed to update credit", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check if page has authentication cookies
   * Returns cookie string in standard format: "name=value; name2=value2"
   */
  private async checkAndGetCookies(
    page: Page
  ): Promise<{ hasAuth: boolean; cookieString: string; expires?: Date }> {
    try {
      // Get all cookies from the page
      const allCookies = await page.cookies();

      // Filter cookies for labs.google and google.com domains
      const labsCookies = allCookies.filter(
        (cookie) =>
          cookie.domain.includes("labs.google") ||
          cookie.domain.includes(".google.com") ||
          cookie.domain === "google.com"
      );

      // Check if we have authentication cookies (next-auth or email)
      const hasAuthCookies = labsCookies.some(
        (cookie) =>
          cookie.name.includes("next-auth") ||
          cookie.name === "email" ||
          cookie.name.startsWith("__Secure-next-auth") ||
          cookie.name.startsWith("__Host-next-auth")
      );

      if (hasAuthCookies && labsCookies.length > 0) {
        // Convert cookies to standard cookie string format: "name=value; name2=value2"
        const cookieString = labsCookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; ");

        // Find the earliest expiry date among the cookies
        const expiryDates = labsCookies
          .filter((c) => c.expires && c.expires > 0)
          .map((c) => c.expires! * 1000);

        const earliestExpiry =
          expiryDates.length > 0
            ? new Date(Math.min(...expiryDates))
            : undefined;

        return {
          hasAuth: true,
          cookieString,
          expires: earliestExpiry,
        };
      }

      return { hasAuth: false, cookieString: "" };
    } catch (error) {
      logger.error("Error checking cookies", error);
      return { hasAuth: false, cookieString: "" };
    }
  }

  /**
   * Check if page is showing sign-in UI
   */
  private async isSignInPage(page: Page): Promise<boolean> {
    try {
      // Check if there's a "Sign in" button or link
      const signInElement = await page.$(
        'a[href*="accounts.google"], button:has-text("Sign in"), a:has-text("Sign in")'
      );
      return signInElement !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get default Chrome path based on platform
   */
  private getDefaultChromePath(): string | undefined {
    const platform = process.platform;

    if (platform === "win32") {
      // Windows
      const possiblePaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        path.join(
          process.env.LOCALAPPDATA || "",
          "Google\\Chrome\\Application\\chrome.exe"
        ),
        path.join(
          process.env.PROGRAMFILES || "",
          "Google\\Chrome\\Application\\chrome.exe"
        ),
        path.join(
          process.env["PROGRAMFILES(X86)"] || "",
          "Google\\Chrome\\Application\\chrome.exe"
        ),
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    } else if (platform === "darwin") {
      // macOS
      const possiblePaths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        path.join(
          process.env.HOME || "",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        ),
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    } else {
      // Linux
      const possiblePaths = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/snap/bin/chromium",
      ];

      for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
          return chromePath;
        }
      }
    }

    return undefined;
  }
}

export const profileService = new ProfileService();
