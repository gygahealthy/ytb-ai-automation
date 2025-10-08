import { IpcRegistration } from '../../../../core/ipc/types';
import { promptService } from '../services/prompt.service';

export const promptRegistrations: IpcRegistration[] = [
  {
    channel: 'master-prompts:getAll',
    description: 'Get all master prompts',
    handler: async () => await promptService.getAll(),
  },
  {
    channel: 'master-prompts:getById',
    description: 'Get master prompt by id',
    handler: async (req: any) => await promptService.getById(req as any),
  },
  {
    channel: 'master-prompts:getByProvider',
    description: 'Get master prompts by provider',
    handler: async (req: any) => await promptService.getByProvider(req as any),
  },
  {
    channel: 'master-prompts:getByKind',
    description: 'Get master prompts by kind',
    handler: async (req: any) => await promptService.getByKind(req as any),
  },
  {
    channel: 'master-prompts:getByProviderAndKind',
    description: 'Get master prompt by provider and kind',
    handler: async (req: any) => await promptService.getByProviderAndKind(req as any),
  },
  {
    channel: 'master-prompts:create',
    description: 'Create master prompt',
    handler: async (req: any) => await promptService.create(req as any),
  },
  {
    channel: 'master-prompts:update',
    description: 'Update master prompt',
    handler: async (req: any) => await promptService.update(req as any),
  },
  {
    channel: 'master-prompts:archive',
    description: 'Archive master prompt',
    handler: async (req: any) => await promptService.archive(req as any),
  },
  {
    channel: 'master-prompts:delete',
    description: 'Delete master prompt',
    handler: async (req: any) => await promptService.deletePrompt(req as any),
  },
  {
    channel: 'master-prompts:extractVariables',
    description: 'Extract variables from template',
    handler: async (req: any) => await promptService.extractVariables(req as any),
  },
  {
    channel: 'master-prompts:populateTemplate',
    description: 'Populate template with variables',
    handler: async (req: any) => await promptService.populateTemplate(req as any),
  },
];
