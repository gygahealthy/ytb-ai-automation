import { IpcRegistration } from "../../../../../core/ipc/types";
import { veo3VideoHistoryService } from "../services/veo3-video-history.service";

export const veo3HistoryRegistrations: IpcRegistration[] = [
  {
    channel: "veo3:getVideoHistory",
    description: "Get paginated video history with filtering",
    handler: async (req: { page?: number; pageSize?: number; filter?: any }) => {
      return await veo3VideoHistoryService.getVideoHistory((req as any).page, (req as any).pageSize, (req as any).filter);
    },
  },
  {
    channel: "veo3:getVideoHistoryGroupedByDate",
    description: "Get video history grouped by date (like Google Photos)",
    handler: async (req: { page?: number; pageSize?: number; filter?: any }) => {
      return await veo3VideoHistoryService.getVideoHistoryGroupedByDate(
        (req as any).page,
        (req as any).pageSize,
        (req as any).filter
      );
    },
  },
  {
    channel: "veo3:getStatusCounts",
    description: "Get status counts for video generations",
    handler: async (req: { profileId?: string }) => {
      return await veo3VideoHistoryService.getStatusCounts((req as any).profileId);
    },
  },
];
