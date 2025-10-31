import { useCallback } from "react";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useFilePathsStore } from "@store/file-paths.store";
import { useAlert } from "@hooks/useAlert";
import { useToast } from "@hooks/useToast";

/**
 * Hook to handle video download functionality
 */
export function useVideoDownload() {
  const alert = useAlert();
  const toast = useToast();

  const { singleVideoPath, setSingleVideoPath, options } = useFilePathsStore();
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);

  /**
   * Download selected completed videos to a chosen folder
   */
  const handleDownloadSelected = useCallback(async () => {
    console.log("[useVideoDownload] handleDownloadSelected called");

    const selectedPrompts = prompts.filter((p) => p.selected);
    console.log(`[useVideoDownload] Selected prompts: ${selectedPrompts.length}`);

    if (selectedPrompts.length === 0) {
      alert.show({
        title: "No Selection",
        message: "Please select at least one prompt to download videos",
        severity: "warning",
      });
      return;
    }

    // Collect completed videos for selected prompts
    const videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }> = [];
    for (const prompt of selectedPrompts) {
      const job = jobs.find((j) => j.promptId === prompt.id && j.status === "completed");
      console.log(
        `[useVideoDownload] Prompt ${prompt.id}: job found=${!!job}, status=${job?.status}, videoUrl=${job?.videoUrl}`
      );

      if (job && job.videoUrl) {
        videos.push({
          videoUrl: job.videoUrl,
          filename: prompt.text ? `${prompt.text.substring(0, 50).replace(/[<>:|"|?*]/g, "-")}` : `video-${job.id}`,
          videoIndex: (prompt.order || 0) + 1, // Start from 1 for user-friendly numbering (e.g., 001, 002, 003)
        });
      }
    }

    console.log(`[useVideoDownload] Videos to download: ${videos.length}`);

    if (videos.length === 0) {
      alert.show({
        title: "No Completed Videos",
        message: "No completed videos found for selected prompts",
        severity: "warning",
      });
      return;
    }

    // Show folder selection dialog
    try {
      console.log("[useVideoDownload] Opening folder selection dialog...");

      const result = await (window as any).electronAPI.invoke("dialog:showOpenDialog", {
        properties: ["openDirectory", "createDirectory"],
        title: "Select Download Folder",
        defaultPath: singleVideoPath || undefined,
      });

      console.log("[useVideoDownload] Dialog result:", result);

      // Dialog handler wraps response in {success, data}, extract the actual dialog result
      const dialogResult = result.success ? result.data : result;

      if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        console.log("[useVideoDownload] Dialog cancelled");
        return;
      }

      const selectedFolder = dialogResult.filePaths[0];
      console.log(`[useVideoDownload] Selected folder: ${selectedFolder}`);

      setSingleVideoPath(selectedFolder);

      toast.info(`Downloading ${videos.length} video(s)...`, "Download", 3000);

      console.log(`[useVideoDownload] Calling video:download:batch with ${videos.length} videos to ${selectedFolder}`);

      const downloadResult = await (window as any).electronAPI.video.download.batch(videos, selectedFolder, {
        autoCreateDateFolder: options.autoCreateDateFolder,
        autoIndexFilename: options.autoIndexFilename,
        addEpochTimeToFilename: options.addEpochTimeToFilename,
      });

      console.log("[useVideoDownload] Download result:", downloadResult);

      if (!downloadResult || !downloadResult.success) {
        const message = downloadResult?.error || "Failed to start batch download";
        toast.error(String(message), "Download Failed", 5000);
        return;
      }

      const results: Array<any> = downloadResult.data || [];
      const succeeded = results.filter((r) => r && r.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`✓ ${succeeded} video(s) downloaded to ${selectedFolder}`, "Download Complete", 4000);
      }
      if (failed > 0) {
        toast.error(`⚠️ ${failed} download(s) failed. Check logs for details.`, "Download Errors", 7000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[useVideoDownload] Download error:", error);
      alert.show({
        title: "Download Error",
        message: message,
        severity: "error",
      });
    }
  }, [prompts, jobs, singleVideoPath, setSingleVideoPath, options, alert, toast]);

  return {
    handleDownloadSelected,
  };
}
