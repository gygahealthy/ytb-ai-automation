import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { StringUtil } from "../../../../../shared/utils/string";
import { profileRepository, veo3ProjectRepository } from "../../../../storage/database";
import { veo3ApiClient } from "../../apis/veo3-api.client";
import { CreateVEO3ProjectInput, VEO3Project, VideoScene } from "../../veo3.types";

const logger = new Logger("VEO3ProjectService");

/**
 * VEO3 Project Service
 * Handles all project-related operations (CRUD, API interactions)
 */
export class VEO3ProjectService {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<ApiResponse<VEO3Project[]>> {
    try {
      const projects = await veo3ProjectRepository.findAll();
      return { success: true, data: projects };
    } catch (error) {
      logger.error("Failed to get projects", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ApiResponse<VEO3Project>> {
    try {
      const project = await veo3ProjectRepository.findById(id);
      if (!project) {
        return { success: false, error: "Project not found" };
      }
      return { success: true, data: project };
    } catch (error) {
      logger.error("Failed to get project", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create new project
   */
  async createProject(input: CreateVEO3ProjectInput): Promise<ApiResponse<VEO3Project>> {
    try {
      // Generate IDs for scenes
      const scenes: VideoScene[] = input.scenes.map((scene) => ({
        ...scene,
        id: StringUtil.generateId("scene"),
      }));

      const project: VEO3Project = {
        id: StringUtil.generateId("veo3"),
        projectId: input.projectId,
        profileId: input.profileId,
        name: input.name,
        status: "draft",
        scenes,
        jsonPrompt: input.jsonPrompt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await veo3ProjectRepository.insert(project);
      logger.info(`VEO3 project created: ${project.id}`);

      return { success: true, data: project };
    } catch (error) {
      logger.error("Failed to create project", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(
    id: string,
    status: "draft" | "processing" | "completed" | "failed"
  ): Promise<ApiResponse<VEO3Project>> {
    try {
      if (!(await veo3ProjectRepository.exists(id))) {
        return { success: false, error: "Project not found" };
      }

      await veo3ProjectRepository.updateStatus(id, status);
      const updatedProject = await veo3ProjectRepository.findById(id);

      logger.info(`Project status updated: ${id} -> ${status}`);
      return { success: true, data: updatedProject! };
    } catch (error) {
      logger.error("Failed to update project status", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Add scene to project
   */
  async addScene(projectId: string, scene: Omit<VideoScene, "id">): Promise<ApiResponse<VEO3Project>> {
    try {
      const project = await veo3ProjectRepository.findById(projectId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }

      const newScene: VideoScene = {
        ...scene,
        id: StringUtil.generateId("scene"),
      };

      await veo3ProjectRepository.update(projectId, {
        scenes: [...project.scenes, newScene],
        updatedAt: new Date(),
      });

      const updatedProject = await veo3ProjectRepository.findById(projectId);
      return { success: true, data: updatedProject! };
    } catch (error) {
      logger.error("Failed to add scene", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Remove scene from project
   */
  async removeScene(projectId: string, sceneId: string): Promise<ApiResponse<VEO3Project>> {
    try {
      const project = await veo3ProjectRepository.findById(projectId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }

      await veo3ProjectRepository.update(projectId, {
        scenes: project.scenes.filter((s: any) => s.id !== sceneId),
        updatedAt: new Date(),
      });

      const updatedProject = await veo3ProjectRepository.findById(projectId);
      return { success: true, data: updatedProject! };
    } catch (error) {
      logger.error("Failed to remove scene", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update JSON prompt
   */
  async updateJsonPrompt(projectId: string, jsonPrompt: Record<string, any>): Promise<ApiResponse<VEO3Project>> {
    try {
      if (!(await veo3ProjectRepository.exists(projectId))) {
        return { success: false, error: "Project not found" };
      }

      await veo3ProjectRepository.update(projectId, {
        jsonPrompt,
        updatedAt: new Date(),
      });

      const updatedProject = await veo3ProjectRepository.findById(projectId);
      return { success: true, data: updatedProject! };
    } catch (error) {
      logger.error("Failed to update JSON prompt", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<boolean>> {
    try {
      if (!(await veo3ProjectRepository.exists(id))) {
        return { success: false, error: "Project not found" };
      }

      await veo3ProjectRepository.delete(id);
      logger.info(`Project deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete project", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Fetch projects from VEO3 API using profile's cookies
   * @param profileId - Profile ID to get cookies from
   */
  async fetchProjectsFromAPI(profileId: string): Promise<ApiResponse<any[]>> {
    try {
      // Get profile to retrieve cookies
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      if (!profile.cookies) {
        return { success: false, error: "Profile has no cookies. Please login first." };
      }

      if (!profile.isLoggedIn) {
        return { success: false, error: "Profile is not logged in. Please login first." };
      }

      // Check if cookies are expired
      if (profile.cookieExpires && new Date(profile.cookieExpires) < new Date()) {
        return { success: false, error: "Profile cookies have expired. Please login again." };
      }

      logger.info(`Fetching VEO3 projects for profile: ${profile.name}`);

      // Call VEO3 API to list projects
      const result = await veo3ApiClient.listProjects(profile.cookies);

      if (!result.success) {
        return { success: false, error: result.error || "Failed to fetch projects from VEO3 API" };
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
   * @param profileId - Profile ID to get cookies from
   * @param projectTitle - Title for the new project
   */
  async createProjectViaAPI(profileId: string, projectTitle: string): Promise<ApiResponse<any>> {
    try {
      // Get profile to retrieve cookies
      const profile = await profileRepository.findById(profileId);
      if (!profile) {
        return { success: false, error: "Profile not found" };
      }

      if (!profile.cookies) {
        return { success: false, error: "Profile has no cookies. Please login first." };
      }

      if (!profile.isLoggedIn) {
        return { success: false, error: "Profile is not logged in. Please login first." };
      }

      // Check if cookies are expired
      if (profile.cookieExpires && new Date(profile.cookieExpires) < new Date()) {
        return { success: false, error: "Profile cookies have expired. Please login again." };
      }

      logger.info(`Creating VEO3 project "${projectTitle}" for profile: ${profile.name}`);

      // Call VEO3 API to create project
      const result = await veo3ApiClient.createProject(profile.cookies, projectTitle);

      if (!result.success) {
        return { success: false, error: result.error || "Failed to create project via VEO3 API" };
      }

      logger.info(`Successfully created VEO3 project: ${result.data?.projectId}`);
      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to create project via API", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3ProjectService = new VEO3ProjectService();
