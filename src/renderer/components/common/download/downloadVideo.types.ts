/**
 * Types for the DownloadVideo component
 * Used for downloading remote videos to local storage
 */

export interface DownloadResult {
  id: string;
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
}

export interface DownloadVideoProps {
  /** Remote video URL to download */
  videoUrl: string;

  /** Optional filename (without extension; .mp4 will be added by service) */
  filename?: string;

  /** Absolute path where video should be saved. If omitted, worker uses default. */
  downloadPath?: string;

  /** Index of the video for auto-indexing (e.g., 1 -> 001) */
  videoIndex?: number;

  /** File path settings for naming and folder creation */
  settings?: {
    autoCreateDateFolder?: boolean;
    autoIndexFilename?: boolean;
    addEpochTimeToFilename?: boolean;
  };

  /** Called when download starts */
  onStart?: () => void;

  /** Called when download completes successfully */
  onSuccess?: (result: DownloadResult) => void;

  /** Called on any error during download */
  onError?: (error: string | Error) => void;

  /** Called for progress updates (if supported by backend) */
  onProgress?: (result: DownloadResult) => void;

  /** Disable the download button */
  disabled?: boolean;

  /** Additional CSS classes for the button container */
  className?: string;

  /** Icon size in pixels (default: 20) */
  iconSize?: number;

  /** Show spinner while downloading (default: true) */
  showSpinner?: boolean;

  /** Tooltip text override (default: "Download video") */
  tooltipText?: string;
}
