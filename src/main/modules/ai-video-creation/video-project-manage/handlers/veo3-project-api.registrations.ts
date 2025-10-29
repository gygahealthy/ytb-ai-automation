import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3ProjectApiService } from "../services/veo3-project-api.service";
import { Logger } from "../../../../../shared/utils/logger";

const logger = new Logger("VEO3ProjectApiHandlers");

export const veo3ProjectApiRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:fetchProjectsFromAPI",
    description: "Fetch projects from VEO3 API by profile",
    handler: async (req: { profileId: string }) => {
      const profileId = (req as any).profileId;
      logger.info(`[Handler] fetchProjectsFromAPI called with profileId: ${profileId}`);

      const result = await veo3ProjectApiService.fetchProjectsFromAPI(profileId);

      logger.info(`[Handler] fetchProjectsFromAPI result:`, {
        success: result.success,
        error: result.error,
        projectCount: Array.isArray(result.data) ? result.data.length : 0,
      });

      return result;
    },
  },
  {
    channel: "veo3:createProjectViaAPI",
    description: "Create project via VEO3 API",
    handler: async (req: { profileId: string; projectTitle: string }) => {
      const profileId = (req as any).profileId;
      const projectTitle = (req as any).projectTitle;
      logger.info(`[Handler] createProjectViaAPI called with profileId: ${profileId}, title: ${projectTitle}`);

      const result = await veo3ProjectApiService.createProjectViaAPI(profileId, projectTitle);

      logger.info(`[Handler] createProjectViaAPI result:`, {
        success: result.success,
        error: result.error,
      });

      return result;
    },
  },
];
