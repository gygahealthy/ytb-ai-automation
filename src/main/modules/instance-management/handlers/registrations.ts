import { IpcRegistration } from '../../../../core/ipc/types';
import { automationCoordinator } from '../services/browser-coordinator';
import { chatAutomationService } from '../../chat-automation/services/chat-automation.service';
import { instanceManager } from '../services/instance-manager';

export const instanceRegistrations: IpcRegistration[] = [
  { channel: 'automation:launch', description: 'Launch automation instance', handler: async (req: any) => { return await automationCoordinator.launchInstance(req); } },
  { channel: 'automation:stopInstance', description: 'Stop instance', handler: async (_req: { instanceId: string }) => { const ok = await automationCoordinator.stopInstance(((_req as any).instanceId)); return { success: ok }; } },
  { channel: 'automation:stopAll', description: 'Stop all instances', handler: async () => { await automationCoordinator.stopAll(); return { success: true }; } },
  { channel: 'automation:getInstances', description: 'Get all instances', handler: async () => { const instances = instanceManager.getAllInstances(); return { success: true, data: instances }; } },
  { channel: 'automation:getInstance', description: 'Get instance by id', handler: async (_req: { instanceId: string }) => { const instance = instanceManager.getInstance(((_req as any).instanceId)); if (!instance) return { success: false, error: 'Instance not found' }; return { success: true, data: instance }; } },
  { channel: 'automation:sendMessage', description: 'Send message to instance', handler: async (req: any) => {
      const instanceId = (req as any).instanceId;
      const message = (req as any).message;
      return await chatAutomationService.sendMessageToInstance(instanceId, message);
    } },
  { channel: 'automation:highlight', description: 'Highlight instance', handler: async (_req: { instanceId: string }) => { return { success: true }; } },
  { channel: 'automation:updateConfig', description: 'Update automation config', handler: async (req: any) => { const positioner = automationCoordinator.getPositioner(); positioner.updateConfig(req); try { await automationCoordinator.repositionAll(); } catch (e) {} return { success: true }; } },
  { channel: 'automation:getConfig', description: 'Get automation config', handler: async () => { const positioner = automationCoordinator.getPositioner(); const config = positioner.getConfig(); return { success: true, data: config }; } },
  { channel: 'automation:repositionInstance', description: 'Reposition instance', handler: async (_req: { instanceId: string }) => { const ok = await automationCoordinator.repositionInstance(((_req as any).instanceId)); return { success: ok }; } },
  { channel: 'automation:repositionAll', description: 'Reposition all', handler: async () => { await automationCoordinator.repositionAll(); return { success: true }; } },
  { channel: 'automation:applyPreset', description: 'Apply preset', handler: async (req: { preset: string }) => { await automationCoordinator.applyPreset((req as any).preset); return { success: true }; } },
  { channel: 'automation:moveInstanceToSlot', description: 'Move instance to slot', handler: async (req: { instanceId: string; slot: number }) => {
      const instanceId = (req as any).instanceId;
      const slot = (req as any).slot;
      return await automationCoordinator.moveInstanceToSlot(instanceId, slot);
    } },
];
