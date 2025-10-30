import { Download } from "lucide-react";
import { useState } from "react";
import { DownloadVideoProps } from "./downloadVideo.types";

/**
 * Reusable DownloadVideo component
 *
 * Downloads a remote video via Electron IPC to a local filesystem path.
 * Provides state management (loading, error) and callback hooks for integration.
 *
 * Props:
 *   - videoUrl (required): URL to download from
 *   - filename (optional): Base filename; .mp4 added by service
 *   - downloadPath (optional): Absolute path for destination; worker uses fallback if omitted
 *   - videoIndex (optional): Index for auto-indexing filename (e.g., 001, 002)
 *   - onStart, onSuccess, onError, onProgress: Lifecycle callbacks
 *   - disabled, className, iconSize, showSpinner, tooltipText: UI options
 *
 * Example:
 *   <DownloadVideo
 *     videoUrl="https://example.com/video.mp4"
 *     filename="my-video"
 *     downloadPath="C:\\Users\\User\\Downloads"
 *     videoIndex={5}
 *     onSuccess={() => showToast("Downloaded!")}
 *     onError={(err) => showToast(String(err))}
 *   />
 */
export default function DownloadVideoVeo3({
  videoUrl,
  filename,
  downloadPath,
  videoIndex,
  settings,
  onStart,
  onSuccess,
  onError,
  disabled = false,
  className = "",
  iconSize = 20,
  showSpinner = true,
  tooltipText = "Download video",
}: DownloadVideoProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!videoUrl) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      if (onStart) {
        onStart();
      }

      // Call main process via preload bridge
      // Uses common/video-download module via video.download.single channel
      const result = await (window as any).electronAPI.video.download.single(
        videoUrl,
        filename,
        downloadPath,
        videoIndex,
        settings
      );

      // Check for success flag in response (ApiResponse format)
      if (!result.success) {
        const errorMessage = result.error || "Download failed";
        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }
        return;
      }

      // Trigger success callback with data from response
      if (onSuccess) {
        onSuccess(result.data || result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);

      if (onError) {
        onError(err instanceof Error ? err : new Error(message));
      }

      console.error("[DownloadVideo] Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const finalTooltip = error ? `Download failed: ${error}` : tooltipText;
  const isDisabled = disabled || isDownloading;

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        title={finalTooltip}
        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        <Download width={iconSize} height={iconSize} className={showSpinner && isDownloading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
