import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { profileRepository } from "../storage/database";
import { ApiResponse, CreateProfileInput, Profile } from "../types";
import { Logger } from "../utils/logger.util";
import { StringUtil } from "../utils/string.util";

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
  async createProfile(input: CreateProfileInput): Promise<ApiResponse<Profile>> {
    try {
      const profileId = StringUtil.generateId("profile");

      // Sanitize profile name for use in folder name (replace spaces and special chars with underscore)
      const sanitizedName = input.name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
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
  async updateProfile(id: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
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
      if (!(await profileRepository.exists(id))) {
        return { success: false, error: "Profile not found" };
      }

      await profileRepository.delete(id);
      logger.info(`Profile deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete profile", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update credit
   */
  async updateCredit(id: string, amount: number): Promise<ApiResponse<Profile>> {
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
}

export const profileService = new ProfileService();
