import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { StringUtil } from "../../../../../shared/utils/string";
import { veo3ProjectRepository } from "../repository/veo3-project.repository";
import { CreateVEO3ProjectInput, VEO3Project, VideoScene } from "../veo3.types";

const logger = new Logger("VideoProjectService");

/**
 * VEO3 Project Service
 * Handles all project-related operations (CRUD, API interactions)
 */
export class VideoProjectService {
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
  // API methods moved to `veo3-project-api.service.ts` to separate concerns
}

export const videoProjectService = new VideoProjectService();
