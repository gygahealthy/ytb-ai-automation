import { ApiResponse } from "../../../../shared/types";
import { logger } from "../../../utils/logger-backend";
import {
  ComponentPromptConfigRepository,
  componentPromptConfigRepository,
  CreateConfigInput,
} from "../repository/component-prompt-config.repository";
import { promptRepository } from "../repository/master-prompt.repository";
import { sendChatMessage } from "../../gemini-apis/handlers/chat/sendChatMessage";
import {
  GEMINI_CHAT_NORMAL_MODE_EPHEMERAL,
  GEMINI_CHAT_NORMAL_MODE_PERSISTENT,
  GEMINI_CHAT_TEMPORARY_MODE,
} from "../../../../shared/constants/gemini-chat.constants";

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

export interface AIPromptCallRequest {
  componentName: string;
  profileId: string;
  data: Record<string, any>;
  stream?: boolean;
  requestId?: string;
}

/**
 * Service for managing AI prompt configurations and execution
 */
export class AIPromptService {
  constructor(
    private configRepository: ComponentPromptConfigRepository = componentPromptConfigRepository
  ) {}

  /**
   * Get configuration for a specific component
   */
  async getConfigForComponent(
    componentName: string
  ): Promise<ApiResponse<ComponentPromptConfig>> {
    try {
      const config = await this.configRepository.getByComponentName(
        componentName
      );

      if (!config) {
        return {
          success: false,
          error: `No configuration found for component: ${componentName}`,
        };
      }

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        `[AIPromptService] Failed to get config for ${componentName}:`,
        message
      );
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
  async saveConfig(
    input: CreateConfigInput
  ): Promise<ApiResponse<ComponentPromptConfig>> {
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
      logger.info(
        `[AIPromptService] Saved config for ${input.componentName}:`,
        config
      );

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
      const deleted = await this.configRepository.deleteByComponentName(
        componentName
      );

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

  /**
   * Process prompt template with data
   * Replaces placeholders like {key} or [key] with actual values from data
   */
  private processPromptWithData(
    template: string,
    data: Record<string, any>
  ): string {
    let processed = template;

    // Create a lowercase key map for case-insensitive matching
    const lowerKeyMap: Record<string, string> = {};
    Object.keys(data).forEach((key) => {
      lowerKeyMap[key.toLowerCase()] = key;
    });

    // Replace {key} placeholders
    processed = processed.replace(/\{([^}]+)\}/g, (match, key) => {
      const trimmedKey = key.trim();
      const lowerKey = trimmedKey.toLowerCase();
      const actualKey = lowerKeyMap[lowerKey];

      if (actualKey && data[actualKey] !== undefined) {
        const value = data[actualKey];
        return typeof value === "string" ? value : JSON.stringify(value);
      }

      logger.warn(
        `[AIPromptService] Placeholder {${trimmedKey}} not found in data`
      );
      return match; // Keep original placeholder if not found
    });

    // Replace [key] placeholders
    processed = processed.replace(/\[([^\]]+)\]/g, (match, key) => {
      const trimmedKey = key.trim();
      const lowerKey = trimmedKey.toLowerCase();
      const actualKey = lowerKeyMap[lowerKey];

      if (actualKey && data[actualKey] !== undefined) {
        const value = data[actualKey];
        return typeof value === "string" ? value : JSON.stringify(value);
      }

      logger.warn(
        `[AIPromptService] Placeholder [${trimmedKey}] not found in data`
      );
      return match; // Keep original placeholder if not found
    });

    return processed;
  }

  /**
   * Call AI with prompt for a specific component
   */
  async callAIWithPrompt(
    request: AIPromptCallRequest
  ): Promise<ApiResponse<any>> {
    try {
      const { componentName, profileId, data, stream, requestId } = request;

      logger.info(
        `[AIPromptService] Calling AI for component: ${componentName}`
      );

      // 1. Get configuration for component
      const configResult = await this.getConfigForComponent(componentName);
      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error:
            configResult.error ||
            `No configuration found for component: ${componentName}`,
        };
      }

      const config = configResult.data;

      // Check if config is enabled
      if (config.enabled === false) {
        return {
          success: false,
          error: `AI prompt is disabled for component: ${componentName}`,
        };
      }

      // 2. Get the actual prompt template
      const prompt = await promptRepository.getById(config.promptId);
      if (!prompt) {
        return {
          success: false,
          error: `Prompt with ID ${config.promptId} not found`,
        };
      }

      logger.info(
        `[AIPromptService] Found prompt: ${prompt.provider} (ID: ${prompt.id})`
      );

      // 3. Process the prompt template with data
      const processedPrompt = this.processPromptWithData(
        prompt.promptTemplate,
        data
      );

      logger.info(
        `[AIPromptService] Processed prompt (first 200 chars): ${processedPrompt.substring(
          0,
          200
        )}...`
      );

      // 4. Call sendChatMessage with the final prompt
      const aiResponse = await sendChatMessage({
        profileId,
        prompt: processedPrompt,
        stream: stream || false,
        requestId: requestId,
        model: config.aiModel || "GEMINI_2_5_PRO",
        mode:
          config.useTempChat === true
            ? GEMINI_CHAT_TEMPORARY_MODE
            : config.keepContext === true
            ? GEMINI_CHAT_NORMAL_MODE_PERSISTENT
            : GEMINI_CHAT_NORMAL_MODE_EPHEMERAL,
      });

      logger.info(
        `[AIPromptService] AI response received, success: ${aiResponse.success}`
      );

      return aiResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptService] Failed to call AI:", message);
      return {
        success: false,
        error: `Failed to call AI: ${message}`,
      };
    }
  }
}

// Singleton instance
export const aiPromptService = new AIPromptService();
