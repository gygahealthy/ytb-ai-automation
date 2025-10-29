/**
 * VEO3 Video Download Service (Deprecated)
 *
 * This file is kept for backwards compatibility only.
 * The actual implementation has been moved to the common/video-download module
 * and is now managed by the module loader system.
 *
 * DEPRECATED: Use common/video-download module instead.
 * Import: import { videoDownloadService } from "@main/modules/common/video-download";
 */

import { videoDownloadService } from "../../../common/video-download";

// Re-export for backwards compatibility
export const veo3VideoDownloadService = videoDownloadService;

// Re-export types from the new location
export type { DownloadJob, DownloadResult, DownloadStatus } from "../../../common/video-download";
