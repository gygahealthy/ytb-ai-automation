/**
 * Video Download by Name/ID Worker Types
 *
 * Handles downloading videos using the VEO3 media name/ID endpoint
 * with bearer token authentication and FLOW_NEXT_KEY
 */

export interface VideoDownloadByNameJob {
  id: string;
  profileId: string;
  videoName: string; // mediaGenerationId (CAUSJDlm...)
  mediaKey: string;
  fifeUrl?: string;
  downloadPath: string;
  bearerToken: string;
  flowNextKey: string;
  // Paths from main process (worker can't access app.getPath())
  userDataPath: string;
  homeDir: string;
}

export interface VideoDownloadByNameResult {
  id: string;
  videoName: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

export interface PendingVideoDownloadByName {
  job: VideoDownloadByNameJob;
  resolve: (value: VideoDownloadByNameResult) => void;
  reject: (reason?: any) => void;
}

export interface VideoDownloadByNameStatus {
  activeDownloads: number;
  queuedDownloads: number;
  workerCount: number;
}
