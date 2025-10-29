import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { profileRepository } from "../../../profile-management/repository/profile.repository";
import { COOKIE_SERVICES } from "../../../gemini-apis/shared/types";
import { cookieService } from "../../../common/cookie/services/cookie.service";
import { veo3ApiClient } from "../../flow-veo3-apis/apis/veo3-api.client";

const logger = new Logger("VEO3ProjectApiService");

/**
 * Service that contains VEO3 API-related operations which require profile cookies.
 * Separated from `video-project.service` to keep concerns isolated and testable.
 */
export class VEO3ProjectApiService {
  /**
   * Fetch projects from VEO3 API using profile's cookies
   */
  async fetchProjectsFromAPI(profileId: string): Promise<ApiResponse<any[]>> {
    try {
      logger.info(`[fetchProjectsFromAPI] Starting - profileId: ${profileId}`);

      // Get profile to ensure it exists
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        logger.warn(`[fetchProjectsFromAPI] Profile not found: ${profileId}`);
        return { success: false, error: "Profile not found" };
      }

      logger.info(`[fetchProjectsFromAPI] Profile found: ${profile.name}`);

      // Get cookies for the profile from CookieRepository
      logger.info(`[fetchProjectsFromAPI] Fetching cookies for profile: ${profileId}`);
      const cookieResult = await cookieService.getCookiesByProfile(profileId);

      logger.info(`[fetchProjectsFromAPI] Cookie fetch result:`, {
        success: cookieResult.success,
        cookieCount: cookieResult.data?.length || 0,
        error: cookieResult.error,
      });

      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        logger.warn(`[fetchProjectsFromAPI] No cookies found for profile: ${profileId}`);
        return {
          success: false,
          error: "Profile has no cookies. Please login first.",
        };
      }

      // Find the "flow" service cookie
      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");

      logger.info(`[fetchProjectsFromAPI] Cookie search:`, {
        totalCookies: cookieResult.data.length,
        cookieServices: cookieResult.data.map((c) => c.service),
        flowCookieFound: !!flowCookie,
        flowCookieStatus: flowCookie?.status,
      });

      if (!flowCookie || !flowCookie.rawCookieString) {
        logger.warn(`[fetchProjectsFromAPI] No active flow cookie found for profile: ${profileId}`);
        return {
          success: false,
          error: "Profile has no active 'flow' cookies. Please login first.",
        };
      }

      logger.info(`Fetching VEO3 projects for profile: ${profile.name}`);

      // Call VEO3 API to list projects
      const result = await veo3ApiClient.listProjects(flowCookie.rawCookieString);

      logger.info(`[fetchProjectsFromAPI] API call result:`, {
        success: result.success,
        error: result.error,
        hasData: !!result.data,
      });

      if (!result.success) {
        logger.error(`[fetchProjectsFromAPI] API call failed: ${result.error}`);
        return {
          success: false,
          error: result.error || "Failed to fetch projects from VEO3 API",
        };
      }

      // Extract projects array from response
      const projects = result.data?.projects || [];

      logger.info(`Fetched ${projects.length} projects from VEO3 API`);
      return { success: true, data: projects };
    } catch (error) {
      logger.error("Failed to fetch projects from API", error);
      return { success: false, error: String(error) };
    }
  }
  /**
   * Create a new project via VEO3 API using profile's cookies
   */
  async createProjectViaAPI(profileId: string, projectTitle: string): Promise<ApiResponse<any>> {
    try {
      // Get profile to ensure it exists
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Get cookies for the profile from CookieRepository
      const cookieResult = await cookieService.getCookiesByProfile(profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return {
          success: false,
          error: "Profile has no cookies. Please login first.",
        };
      }

      // Find the "flow" service cookie
      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return {
          success: false,
          error: "Profile has no active 'flow' cookies. Please login first.",
        };
      }

      logger.info(`Creating VEO3 project "${projectTitle}" for profile: ${profile.name}`);

      // Call VEO3 API to create project
      const result = await veo3ApiClient.createProject(flowCookie.rawCookieString, projectTitle);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to create project via VEO3 API",
        };
      }

      logger.info(`Successfully created VEO3 project: ${result.data?.projectId}`);
      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to create project via API", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update a project title via VEO3 API using profile's cookies
   */
  async updateProjectTitleViaAPI(profileId: string, projectId: string, projectTitle: string): Promise<ApiResponse<any>> {
    try {
      // Get profile to ensure it exists
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      // Get cookies for the profile from CookieRepository
      const cookieResult = await cookieService.getCookiesByProfile(profileId);
      if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
        return {
          success: false,
          error: "Profile has no cookies. Please login first.",
        };
      }

      // Find the "flow" service cookie
      const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
      if (!flowCookie || !flowCookie.rawCookieString) {
        return {
          success: false,
          error: "Profile has no active 'flow' cookies. Please login first.",
        };
      }

      logger.info(`Updating VEO3 project "${projectId}" to title: "${projectTitle}" for profile: ${profile.name}`);

      // Call VEO3 API to update project title
      const result = await veo3ApiClient.updateProjectTitle(flowCookie.rawCookieString, projectId, projectTitle);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to update project title via VEO3 API",
        };
      }

      logger.info(`Successfully updated VEO3 project: ${projectId}`);
      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to update project title via API", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3ProjectApiService = new VEO3ProjectApiService();
