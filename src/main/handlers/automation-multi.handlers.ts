import { ipcMain } from 'electron';
import { Logger } from '../../utils/logger.util';
import { automationCoordinator } from '../../services/automation/automation-coordinator';
import { instanceManager } from '../../services/automation/instance-manager';
import { LaunchInstanceRequest, ChatMessage } from '../../types/automation.types';

const logger = new Logger('AutomationHandlers');

export function registerAutomationHandlers() {
  /**
   * Launch a new automation instance
   */
  ipcMain.handle('automation:launch', async (_event, request: LaunchInstanceRequest) => {
    try {
      logger.info(`Launching automation instance for profile ${request.profileId}`);
      const result = await automationCoordinator.launchInstance(request);
      return result;
    } catch (error) {
      logger.error('Error launching instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Stop an automation instance (multi-instance specific channel)
   */
  ipcMain.handle('automation:stopInstance', async (_event, instanceId: string) => {
    try {
      logger.info(`Stopping instance ${instanceId}`);
      const success = await automationCoordinator.stopInstance(instanceId);
      // ensure chat history is removed when instance stops
      try {
        const inst = instanceManager.getInstance(instanceId);
        if (inst && inst.chatHistory) {
          instanceManager.updateInstanceState(instanceId, { chatHistory: [] });
        }
      } catch (e) {
        logger.debug('Failed to clear chat history on stop', e);
      }
      return { success };
    } catch (error) {
      logger.error('Error stopping instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Stop all automation instances
   */
  ipcMain.handle('automation:stopAll', async (_event) => {
    try {
      logger.info('Stopping all instances');
      await automationCoordinator.stopAll();
      return { success: true };
    } catch (error) {
      logger.error('Error stopping all instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Get all automation instances (multi-instance specific)
   */
  ipcMain.handle('automation:getInstances', async (_event) => {
    try {
      const instances = instanceManager.getAllInstances();
      return { success: true, data: instances };
    } catch (error) {
      logger.error('Error getting instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Get automation instance by ID (multi-instance specific)
   */
  ipcMain.handle('automation:getInstance', async (_event, instanceId: string) => {
    try {
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) {
        return { success: false, error: 'Instance not found' };
      }
      return { success: true, data: instance };
    } catch (error) {
      logger.error('Error getting instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Send message to chat automation instance
   */
  ipcMain.handle('automation:sendMessage', async (_event, instanceId: string, message: string) => {
    try {
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) {
        return { success: false, error: 'Instance not found' };
      }

      if (instance.automationType === 'chat' && instance.sessionId) {
        const { chatAutomationService } = await import('../../services/chat-automation/chat-automation.service');
        const result = await chatAutomationService.sendMessage(instance.sessionId, message);

        // Append user message to chatHistory
        try {
          const now = new Date().toISOString();
          const userMsg: ChatMessage = { id: `u-${Date.now()}`, from: 'user', text: message, ts: now };
          const existing: ChatMessage[] = instance.chatHistory || [];
          instanceManager.updateInstanceState(instanceId, { chatHistory: [...existing, userMsg] });
        } catch (e) {
          logger.debug('Failed to append user message to chatHistory', e);
        }

        // Update stats and append response if available
        if (result.success) {
          instanceManager.updateInstanceStats(instanceId, {
            messagesProcessed: (instance.stats.messagesProcessed || 0) + 1,
          });

          try {
            const now = new Date().toISOString();
            const response = result.data || {} as any;
            const botText = (response.content ?? response.text) || '';
            const botMsg: ChatMessage = { id: `b-${Date.now()}`, from: 'bot', text: String(botText), ts: now, messageId: response.messageId, conversationId: response.conversationId };
            const existing: ChatMessage[] = instance.chatHistory || [];
            instanceManager.updateInstanceState(instanceId, { chatHistory: [...existing, botMsg] });
          } catch (e) {
            logger.debug('Failed to append bot message to chatHistory', e);
          }
        }

        return result;
      }

      return { success: false, error: 'Instance type does not support messages' };
    } catch (error) {
      logger.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Highlight window for instance (bring to front)
   */
  ipcMain.handle('automation:highlight', async (_event, instanceId: string) => {
    try {
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) {
        return { success: false, error: 'Instance not found' };
      }

      // TODO: Implement window highlighting using native APIs
      // For now just log
      logger.info(`Highlight requested for instance ${instanceId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error highlighting instance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Update window positioning configuration
   */
  ipcMain.handle('automation:updateConfig', async (_event, config: any) => {
    try {
      const positioner = automationCoordinator.getPositioner();
      positioner.updateConfig(config);
      // Immediately apply reposition so UI-driven config changes (eg. compact)
      try {
        await automationCoordinator.repositionAll();
      } catch (e) {
        logger.warn('Reposition after config update failed', e);
      }
      return { success: true };
    } catch (error) {
      logger.error('Error updating config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Get window positioning configuration
   */
  ipcMain.handle('automation:getConfig', async (_event) => {
    try {
      const positioner = automationCoordinator.getPositioner();
      const config = positioner.getConfig();
      return { success: true, data: config };
    } catch (error) {
      logger.error('Error getting config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  /**
   * Reposition a single instance (apply calculated bounds)
   */
  ipcMain.handle('automation:repositionInstance', async (_event, instanceId: string) => {
    try {
      const ok = await automationCoordinator.repositionInstance(instanceId);
      return { success: ok };
    } catch (error) {
      logger.error('Error repositioning instance:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  /**
   * Reposition all running instances
   */
  ipcMain.handle('automation:repositionAll', async (_event) => {
    try {
      await automationCoordinator.repositionAll();
      return { success: true };
    } catch (error) {
      logger.error('Error repositioning all instances:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('automation:applyPreset', async (_event, preset: string) => {
    try {
      await automationCoordinator.applyPreset(preset);
      return { success: true };
    } catch (error) {
      logger.error('Error applying preset:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  /**
   * Move an instance to a specific screen slot. If another instance occupies that slot,
   * swap their slots. Uses the positioner to calculate full-grid bounds for the target slot.
   */
  ipcMain.handle('automation:moveInstanceToSlot', async (_event, instanceId: string, slot: number) => {
    try {
      const positioner = automationCoordinator.getPositioner();
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) return { success: false, error: 'Instance not found' };

      const targetOccupant = instanceManager.getAllInstances().find(i => i.screenSlot === slot && i.instanceId !== instanceId);

      if (targetOccupant) {
        // swap slots
        const origSlot = instance.screenSlot;
        instanceManager.updateInstanceState(instanceId, { screenSlot: slot, windowBounds: positioner.calculateWindowBounds(slot) });
        instanceManager.updateInstanceState(targetOccupant.instanceId, { screenSlot: origSlot, windowBounds: positioner.calculateWindowBounds(origSlot) });

        // reposition both
        await Promise.all([
          automationCoordinator.repositionInstance(instanceId),
          automationCoordinator.repositionInstance(targetOccupant.instanceId),
        ]);

        return { success: true };
      }

      // target empty - move instance
      instanceManager.updateInstanceState(instanceId, { screenSlot: slot, windowBounds: positioner.calculateWindowBounds(slot) });
      await automationCoordinator.repositionInstance(instanceId);
      return { success: true };

    } catch (error) {
      logger.error('Error moving instance to slot:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  logger.info('✅ Automation handlers registered');
}
