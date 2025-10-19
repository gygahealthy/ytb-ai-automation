import { ipcMain } from "electron";
import { aiPromptService } from "../services/ai-prompt.service";
import { logger } from "../../../utils/logger-backend";
import {
  AIPromptCallRequest,
  SaveConfigRequest,
} from "../../../../shared/types";

/**
 * Register AI Prompt IPC handlers
 */
export function registerAIPromptHandlers() {
  /**
   * Get configuration for a specific component
   */
  ipcMain.handle(
    "aiPrompt:getConfig",
    async (_event, componentName: string) => {
      try {
        logger.info(
          `[aiPrompt:getConfig] Getting config for: ${componentName}`
        );
        return await aiPromptService.getConfigForComponent(componentName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("[aiPrompt:getConfig] Error:", message);
        return {
          success: false,
          error: `Failed to get configuration: ${message}`,
        };
      }
    }
  );

  /**
   * Get all component configurations
   */
  ipcMain.handle("aiPrompt:getAllConfigs", async () => {
    try {
      logger.info("[aiPrompt:getAllConfigs] Getting all configurations");
      return await aiPromptService.getAllConfigs();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("[aiPrompt:getAllConfigs] Error:", message);
      return {
        success: false,
        error: `Failed to get configurations: ${message}`,
      };
    }
  });

  /**
   * Save or update configuration
   */
  ipcMain.handle(
    "aiPrompt:saveConfig",
    async (_event, request: SaveConfigRequest) => {
      try {
        logger.info(
          `[aiPrompt:saveConfig] Saving config for: ${request.componentName}`
        );
        return await aiPromptService.saveConfig({
          componentName: request.componentName,
          promptId: request.promptId,
          aiModel: request.aiModel,
          enabled: request.enabled,
          profileId: request.profileId,
          useTempChat: request.useTempChat,
          keepContext: request.keepContext,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("[aiPrompt:saveConfig] Error:", message);
        return {
          success: false,
          error: `Failed to save configuration: ${message}`,
        };
      }
    }
  );

  /**
   * Delete configuration
   */
  ipcMain.handle(
    "aiPrompt:deleteConfig",
    async (_event, componentName: string) => {
      try {
        logger.info(
          `[aiPrompt:deleteConfig] Deleting config for: ${componentName}`
        );
        return await aiPromptService.deleteConfig(componentName);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("[aiPrompt:deleteConfig] Error:", message);
        return {
          success: false,
          error: `Failed to delete configuration: ${message}`,
        };
      }
    }
  );

  /**
   * Call AI with prompt
   */
  ipcMain.handle(
    "aiPrompt:callAI",
    async (_event, request: AIPromptCallRequest) => {
      try {
        logger.info(
          `[aiPrompt:callAI] Calling AI for component: ${request.componentName}`
        );
        return await aiPromptService.callAIWithPrompt(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("[aiPrompt:callAI] Error:", message);
        return {
          success: false,
          error: `Failed to call AI: ${message}`,
        };
      }
    }
  );

  logger.info("[aiPrompt] AI Prompt handlers registered");
}
