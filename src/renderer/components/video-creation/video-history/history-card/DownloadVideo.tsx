import { useState } from "react";
import { Download } from "lucide-react";
import { VideoGeneration } from "src/shared/types/video-creation.types";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useToast } from "../../../../hooks/useToast";

/**
 * Smart Download Video Component with Automatic Fallback
 *
 * This component handles video downloads with a two-tier approach:
 * 1. Primary: Download via videoUrl (fifeUrl/servingBaseUri) - fast but may expire
 * 2. Fallback: Download via mediaGenerationId using bearer token + FLOW_NEXT_KEY - always works
 *
 * Features:
 * - Automatic fallback on URL expiration (400/403 errors)
 * - Uses file path store settings (auto-date, auto-index, epoch time)
 * - Toast notifications for success/error
 * - Loading state with spinner
 */
export default function DownloadVideo({ generation }: { generation: VideoGeneration }) {
  const { singleVideoPath, options } = useFilePathsStore();
  const toast = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!generation.videoUrl && !generation.mediaGenerationId) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      const filename = `video-${generation.sceneId || generation.id}`;
      const settings = {
        autoCreateDateFolder: options.autoCreateDateFolder,
        autoIndexFilename: options.autoIndexFilename,
        addEpochTimeToFilename: options.addEpochTimeToFilename,
      };

      // Strategy 1: Try normal URL-based download first (if videoUrl exists)
      if (generation.videoUrl) {
        console.log("[DownloadVideo] Attempting URL-based download:", generation.videoUrl.substring(0, 100) + "...");

        const urlResult = await (window as any).electronAPI.video.download.single(
          generation.videoUrl,
          filename,
          singleVideoPath,
          undefined,
          settings
        );

        console.log("[DownloadVideo] URL download result:", urlResult);

        // Check if successful (both IPC success and download success)
        if (urlResult.success && urlResult.data?.success) {
          toast.success(`✓ Video downloaded successfully!`, "Download Complete", 3000);
          setIsDownloading(false);
          return;
        }

        // Check if error is due to expiration (400 Bad Request, 403 Forbidden)
        // Error can be in urlResult.error (IPC level) or urlResult.data?.error (download level)
        const errorMsg = urlResult.error || urlResult.data?.error || "";
        console.log("[DownloadVideo] Error message:", errorMsg);

        const isExpiredError =
          errorMsg.includes("400") ||
          errorMsg.includes("403") ||
          errorMsg.includes("Bad Request") ||
          errorMsg.includes("Forbidden") ||
          errorMsg.includes("expired") ||
          errorMsg.toLowerCase().includes("response code");

        console.log("[DownloadVideo] Is expired error:", isExpiredError);

        if (!isExpiredError) {
          // Unknown error, not expiration-related
          throw new Error(errorMsg || "URL-based download failed");
        }

        console.log("[DownloadVideo] URL expired, falling back to name-based download");
      }

      // Strategy 2: Fallback to name-based download (requires mediaGenerationId)
      if (!generation.mediaGenerationId) {
        const errMsg = "Video URL expired and no mediaGenerationId available for fallback";
        console.error("[DownloadVideo]", errMsg);
        throw new Error(errMsg);
      }

      console.log("[DownloadVideo] Attempting name-based download with mediaGenerationId:", generation.mediaGenerationId);
      console.log("[DownloadVideo] Profile ID:", generation.profileId);
      console.log("[DownloadVideo] Download path:", singleVideoPath);

      // Extract mediaKey from generation.id for filename
      const mediaKey = generation.id;

      // Call the auto name-based download API (handles token extraction automatically)
      const nameResult = await (window as any).electronAPI.video.downloadByName.auto(
        generation.profileId,
        generation.mediaGenerationId,
        mediaKey,
        singleVideoPath,
        generation.fifeUrl || undefined
      );

      console.log("[DownloadVideo] Name-based download result:", nameResult);

      if (!nameResult.success) {
        throw new Error(nameResult.error || "Name-based download failed");
      }

      toast.success(`✓ Video downloaded successfully (fallback method)!`, "Download Complete", 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message, "Download Failed", 5000);
      console.error("[DownloadVideo] Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const tooltipText = error ? `Download failed: ${error}` : "Download video";
  const isDisabled = isDownloading;

  return (
    <div className="p-1">
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        title={tooltipText}
        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        <Download width={20} height={20} className={isDownloading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
