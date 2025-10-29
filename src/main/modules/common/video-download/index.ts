/**
 * Video Download Module
 *
 * Provides video download service with worker thread support.
 * This module is automatically discovered and loaded by the module-loader.
 */

// Re-export types for external use
export type { DownloadJob, DownloadResult, PendingDownload, DownloadStatus } from "./types/download.types";

// Re-export service singleton
export { videoDownloadService } from "./services/video-download.service";

// Module is registered by handlers/registrations.ts which is auto-discovered by module-loader
