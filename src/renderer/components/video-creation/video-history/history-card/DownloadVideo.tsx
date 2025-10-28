import { Download } from "lucide-react";
import { useState } from "react";
import { VideoGeneration } from "src/shared/types/video-creation.types";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useToast } from "../../../../hooks/useToast";

export default function DownloadVideo({ generation }: { generation: VideoGeneration }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { singleVideoPath } = useFilePathsStore();
  const toast = useToast();

  if (!generation.videoUrl) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      if (!generation.videoUrl) {
        throw new Error("Video URL is not available");
      }

      // Use Electron IPC to download the video (bypasses CORS)
      const result = await (window as any).electronAPI.veo3.downloadVideo(
        generation.videoUrl,
        `video-${generation.sceneId || generation.id}`,
        singleVideoPath
      );

      if (!result.success) {
        const errorMessage = result.error || "Download failed";
        throw new Error(errorMessage);
      }

      // Show success toast
      toast.success(`✓ Video downloaded successfully!`, "Download Complete", 3000);
      console.log("Video downloaded:", result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);

      // Show error toast
      toast.error(message, "Download Failed", 5000);
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-1">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        title={error ? `Download failed: ${error}` : "Download video"}
        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        <Download className={`w-5 h-5 ${isDownloading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
