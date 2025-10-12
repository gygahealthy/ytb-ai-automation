import { ApiResponse } from "../../../../shared/types";
import { CreateVEO3ProjectInput, VEO3Project, VideoScene } from "../veo3.types";
import { veo3ProjectService } from "./veo3/veo3-project.service";
import { veo3VideoCreationService } from "./veo3/veo3-video-creation.service";

/**
 * VEO3 Service - Main Facade
 *
 * This service acts as a backward-compatible facade that delegates to:
 * - VEO3ProjectService: All project-related operations
 * - VEO3VideoCreationService: All video generation operations
 *
 * This allows existing code to continue working while keeping services focused and maintainable.
 */
export class VEO3Service {
  // ========================================
  // PROJECT OPERATIONS (delegated to VEO3ProjectService)
  // ========================================

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<ApiResponse<VEO3Project[]>> {
    return veo3ProjectService.getAllProjects();
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.getProjectById(id);
  }

  /**
   * Create new project
   */
  async createProject(input: CreateVEO3ProjectInput): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.createProject(input);
  }

  /**
   * Update project status
   */
  async updateProjectStatus(
    id: string,
    status: "draft" | "processing" | "completed" | "failed"
  ): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.updateProjectStatus(id, status);
  }

  /**
   * Add scene to project
   */
  async addScene(projectId: string, scene: Omit<VideoScene, "id">): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.addScene(projectId, scene);
  }

  /**
   * Remove scene from project
   */
  async removeScene(projectId: string, sceneId: string): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.removeScene(projectId, sceneId);
  }

  /**
   * Update JSON prompt
   */
  async updateJsonPrompt(projectId: string, jsonPrompt: Record<string, any>): Promise<ApiResponse<VEO3Project>> {
    return veo3ProjectService.updateJsonPrompt(projectId, jsonPrompt);
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<boolean>> {
    return veo3ProjectService.deleteProject(id);
  }

  /**
   * Fetch projects from VEO3 API using profile's cookies
   */
  async fetchProjectsFromAPI(profileId: string): Promise<ApiResponse<any[]>> {
    return veo3ProjectService.fetchProjectsFromAPI(profileId);
  }

  /**
   * Create a new project via VEO3 API using profile's cookies
   */
  async createProjectViaAPI(profileId: string, projectTitle: string): Promise<ApiResponse<any>> {
    return veo3ProjectService.createProjectViaAPI(profileId, projectTitle);
  }

  // ========================================
  // VIDEO CREATION OPERATIONS (delegated to VEO3VideoCreationService)
  // ========================================

  /**
   * Start video generation process
   */
  async startVideoGeneration(
    profileId: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE"
  ): Promise<ApiResponse<{ generationId: string; sceneId: string; operationName: string }>> {
    return veo3VideoCreationService.startVideoGeneration(profileId, projectId, prompt, aspectRatio);
  }

  /**
   * Check video generation status
   */
  async checkGenerationStatus(generationId: string): Promise<ApiResponse<any>> {
    return veo3VideoCreationService.checkGenerationStatus(generationId);
  }

  /**
   * Get all video generations (paginated)
   */
  async listGenerations(limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    return veo3VideoCreationService.listGenerations(limit, offset);
  }

  /**
   * Get video generations by profile
   */
  async listGenerationsByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    return veo3VideoCreationService.listGenerationsByProfile(profileId, limit, offset);
  }

  /**
   * Get video generation by ID
   */
  async getGenerationById(generationId: string): Promise<ApiResponse<any>> {
    return veo3VideoCreationService.getGenerationById(generationId);
  }

  /**
   * Manually refresh video status by checking the API
   */
  async refreshVideoStatus(operationName: string, generationId: string): Promise<ApiResponse<any>> {
    return veo3VideoCreationService.refreshVideoStatus(operationName, generationId);
  }
}

// Export singleton instance for backward compatibility
export const veo3Service = new VEO3Service();

// Also export the individual services for direct use
export { veo3ProjectService } from "./veo3/veo3-project.service";
export { veo3VideoCreationService } from "./veo3/veo3-video-creation.service";
