import { ApiResponse } from "../../../../../shared/types";
import { BatchProgressCallback, veo3BatchGenerationService } from "./veo3-apis/veo3-batch-generation.service";
import { veo3StatusCheckerService } from "./veo3-apis/veo3-status-checker.service";
import { veo3VideoCreationService } from "./veo3-apis/veo3-video-creation.service";
import { veo3ImageToVideoService, ImageReference } from "./veo3-apis/veo3-image-to-video.service";

/**
 * VEO3 Service - Main Facade
 *
 * This service acts as a backward-compatible facade that delegates to specialized services:
 * - VideoProjectService: All project-related operations
 * - VEO3VideoCreationService: Single video generation operations
 * - VEO3BatchGenerationService: Multiple video generation operations
 * - VEO3StatusCheckerService: Video status checking and refreshing
 * - VEO3VideoHistoryService: Video history with pagination and filtering
 *
 * This allows existing code to continue working while keeping services focused and maintainable.
 */
export class FlowVeo3ApiService {
  // ========================================
  // VIDEO CREATION OPERATIONS
  // ========================================

  /**
   * Start video generation process (single video from text prompt)
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
   * Generate video from reference images (1-3 images)
   */
  async generateVideoFromImages(
    profileId: string,
    projectId: string,
    prompt: string,
    imageReferences: ImageReference[],
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE",
    model: string = "veo_3_0_r2v_fast_ultra"
  ): Promise<ApiResponse<{ generationId: string; sceneId: string; operationName: string }>> {
    return veo3ImageToVideoService.generateVideoFromImages(profileId, projectId, prompt, imageReferences, aspectRatio, model);
  }

  // ========================================
  // STATUS CHECKING OPERATIONS (delegated to VEO3StatusCheckerService)
  // ========================================

  /**
   * Check video generation status
   */
  async checkGenerationStatus(generationId: string): Promise<ApiResponse<any>> {
    return veo3StatusCheckerService.checkGenerationStatus(generationId);
  }

  /**
   * Get all video generations (paginated)
   */
  async listGenerations(limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    return veo3StatusCheckerService.listGenerations(limit, offset);
  }

  /**
   * Get video generations by profile
   */
  async listGenerationsByProfile(profileId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<any[]>> {
    return veo3StatusCheckerService.listGenerationsByProfile(profileId, limit, offset);
  }

  /**
   * Get video generation by ID
   */
  async getGenerationById(generationId: string): Promise<ApiResponse<any>> {
    return veo3StatusCheckerService.getGenerationById(generationId);
  }

  /**
   * Manually refresh video status by checking the API
   */
  async refreshVideoStatus(operationName: string, generationId: string): Promise<ApiResponse<any>> {
    return veo3StatusCheckerService.refreshVideoStatus(operationName, generationId);
  }

  // ========================================
  // BATCH GENERATION OPERATIONS (delegated to VEO3BatchGenerationService)
  // ========================================

  /**
   * Generate multiple videos with delay between each request (blocking)
   */
  async generateMultipleVideos(
    requests: Array<{
      profileId: string;
      projectId: string;
      prompt: string;
      aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
    }>,
    delayMs?: number
  ): Promise<
    ApiResponse<
      Array<{
        success: boolean;
        generationId?: string;
        sceneId?: string;
        operationName?: string;
        error?: string;
        prompt: string;
      }>
    >
  > {
    return veo3BatchGenerationService.generateMultipleVideosSync(requests, delayMs);
  }

  /**
   * Generate multiple videos async with delay between each request (non-blocking)
   */
  async generateMultipleVideosAsync(
    requests: Array<{
      promptId: string;
      profileId: string;
      projectId: string;
      prompt: string;
      aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
    }>,
    delayMs?: number,
    onProgress?: BatchProgressCallback
  ): Promise<ApiResponse<{ batchId: string; total: number }>> {
    return veo3BatchGenerationService.generateMultipleVideosAsync(requests, delayMs, onProgress);
  }
}

// Export singleton instance for backward compatibility
export const flowVeo3ApiService = new FlowVeo3ApiService();
