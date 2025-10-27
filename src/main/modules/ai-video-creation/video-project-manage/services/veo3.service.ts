import { ApiResponse } from "../../../../../shared/types";
import { CreateVEO3ProjectInput, VEO3Project, VideoScene } from "../veo3.types";
import { veo3ProjectService } from "./veo3-project.service";
import { veo3VideoHistoryService, VideoHistoryFilter, PaginatedVideoHistory } from "./veo3-video-history.service";

/**
 * VEO3 Service - Main Facade
 *
 * This service acts as a backward-compatible facade that delegates to specialized services:
 * - VEO3ProjectService: All project-related operations
 * - VEO3VideoCreationService: Single video generation operations
 * - VEO3BatchGenerationService: Multiple video generation operations
 * - VEO3StatusCheckerService: Video status checking and refreshing
 * - VEO3VideoHistoryService: Video history with pagination and filtering
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
  // VIDEO HISTORY OPERATIONS (delegated to VEO3VideoHistoryService)
  // ========================================

  /**
   * Get paginated video history with optional filtering
   */
  async getVideoHistory(
    page: number = 1,
    pageSize: number = 20,
    filter?: VideoHistoryFilter
  ): Promise<ApiResponse<PaginatedVideoHistory>> {
    return veo3VideoHistoryService.getVideoHistory(page, pageSize, filter);
  }

  /**
   * Get video history grouped by date for UI display
   */
  async getVideoHistoryGroupedByDate(
    page: number = 1,
    pageSize: number = 20,
    filter?: VideoHistoryFilter
  ): Promise<ApiResponse<any>> {
    return veo3VideoHistoryService.getVideoHistoryGroupedByDate(page, pageSize, filter);
  }

  /**
   * Get status counts for all videos
   */
  async getStatusCounts(profileId?: string): Promise<ApiResponse<any>> {
    return veo3VideoHistoryService.getStatusCounts(profileId);
  }
}

// Export singleton instance for backward compatibility
export const veo3Service = new VEO3Service();

// Also export the individual services for direct use
export { veo3ProjectService } from "./veo3-project.service";
export { veo3VideoCreationService } from "../../flow-veo3-apis/services/veo3-apis/veo3-video-creation.service";
export { veo3BatchGenerationService } from "../../flow-veo3-apis/services/veo3-apis/veo3-batch-generation.service";
export { veo3StatusCheckerService } from "../../flow-veo3-apis/services/veo3-apis/veo3-status-checker.service";
export { veo3VideoHistoryService } from "./veo3-video-history.service";
export { veo3PollingService } from "../../flow-veo3-apis/services/veo3-apis/veo3-polling.service";
