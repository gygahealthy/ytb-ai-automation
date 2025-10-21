import { ApiResponse } from "../../../../shared/types";
import { logger } from "../../../utils/logger-backend";
import {
  ComponentPromptConfigRepository,
  componentPromptConfigRepository,
  CreateConfigInput,
} from "../repository/component-prompt-config.repository";
import { promptRepository } from "../repository/master-prompt.repository";
import { sendChatMessage } from "../../gemini-apis/handlers/chat/sendChatMessage";
import { replaceTemplate } from "../../../../shared/utils/template-replacement.util";
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
  processedPrompt?: string;
  conversationContext?: { chatId?: string; replyId?: string; rcId?: string };
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
   * Respects occurrence config if provided (supports selective replacement)
   */
  private processPromptWithData(
    template: string,
    data: Record<string, any>,
    occurrenceConfig?: Record<string, number[]>
  ): string {
    // Delegate to shared template replacement util which normalizes keys to snake_case
    // With occurrence config, only selected occurrences are replaced
    return replaceTemplate(template, data || {}, occurrenceConfig);
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

      // 3. Resolve the final prompt to send
      // 'data' = user-supplied key-value pairs for placeholder replacement (e.g., { userName: "Alice" })
      // 'processedPrompt' (from caller) = pre-expanded template (renderer already replaced placeholders)
      // If caller provided processedPrompt, use it directly (efficiency + consistency).
      // Otherwise, process template server-side using shared replacer and caller's data.
      // Pass the variableOccurrenceConfig for selective replacement (if user selected specific occurrences)
      const callerProcessed = (request as any).processedPrompt;
      const processedPrompt = callerProcessed
        ? callerProcessed
        : this.processPromptWithData(
            prompt.promptTemplate,
            data || {},
            prompt.variableOccurrencesConfig || undefined
          );

      logger.info(
        `[AIPromptService] Processed prompt (first 200 chars): ${processedPrompt.substring(
          0,
          200
        )}...`
      );

      // 4. Call sendChatMessage with the final prompt
      logger.info(
        `[AIPromptService] Sending chat message for profile=${profileId} promptId=${
          config.promptId
        } model=${config.aiModel || "GEMINI_2_5_PRO"} promptLength=${
          processedPrompt?.length ?? 0
        }`
      );

      let aiResponse: ApiResponse<any>;
      try {
        aiResponse = await sendChatMessage({
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
          // include conversationContext if caller sent one (server will use it to load metadata)
          conversationContext: (request as any).conversationContext,
        });
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(
          "[AIPromptService] sendChatMessage threw an exception:",
          msg
        );
        return {
          success: false,
          error: `Failed to send chat message: ${msg}`,
        };
      }

      // Provide more actionable error message when token/cookie extraction fails
      if (!aiResponse.success && aiResponse.error) {
        const lower = String(aiResponse.error).toLowerCase();
        if (
          lower.includes("failed to extract gemini token") ||
          lower.includes("authentication cookies") ||
          lower.includes("cookies are expired")
        ) {
          aiResponse.error = `${aiResponse.error} \n\nSuggestion: open the Profiles tab, select the profile used for this request and click 'Extract Cookies'. If prompted, log into Gemini in the extracted browser session and retry.`;
        }
      }

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
