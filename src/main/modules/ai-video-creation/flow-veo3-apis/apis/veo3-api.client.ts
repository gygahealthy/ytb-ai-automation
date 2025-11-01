import { extractBearerToken } from "../helpers/veo3-headers.helper";
import { veo3ProjectApiClient } from "./veo3/veo3-project-api.client";
import { veo3VideoApiClient } from "./veo3/veo3-video-api.client";

/**
 * VEO3 API Client - Main Facade
 *
 * This client acts as a backward-compatible facade that delegates to:
 * - extractBearerToken: Authentication and token management
 * - VEO3ProjectApiClient: Project CRUD operations
 * - VEO3VideoApiClient: Video generation and status checking
 *
 * This allows existing code to continue working while keeping API clients focused and maintainable.
 */
export class VEO3ApiClient {
  // ========================================
  // PROJECT OPERATIONS (delegated to VEO3ProjectApiClient)
  // ========================================

  /**
   * List user projects from VEO3
   */
  async listProjects(
    cookie: string,
    pageSize: number = 20,
    cursor: string | null = null
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return veo3ProjectApiClient.listProjects(cookie, pageSize, cursor);
  }

  /**
   * Create a new VEO3 project
   */
  async createProject(
    cookie: string,
    projectTitle: string,
    toolName: string = "PINHOLE"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return veo3ProjectApiClient.createProject(cookie, projectTitle, toolName);
  }

  /**
   * Update a VEO3 project title
   */
  async updateProjectTitle(
    cookie: string,
    projectId: string,
    projectTitle: string,
    toolName: string = "PINHOLE"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return veo3ProjectApiClient.updateProjectTitle(cookie, projectId, projectTitle, toolName);
  }

  // ========================================
  // AUTHENTICATION OPERATIONS
  // ========================================

  /**
   * Extract Bearer token from Flow page HTML
   */
  async extractBearerToken(cookie: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return extractBearerToken(cookie);
  }

  /**
   * Validate cookie by attempting to list projects
   */
  async validateCookie(cookie: string): Promise<boolean> {
    return veo3ProjectApiClient.validateCookie(cookie);
  }

  // ========================================
  // VIDEO OPERATIONS (delegated to VEO3VideoApiClient)
  // ========================================

  /**
   * Generate video from text prompt using VEO3 API
   */
  async generateVideo(
    bearerToken: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE",
    model: string = "veo_3_1_t2v_fast_ultra"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; seed?: number; error?: string }> {
    return veo3VideoApiClient.generateVideo(bearerToken, projectId, prompt, aspectRatio, model);
  }

  /**
   * Check video generation status
   */
  async checkVideoStatus(
    bearerToken: string,
    operationName: string,
    sceneId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return veo3VideoApiClient.checkVideoStatus(bearerToken, operationName, sceneId);
  }

  /**
   * Upscale a generated video to higher resolution (1080p)
   */
  async upscaleVideo(
    bearerToken: string,
    sourceMediaId: string,
    sourceAspectRatio: string,
    sourceSeed?: number,
    model: string = "veo_2_1080p_upsampler_8s"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; error?: string }> {
    return veo3VideoApiClient.upscaleVideo(bearerToken, sourceMediaId, sourceAspectRatio, sourceSeed, model);
  }

  /**
   * Check upscale status
   */
  async checkUpscaleStatus(
    bearerToken: string,
    operationName: string,
    sceneId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return veo3VideoApiClient.checkUpscaleStatus(bearerToken, operationName, sceneId);
  }
}

// Export singleton instance for backward compatibility
export const veo3ApiClient = new VEO3ApiClient();

// Also export the individual API clients for direct use
export { veo3ProjectApiClient } from "./veo3/veo3-project-api.client";
export { veo3VideoApiClient } from "./veo3/veo3-video-api.client";
