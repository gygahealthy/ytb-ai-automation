import { Zap } from "lucide-react";
import { useState } from "react";
import { VideoGeneration } from "src/shared/types/video-creation.types";
import { useToast } from "../../../../hooks/useToast";
import { useFilePathsStore } from "../../../../store/file-paths.store";

export default function UpscaleVideo({ generation }: { generation: VideoGeneration }) {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { singleVideoPath, fileNaming } = useFilePathsStore();

  // Only allow upscaling for completed videos
  if (!generation.videoUrl || generation.status !== "completed") return null;

  const handleDownloadUpscaled = async (rawBytes: string, sourceGenerationId: string) => {
    try {
      console.log(`[UpscaleVideo] Auto-downloading upscaled video for: ${sourceGenerationId}`);
      toast.info("Downloading upscaled video to Downloads folder...", "Upscale", 3000);

      // Download using configured path and filename pattern
      const downloadResult = await (window as any).electronAPI.invoke("veo3:upscale:downloadBase64Directly", {
        rawBytes,
        outputPath: singleVideoPath || undefined, // Use configured path or fall back to Downloads folder
        sourceGenerationId,
        filenamePattern: fileNaming.video, // Pass filename pattern from settings
      });

      if (!downloadResult.success) {
        throw new Error(downloadResult.error || "Failed to download video");
      }

      const filePath = downloadResult.data.filePath;
      console.log(`[UpscaleVideo] Downloaded to: ${filePath}`);

      // Open folder automatically after successful download
      try {
        const openResult = await (window as any).electronAPI.invoke("shell:openPath", filePath);
        if (openResult.success) {
          toast.success(`✓ Upscaled video saved and folder opened!\n\n📁 ${filePath}`, "Download Complete", 6000);
        } else {
          toast.success(`✓ Upscaled video saved!\n\n📁 ${filePath}\n\n(Could not auto-open folder)`, "Download Complete", 6000);
        }
      } catch (openErr) {
        console.warn("[UpscaleVideo] Failed to open folder:", openErr);
        toast.success(`✓ Upscaled video saved!\n\n📁 ${filePath}`, "Download Complete", 6000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download upscaled video";
      console.error("[UpscaleVideo] Download error:", err);
      toast.error(`❌ Download failed: ${message}`, "Download Error", 5000);
    }
  };

  const handleUpscale = async () => {
    try {
      setIsUpscaling(true);
      setError(null);

      console.log(`[UpscaleVideo] Starting upscale for generation: ${generation.id}`);

      // Show info toast that upscale is starting
      toast.info(`Starting upscale process...`, "Upscaling", 2000);

      // Use Electron IPC to start upscale
      const result = await (window as any).electronAPI.veo3.startVideoUpscale(generation.id);

      console.log("[UpscaleVideo] Upscale response:", result);

      if (!result.success) {
        const errorMessage = result.error || "Upscale failed to start";

        // Parse common error types
        if (typeof errorMessage === "string") {
          if (errorMessage.includes("401") || errorMessage.includes("UNAUTHENTICATED")) {
            toast.error(
              `❌ Authentication failed. Your credentials may have expired. Please re-login with your Google account.`,
              "Upscale Failed - Auth Error",
              7000
            );
          } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
            toast.error(
              `❌ Permission denied. You may not have access to upscale videos in this project.`,
              "Upscale Failed - Permission Error",
              7000
            );
          } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            toast.error(
              `❌ Rate limited. Too many upscale requests. Please wait a moment and try again.`,
              "Upscale Failed - Rate Limit",
              7000
            );
          } else if (errorMessage.includes("invalid") || errorMessage.includes("Invalid")) {
            toast.error(
              `❌ Invalid video or parameters. The video may be corrupted or in an unsupported format.`,
              "Upscale Failed - Invalid Video",
              7000
            );
          } else {
            toast.error(`❌ Upscale failed: ${errorMessage}`, "Upscale Failed", 5000);
          }
        }

        throw new Error(errorMessage);
      }

      console.log("[UpscaleVideo] Upscale started successfully:", result.data);

      // Check if video is already upscaled (has rawBytes)
      if (result.data?.alreadyCompleted && result.data?.rawBytes) {
        console.log("[UpscaleVideo] Video already upscaled! Auto-downloading...");

        toast.success(`✅ Video already upscaled to 1080p!\n\nDownloading to your Downloads folder...`, "Already Upscaled", 4000);

        // Auto-download without asking
        await handleDownloadUpscaled(result.data.rawBytes, result.data.sourceGenerationId || generation.id);

        return;
      }

      // Show success toast with upscale ID for pending upscales
      toast.success(
        `✓ Upscale started! Upscale ID: ${result.data?.upscaleId}\n\nThe video will be upscaled to 1080p. Check back for updates.`,
        "Upscale Started",
        5000
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);

      console.error("[UpscaleVideo] Upscale error:", err);
    } finally {
      setIsUpscaling(false);
    }
  };

  return (
    <div className="p-1">
      <button
        onClick={handleUpscale}
        disabled={isUpscaling}
        title={error ? `Upscale failed: ${error}` : "Upscale video to 1080p"}
        className="text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
      >
        <Zap className={`w-5 h-5 ${isUpscaling ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
