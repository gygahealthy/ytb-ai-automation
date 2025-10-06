import { veo3Repository } from "../../../../storage/database";
import { ApiResponse,  } from "../../../../types";
import { Logger } from "../../../../utils/logger.util";
import { StringUtil } from "../../../../utils/string.util";
import { CreateVEO3ProjectInput, VEO3Project, VideoScene } from "../veo3.types";

const logger = new Logger("VEO3Service");

export class VEO3Service {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<ApiResponse<VEO3Project[]>> {
    try {
      const projects = await veo3Repository.findAll();
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
      const project = await veo3Repository.findById(id);
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

      await veo3Repository.insert(project);
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
      if (!(await veo3Repository.exists(id))) {
        return { success: false, error: "Project not found" };
      }

      await veo3Repository.updateStatus(id, status);
      const updatedProject = await veo3Repository.findById(id);

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
      const project = await veo3Repository.findById(projectId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }

      const newScene: VideoScene = {
        ...scene,
        id: StringUtil.generateId("scene"),
      };

      await veo3Repository.update(projectId, {
        scenes: [...project.scenes, newScene],
        updatedAt: new Date(),
      });

      const updatedProject = await veo3Repository.findById(projectId);
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
      const project = await veo3Repository.findById(projectId);
      if (!project) {
        return { success: false, error: "Project not found" };
      }

      await veo3Repository.update(projectId, {
        scenes: project.scenes.filter((s) => s.id !== sceneId),
        updatedAt: new Date(),
      });

      const updatedProject = await veo3Repository.findById(projectId);
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
      if (!(await veo3Repository.exists(projectId))) {
        return { success: false, error: "Project not found" };
      }

      await veo3Repository.update(projectId, {
        jsonPrompt,
        updatedAt: new Date(),
      });

      const updatedProject = await veo3Repository.findById(projectId);
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
      if (!(await veo3Repository.exists(id))) {
        return { success: false, error: "Project not found" };
      }

      await veo3Repository.delete(id);
      logger.info(`Project deleted: ${id}`);
      return { success: true, data: true };
    } catch (error) {
      logger.error("Failed to delete project", error);
      return { success: false, error: String(error) };
    }
  }
}

export const veo3Service = new VEO3Service();
