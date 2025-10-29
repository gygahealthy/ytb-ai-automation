import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3ProjectApiService } from "../services/veo3-project-api.service";

export const veo3ProjectApiRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:fetchProjectsFromAPI",
    description: "Fetch projects from VEO3 API by profile",
    handler: async (req: { profileId: string }) => {
      return await veo3ProjectApiService.fetchProjectsFromAPI((req as any).profileId);
    },
  },
  {
    channel: "veo3:createProjectViaAPI",
    description: "Create project via VEO3 API",
    handler: async (req: { profileId: string; projectTitle: string }) => {
      return await veo3ProjectApiService.createProjectViaAPI((req as any).profileId, (req as any).projectTitle);
    },
  },
];
