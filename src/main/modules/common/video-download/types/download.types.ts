/**
 * Video Download Types
 *
 * Interfaces for video download job management and results.
 */

export interface DownloadJob {
  id: string;
  videoUrl: string;
  filename: string;
  downloadPath: string;
  videoIndex?: number;
  // Pass paths from parent instead of using app.getPath()
  userDataPath?: string;
  homeDir?: string;
  // File path settings from renderer
  settings?: {
    autoCreateDateFolder?: boolean;
    autoIndexFilename?: boolean;
    addEpochTimeToFilename?: boolean;
  };
}

export interface DownloadResult {
  id: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

export interface PendingDownload {
  job: DownloadJob;
  resolve: (result: DownloadResult) => void;
  reject: (error: Error) => void;
}

export interface DownloadStatus {
  activeDownloads: number;
  queuedDownloads: number;
  workerCount: number;
}
