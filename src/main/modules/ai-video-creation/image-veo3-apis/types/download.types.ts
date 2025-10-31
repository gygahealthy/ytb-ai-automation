/**
 * Image Download Worker Types
 */

export interface ImageDownloadJob {
  id: string;
  profileId: string;
  imageName: string;
  mediaKey: string;
  fifeUrl?: string;
  downloadPath: string;
  bearerToken: string;
  flowNextKey: string;
  // Paths from main process (worker can't access app.getPath())
  userDataPath: string;
  homeDir: string;
}

export interface ImageDownloadResult {
  id: string;
  imageName: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

export interface PendingImageDownload {
  job: ImageDownloadJob;
  resolve: (value: ImageDownloadResult) => void;
  reject: (reason?: any) => void;
}

export interface ImageDownloadStatus {
  activeDownloads: number;
  queuedDownloads: number;
  workerCount: number;
}
