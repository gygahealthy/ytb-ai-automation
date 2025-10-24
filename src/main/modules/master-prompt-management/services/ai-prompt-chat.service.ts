import { logger } from "../../../utils/logger-backend";
import { sendChatMessage } from "../../gemini-apis/handlers/chat/sendChatMessage";
import { GEMINI_CHAT_NORMAL_MODE_EPHEMERAL, type GeminiChatMode } from "../../../../shared/constants/gemini-chat.constants";
import { promptRepository } from "../repository/master-prompt.repository";
import { replaceTemplate } from "../../../../shared/utils/template-replacement.util";

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
  profileId: string;
  data: Record<string, any>;
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
    request: AIPromptCallRequest,
    getConfigForComponent: (componentName: string) => Promise<any>
  ): Promise<any> {
    try {
      const { componentName, profileId, data, stream, requestId } = request;

      logger.info(`[AIPromptChatService] Calling AI for component: ${componentName}`);

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

      // 2. Get the actual prompt template
      const prompt = await promptRepository.getById(config.promptId);
      if (!prompt) {
        return {
          success: false,
          error: `Prompt with ID ${config.promptId} not found`,
        };
      }

      logger.info(`[AIPromptChatService] Found prompt: ${prompt.provider} (ID: ${prompt.id})`);

      // 3. Resolve the final prompt to send
      // 'data' = user-supplied key-value pairs for placeholder replacement (e.g., { userName: "Alice" })
      // 'processedPrompt' (from caller) = pre-expanded template (renderer already replaced placeholders)
      // If caller provided processedPrompt, use it directly (efficiency + consistency).
      // Otherwise, process template server-side using shared replacer and caller's data.
      // Pass the variableOccurrenceConfig for selective replacement (if user selected specific occurrences)
      const callerProcessed = (request as any).processedPrompt;
      const processedPrompt = callerProcessed
        ? callerProcessed
        : this.processPromptWithData(prompt.promptTemplate, data || {}, prompt.variableOccurrencesConfig || undefined);

      logger.info(`[AIPromptChatService] Processed prompt (first 200 chars): ${processedPrompt.substring(0, 200)}...`);

      // 4. Call sendChatMessage with the final prompt
      logger.info(
        `[AIPromptChatService] Sending chat message for profile=${profileId} promptId=${config.promptId} model=${
          config.aiModel || "GEMINI_2_5_PRO"
        } promptLength=${processedPrompt?.length ?? 0}`
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

      // Use the AI chat service which handles fallback logic
      const aiResponse = await this.sendChatWithFallback({
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

      logger.info(`[AIPromptChatService] AI response received, success: ${aiResponse.success}`);

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
