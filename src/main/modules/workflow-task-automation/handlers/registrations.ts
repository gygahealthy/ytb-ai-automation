import { IpcRegistration } from '../../../../core/ipc/types';
import { automationService } from '../services/automation.service';

export const workflowRegistrations: IpcRegistration[] = [
  { channel: 'automation:getAll', description: 'Get all tasks', handler: async () => { return await automationService.getAllTasks(); } },
  { channel: 'automation:getById', description: 'Get task by id', handler: async (req: { id: string }) => { return await automationService.getTaskById((req as any).id); } },
  { channel: 'automation:create', description: 'Create task', handler: async (req: any) => { return await automationService.createTask(req); } },
  { channel: 'automation:start', description: 'Start task', handler: async (req: { id: string }) => { return await automationService.startTask((req as any).id); } },
  { channel: 'automation:stop', description: 'Stop task', handler: async (req: { id: string }) => { return await automationService.stopTask((req as any).id); } },
];
