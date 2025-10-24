import { ApiResponse } from "../../../../shared/types";
import { logger } from "../../../utils/logger-backend";
import {
  ComponentPromptConfigRepository,
  componentPromptConfigRepository,
  CreateConfigInput,
} from "../repository/component-prompt-config.repository";
import { promptRepository } from "../repository/master-prompt.repository";

export interface ComponentPromptConfig {
  id: string;
  componentName: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service for managing AI prompt configurations and execution
 */
export class AIPromptService {
  constructor(private configRepository: ComponentPromptConfigRepository = componentPromptConfigRepository) {}

  /**
   * Get configuration for a specific component
   */
  async getConfigForComponent(componentName: string): Promise<ApiResponse<ComponentPromptConfig>> {
    try {
      console.log(`[AIPromptService] getConfigForComponent called for: "${componentName}"`);
      const config = await this.configRepository.getByComponentName(componentName);
      console.log(`[AIPromptService] Repository returned:`, config);

      if (!config) {
        console.log(`[AIPromptService] No configuration found for component: "${componentName}"`);
        return {
          success: false,
          error: `No configuration found for component: ${componentName}`,
        };
      }

      console.log(`[AIPromptService] Returning config for: "${config.componentName}", promptId: ${config.promptId}`);
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[AIPromptService] Error getting config for ${componentName}:`, message);
      logger.error(`[AIPromptService] Failed to get config for ${componentName}:`, message);
      return {
        success: false,
        error: `Failed to get configuration: ${message}`,
      };
    }
  }

  /**
   * Get all component configurations
   */
  async getAllConfigs(): Promise<ApiResponse<ComponentPromptConfig[]>> {
    try {
      const configs = await this.configRepository.getAll();
      return {
        success: true,
        data: configs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptService] Failed to get all configs:", message);
      return {
        success: false,
        error: `Failed to get configurations: ${message}`,
      };
    }
  }

  /**
   * Save or update configuration for a component
   */
  async saveConfig(input: CreateConfigInput): Promise<ApiResponse<ComponentPromptConfig>> {
    try {
      // Verify prompt exists
      const prompt = await promptRepository.getById(input.promptId);
      if (!prompt) {
        return {
          success: false,
          error: `Prompt with ID ${input.promptId} not found`,
        };
      }

      const config = await this.configRepository.upsert(input);
      logger.info(`[AIPromptService] Saved config for ${input.componentName}:`, config);

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptService] Failed to save config:", message);
      return {
        success: false,
        error: `Failed to save configuration: ${message}`,
      };
    }
  }

  /**
   * Delete configuration for a component
   */
  async deleteConfig(componentName: string): Promise<ApiResponse<boolean>> {
    try {
      const deleted = await this.configRepository.deleteByComponentName(componentName);

      if (!deleted) {
        return {
          success: false,
          error: `No configuration found for component: ${componentName}`,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptService] Failed to delete config:", message);
      return {
        success: false,
        error: `Failed to delete configuration: ${message}`,
      };
    }
  }
}

// Singleton instance
export const aiPromptService = new AIPromptService();
