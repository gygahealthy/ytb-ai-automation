import { IpcRegistration } from '../../../../core/ipc/types';
import { veo3Service } from '../services/veo3.service';

export const veo3Registrations: IpcRegistration[] = [
  { channel: 'veo3:getAll', description: 'Get all VEO3 projects', handler: async () => { return await veo3Service.getAllProjects(); } },
  { channel: 'veo3:getById', description: 'Get VEO3 by id', handler: async (req: { id: string }) => { return await veo3Service.getProjectById((req as any).id); } },
  { channel: 'veo3:create', description: 'Create project', handler: async (req: any) => { return await veo3Service.createProject(req); } },
  { channel: 'veo3:updateStatus', description: 'Update project status', handler: async (req: { id: string; status: any }) => { return await veo3Service.updateProjectStatus((req as any).id, (req as any).status); } },
  { channel: 'veo3:addScene', description: 'Add scene', handler: async (req: { projectId: string; scene: any }) => { return await veo3Service.addScene((req as any).projectId, (req as any).scene); } },
  { channel: 'veo3:removeScene', description: 'Remove scene', handler: async (req: { projectId: string; sceneId: string }) => { return await veo3Service.removeScene((req as any).projectId, (req as any).sceneId); } },
  { channel: 'veo3:updatePrompt', description: 'Update json prompt', handler: async (req: { projectId: string; jsonPrompt: any }) => { return await veo3Service.updateJsonPrompt((req as any).projectId, (req as any).jsonPrompt); } },
  { channel: 'veo3:delete', description: 'Delete project', handler: async (req: { id: string }) => { return await veo3Service.deleteProject((req as any).id); } },
  { channel: 'veo3:fetchProjectsFromAPI', description: 'Fetch projects from VEO3 API by profile', handler: async (req: { profileId: string }) => { return await veo3Service.fetchProjectsFromAPI((req as any).profileId); } },
  { channel: 'veo3:createProjectViaAPI', description: 'Create project via VEO3 API', handler: async (req: { profileId: string; projectTitle: string }) => { return await veo3Service.createProjectViaAPI((req as any).profileId, (req as any).projectTitle); } },
];
