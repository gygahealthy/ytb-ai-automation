import { IpcRegistration } from '../../../../core/ipc/types';
import { automationCoordinator } from '../services/browser-coordinator';
import { instanceManager } from '../services/instance-manager';

export const instanceRegistrations: IpcRegistration[] = [
  { channel: 'automation:launch', description: 'Launch automation instance', handler: async (req: any) => { return await automationCoordinator.launchInstance(req); } },
  { channel: 'automation:stopInstance', description: 'Stop instance', handler: async (_req: { instanceId: string }) => { const ok = await automationCoordinator.stopInstance(((_req as any).instanceId)); return { success: ok }; } },
  { channel: 'automation:stopAll', description: 'Stop all instances', handler: async () => { await automationCoordinator.stopAll(); return { success: true }; } },
  { channel: 'automation:getInstances', description: 'Get all instances', handler: async () => { const instances = instanceManager.getAllInstances(); return { success: true, data: instances }; } },
  { channel: 'automation:getInstance', description: 'Get instance by id', handler: async (_req: { instanceId: string }) => { const instance = instanceManager.getInstance(((_req as any).instanceId)); if (!instance) return { success: false, error: 'Instance not found' }; return { success: true, data: instance }; } },
  { channel: 'automation:sendMessage', description: 'Send message to instance', handler: async (req: any) => {
      try {
        const instanceId = (req as any).instanceId;
        const message = (req as any).message;
        const instance = instanceManager.getInstance(instanceId);
        if (!instance) return { success: false, error: 'Instance not found' };
        if (instance.automationType === 'chat' && instance.sessionId) {
          const { chatAutomationService } = await import('../../chat-automation/services/chat-automation.service');
          
          // Get existing chat history or initialize empty array
          const existingHistory = instance.chatHistory || [];
          
          // Add user message to history
          const userMessage = { id: existingHistory.length + 1, from: 'user' as const, text: message, ts: new Date().toISOString() };
          
          // Send message and get bot response
          const result = await chatAutomationService.sendMessage(instance.sessionId, message);
          
          if (result.success && result.data) {
            // Add bot response to history
            const botMessage = { 
              id: existingHistory.length + 2, 
              from: 'bot' as const, 
              text: result.data.content, 
              ts: result.data.timestamp.toISOString(),
              messageId: result.data.messageId,
              conversationId: result.data.conversationId
            };
            
            // Update instance state with new chat history
            const updatedHistory = [...existingHistory, userMessage, botMessage];
            instanceManager.updateInstanceState(instanceId, { chatHistory: updatedHistory });
          }
          
          return result;
        }
        return { success: false, error: 'Instance type does not support messages' };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
      }
    } },
  { channel: 'automation:highlight', description: 'Highlight instance', handler: async (_req: { instanceId: string }) => { return { success: true }; } },
  { channel: 'automation:updateConfig', description: 'Update automation config', handler: async (req: any) => { const positioner = automationCoordinator.getPositioner(); positioner.updateConfig(req); try { await automationCoordinator.repositionAll(); } catch (e) {} return { success: true }; } },
  { channel: 'automation:getConfig', description: 'Get automation config', handler: async () => { const positioner = automationCoordinator.getPositioner(); const config = positioner.getConfig(); return { success: true, data: config }; } },
  { channel: 'automation:repositionInstance', description: 'Reposition instance', handler: async (_req: { instanceId: string }) => { const ok = await automationCoordinator.repositionInstance(((_req as any).instanceId)); return { success: ok }; } },
  { channel: 'automation:repositionAll', description: 'Reposition all', handler: async () => { await automationCoordinator.repositionAll(); return { success: true }; } },
  { channel: 'automation:applyPreset', description: 'Apply preset', handler: async (req: { preset: string }) => { await automationCoordinator.applyPreset((req as any).preset); return { success: true }; } },
  { channel: 'automation:moveInstanceToSlot', description: 'Move instance to slot', handler: async (req: { instanceId: string; slot: number }) => {
      try {
        const instanceId = (req as any).instanceId;
        const slot = (req as any).slot;
        const positioner = automationCoordinator.getPositioner();
        const instance = instanceManager.getInstance(instanceId);
        if (!instance) return { success: false, error: 'Instance not found' };

        const targetOccupant = instanceManager.getAllInstances().find(i => i.screenSlot === slot && i.instanceId !== instanceId);

        if (targetOccupant) {
          const origSlot = instance.screenSlot;
          instanceManager.updateInstanceState(instanceId, { screenSlot: slot, windowBounds: positioner.calculateWindowBounds(slot) });
          instanceManager.updateInstanceState(targetOccupant.instanceId, { screenSlot: origSlot, windowBounds: positioner.calculateWindowBounds(origSlot) });

          await Promise.all([
            automationCoordinator.repositionInstance(instanceId),
            automationCoordinator.repositionInstance(targetOccupant.instanceId),
          ]);

          return { success: true };
        }

        instanceManager.updateInstanceState(instanceId, { screenSlot: slot, windowBounds: positioner.calculateWindowBounds(slot) });
        await automationCoordinator.repositionInstance(instanceId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    } },
];
