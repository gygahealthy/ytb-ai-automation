import { logger } from "../../../utils/logger-backend";
import { sendChatMessage } from "../../gemini-apis/handlers/chat/sendChatMessage";
import { GEMINI_CHAT_NORMAL_MODE_EPHEMERAL, type GeminiChatMode } from "../../../../shared/constants/gemini-chat.constants";
import { promptRepository } from "../repository/master-prompt.repository";
import { replaceTemplateArray } from "../../../../shared/utils/template-replacement.util";

export interface AIChatRequest {
  profileId: string;
  prompt: string;
  stream?: boolean;
  requestId?: string;
  model?: string;
  mode?: GeminiChatMode | "stateless" | "persistent";
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
}

export interface AIPromptCallRequest {
  componentName: string;
  dataArray: string[];
  stream?: boolean;
  requestId?: string;
  processedPrompt?: string;
  conversationContext?: { chatId?: string; replyId?: string; rcId?: string };
}

export interface AIChatResponse {
  success: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Service for handling AI chat operations with fallback model support
 */
export class AIPromptChatService {
  private readonly primaryModel = "GEMINI_2_5_PRO";
  private readonly fallbackModel = "GEMINI_2_5_FLASH";

  /**
   * Handles retry logic for AI calls when primary model fails with error 1052
   * @param sendFn Function that sends the chat message
   * @param primaryModel The primary model to try first
   * @param fallbackModel The fallback model to use if primary fails
   * @returns API response from either successful attempt or both failures
   */
  private async handleAICallWithFallback(
    sendFn: (model: string) => Promise<any>,
    primaryModel: string,
    fallbackModel: string
  ): Promise<AIChatResponse> {
    try {
      const primaryResponse = await sendFn(primaryModel);

      // Check if response indicates model is not available (error 1052)
      if (!primaryResponse.success && primaryResponse.error) {
        const errorMsg = String(primaryResponse.error);
        if (errorMsg.includes("1052") && primaryModel !== fallbackModel) {
          logger.warn(`[AIPromptChatService] Model ${primaryModel} returned error 1052, retrying with ${fallbackModel}...`);

          const fallbackResponse = await sendFn(fallbackModel);
          if (fallbackResponse.success) {
            logger.info(`[AIPromptChatService] Fallback model ${fallbackModel} succeeded`);
            return fallbackResponse;
          }

          // Both failed - return a user-friendly error with cookie hint
          return this.createError1052Response();
        }

        return primaryResponse;
      }

      return primaryResponse;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[AIPromptChatService] sendChatMessage threw an exception:", msg);

      // If error contains 1052, try fallback
      if (msg.includes("1052") && primaryModel !== fallbackModel) {
        logger.warn(`[AIPromptChatService] Got error 1052, retrying with fallback model ${fallbackModel}...`);

        try {
          const fallbackResponse = await sendFn(fallbackModel);
          if (fallbackResponse.success) {
            logger.info(`[AIPromptChatService] Fallback model ${fallbackModel} succeeded after exception`);
            return fallbackResponse;
          }

          // Both failed
          return this.createError1052Response();
        } catch (fallbackErr: any) {
          logger.error(
            "[AIPromptChatService] Fallback model also failed:",
            fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          );
          return this.createError1052Response();
        }
      } else {
        return {
          success: false,
          error: `Failed to send chat message: ${msg}`,
        };
      }
    }
  }

  /**
   * Send a chat message with automatic fallback to alternative model on error 1052
   * @param request The chat request containing profile, prompt, and configuration
   * @returns Response from the AI service
   */
  async sendChatWithFallback(request: AIChatRequest): Promise<AIChatResponse> {
    const model = request.model || this.primaryModel;
    return this.handleAICallWithFallback(
      async (selectedModel: string) => this.sendChat({ ...request, model: selectedModel }),
      model,
      this.fallbackModel
    );
  }

  /**
   * Internal method to send a single chat message
   * @param request The chat request
   * @returns Response from sendChatMessage
   */
  private async sendChat(request: AIChatRequest): Promise<AIChatResponse> {
    try {
      const response = await sendChatMessage({
        profileId: request.profileId,
        prompt: request.prompt,
        stream: request.stream || false,
        requestId: request.requestId,
        model: request.model || this.primaryModel,
        mode: request.mode || GEMINI_CHAT_NORMAL_MODE_EPHEMERAL,
        conversationContext: request.conversationContext,
      });

      return response;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptChatService] Failed to send chat:", message);
      throw error;
    }
  }

  /**
   * Creates a standardized error 1052 response with user-friendly guidance
   */
  private createError1052Response(): AIChatResponse {
    return {
      success: false,
      error: `API Error 1052: Account access issue or model not available. This could be due to rate limiting, region restrictions, or expired credentials.\n\nAction required: Please open the Profiles tab, select this profile, and click 'Extract Cookies' to refresh your authentication. If prompted, log into Gemini in the extracted browser session and retry.`,
    };
  }

  /**
   * Process prompt template with array values
   * Replaces placeholders using array-based position mapping
   * More efficient when values are provided in a specific order
   *
   * @param template - Template string with variables
   * @param values - Array of replacement values in order
   * @param occurrenceConfig - Mapping of variable names to occurrence indices
   * @returns Template with variables replaced by array values
   */
  private processPromptWithArray(template: string, values: string[], occurrenceConfig?: Record<string, number[]>): string {
    if (!occurrenceConfig) {
      return template;
    }
    // Delegate to array-based template replacement util
    // This uses position-based mapping without key normalization overhead
    return replaceTemplateArray(template, values, occurrenceConfig);
  }

  /**
   * Call AI with prompt for a specific component
   * Uses array-based replacement for efficient position-based value mapping
   */
  async callAIWithPrompt(
    request: AIPromptCallRequest,
    getConfigForComponent: (componentName: string) => Promise<any>
  ): Promise<any> {
    try {
      const { componentName, dataArray, stream, requestId } = request;

      // 1. Get configuration for component
      const configResult = await getConfigForComponent(componentName);
      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || `No configuration found for component: ${componentName}`,
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

      // Use profileId from config, not from request
      const profileId = config.profileId || "default";

      // 2. Get the actual prompt template
      const prompt = await promptRepository.getById(config.promptId);
      if (!prompt) {
        return {
          success: false,
          error: `Prompt with ID ${config.promptId} not found`,
        };
      }

      // 3. Resolve the final prompt to send
      // Use array-based replacement for efficient position-based mapping
      // If caller provided processedPrompt, use it directly (efficiency + consistency).
      // Otherwise, process template server-side using array-based replacement
      const callerProcessed = (request as any).processedPrompt;
      let processedPrompt: string;

      if (callerProcessed) {
        processedPrompt = callerProcessed;
      } else if (dataArray && prompt.variableOccurrencesConfig) {
        // Use array-based replacement
        processedPrompt = this.processPromptWithArray(
          prompt.promptTemplate,
          dataArray,
          prompt.variableOccurrencesConfig || undefined
        );
      } else {
        // No dataArray or config provided - return template as-is or with basic replacement
        logger.warn(`[AIPromptChatService] No dataArray or variableOccurrencesConfig provided for component=${componentName}`);
        processedPrompt = prompt.promptTemplate;
      }

      // 4. Call sendChatMessage with the final prompt
      logger.info(
        `[AIPromptChatService] Sending chat for component=${componentName}, profile=${profileId}, model=${
          config.aiModel || "GEMINI_2_5_PRO"
        }`
      );

      const primaryModel = config.aiModel || "GEMINI_2_5_PRO";

      // Determine the chat mode based on config
      let chatMode: string;
      if (config.useTempChat === true) {
        chatMode = "temporary";
      } else if (config.keepContext === true) {
        chatMode = "persistent";
      } else {
        chatMode = "stateless";
      }

      // TODO: Fallback logic will be implemented later
      // Use the AI chat service which handles fallback logic
      // const aiResponse = await this.sendChatWithFallback({
      //   profileId,
      //   prompt: processedPrompt,
      //   stream: stream || false,
      //   requestId: requestId,
      //   model: primaryModel,
      //   mode: chatMode as any,
      //   conversationContext: (request as any).conversationContext,
      // });

      // Direct call without fallback for now
      const aiResponse = await this.sendChat({
        profileId,
        prompt: processedPrompt,
        stream: stream || false,
        requestId: requestId,
        model: primaryModel,
        mode: chatMode as any,
        conversationContext: (request as any).conversationContext,
      });

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

      return aiResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[AIPromptChatService] Failed to call AI:", message);
      return {
        success: false,
        error: `Failed to call AI: ${message}`,
      };
    }
  }
}

// Singleton instance
export const aiChatService = new AIPromptChatService();
