import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3ModelsService } from "../services/veo3-apis/veo3-models.service";
import { cookieService } from "../../../common/cookie/services/cookie.service";
import { COOKIE_SERVICES } from "../../../gemini-apis/shared/constants/services.js";

export const modelsRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:syncModels",
    description: "Sync VEO3 video models from API",
    handler: async (req: { profileId: string }) => {
      try {
        const { profileId } = req as any;

        if (!profileId) {
          return {
            success: false,
            error: "Profile ID is required",
          };
        }

        // Get cookies for the profile
        const cookieResult = await cookieService.getCookiesByProfile(profileId);
        if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
          return {
            success: false,
            error: "Profile has no cookies. Please login first.",
          };
        }

        // Find the "flow" service cookie
        const flowCookie = cookieResult.data.find((c) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");
        if (!flowCookie || !flowCookie.rawCookieString) {
          return {
            success: false,
            error: "Profile has no active 'flow' cookies. Please login first.",
          };
        }

        // Sync models using the cookie
        return await veo3ModelsService.syncModels(flowCookie.rawCookieString);
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    },
  },
];
