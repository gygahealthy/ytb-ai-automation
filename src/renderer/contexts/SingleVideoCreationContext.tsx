import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useVideoCreationStore } from "../store/video-creation.store";
import { useDefaultProfileStore } from "../store/default-profile.store";
import { useFilePathsStore } from "../store/file-paths.store";
import { useImageGalleryStore } from "../store/image-gallery.store";
import { useToast } from "../hooks/useToast";
import { useAlert } from "../hooks/useAlert";
import veo3IPC from "../ipc/veo3";

/**
 * Single Video Creation Context
 *
 * Provides shared business logic for single video creation pages (text-to-video and ingredients).
 * Extracted from SingleVideoCreationPage to enable reuse across different creation modes.
 */

interface SingleVideoCreationContextValue {
  // State
  selectedProfileId: string;
  selectedProjectId: string;
  setSelectedProfileId: (id: string) => void;
  setSelectedProjectId: (id: string) => void;

  // Alert state
  alertState: {
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  };
  setAlertState: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      severity: "info" | "success" | "warning" | "error";
    }>
  >;

  // Actions
  handleCreateVideo: (promptId: string, promptText: string) => Promise<void>;
  handleCreateMultiple: (opts?: { skipConfirm?: boolean }) => Promise<void>;
  handleDownloadSelected: () => Promise<void>;
  handleExportJson: () => void;
  handleCopyJson: () => void;
  handleOpenHistory: () => void;
  handleShowInfo: (promptId: string) => void;
  handleShowInFolder: (path: string) => void;
  handleDownload: (url: string) => void;

  // Utilities
  hasSelection: boolean;
}

const SingleVideoCreationContext = createContext<SingleVideoCreationContextValue | undefined>(undefined);

interface SingleVideoCreationProviderProps {
  children: ReactNode;
}

export function SingleVideoCreationProvider({ children }: SingleVideoCreationProviderProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });

  const navigate = useNavigate();
  const toast = useToast();
  const alert = useAlert();

  // Subscribe to default profile store
  const geminiProfileId = useDefaultProfileStore((s) => s.geminiProfileId);
  const geminiProjectId = useDefaultProfileStore((s) => s.geminiProjectId);
  const flowProfileId = useDefaultProfileStore((s) => s.flowProfileId);
  const flowProjectId = useDefaultProfileStore((s) => s.flowProjectId);

  // Auto-sync with default profile/project when they change
  useEffect(() => {
    const defaultProfileId = geminiProfileId || flowProfileId;
    const defaultProjectId = geminiProfileId ? geminiProjectId : flowProjectId;

    if (defaultProfileId && !selectedProfileId) {
      setSelectedProfileId(defaultProfileId);
    }

    if (defaultProjectId && !selectedProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [geminiProfileId, geminiProjectId, flowProfileId, flowProjectId, selectedProfileId, selectedProjectId]);

  // Subscribe to store values
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);
  const globalPreviewMode = useVideoCreationStore((state) => state.globalPreviewMode);

  // Actions from store
  const createJob = useVideoCreationStore((state) => state.createJob);
  const updateJobStatus = useVideoCreationStore((state) => state.updateJobStatus);
  const toggleGlobalPreview = useVideoCreationStore((state) => state.toggleGlobalPreview);

  const { singleVideoPath, setSingleVideoPath } = useFilePathsStore();

  const hasSelection = prompts.some((p) => p.selected);

  // Ensure global preview mode is enabled by default
  useEffect(() => {
    if (!globalPreviewMode) {
      try {
        toggleGlobalPreview();
      } catch (e) {
        console.error("[SingleVideoCreation] Failed to enable global preview:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for VEO3 events and update job status
  useEffect(() => {
    console.log("[SingleVideoCreationContext] 🔄 Setting up VEO3 event listeners...");

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.on) {
      console.error("[SingleVideoCreationContext] ❌ electronAPI.on not available!");
      return;
    }

    console.log("[SingleVideoCreationContext] ✅ electronAPI.on available, setting up listeners...");

    // Listen for generation status updates from backend polling
    const unsubStatus = electronAPI.on("veo3:generation:status", (data: any) => {
      console.log("[SingleVideoCreationContext] 📨 veo3:generation:status event received:", data);

      const { generationId, promptId, status, videoUrl, error, progress } = data;

      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      const job = currentJobs.find((j) => j.generationId === generationId || j.promptId === promptId);

      if (job) {
        console.log(`[SingleVideoCreationContext] Updating job ${job.id} status to ${status}`);
        updateStatus(job.id, status, {
          videoUrl,
          error,
          progress,
        });
      } else {
        console.warn(`[SingleVideoCreationContext] No job found for generationId ${generationId} or promptId ${promptId}`);
      }
    });

    // Listen for batch progress
    const unsubProgress = electronAPI.on("veo3:multipleVideos:progress", (data: any) => {
      console.log("[SingleVideoCreationContext] 📨 veo3:multipleVideos:progress event received:", data);

      const { promptId, generationId, success, error } = data;

      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      if (success && generationId) {
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          updateStatus(job.id, "processing", { generationId, progress: 0 });
        }
      } else if (error) {
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          updateStatus(job.id, "failed", { error });
        }
      }
    });

    const unsubBatchStarted = electronAPI.on("veo3:batch:started", (data: any) => {
      console.log("[SingleVideoCreationContext] 📨 veo3:batch:started event received:", data);
    });

    console.log("[SingleVideoCreationContext] ✅ All event listeners registered!");

    return () => {
      console.log("[SingleVideoCreationContext] 🛑 Unsubscribing from event listeners");
      if (unsubStatus) unsubStatus();
      if (unsubProgress) unsubProgress();
      if (unsubBatchStarted) unsubBatchStarted();
    };
  }, []);

  const handleCreateVideo = useCallback(
    async (promptId: string, promptText: string) => {
      if (!promptText.trim()) {
        alert.show({
          message: "Prompt text cannot be empty",
          severity: "warning",
        });
        return;
      }

      const prompt = prompts.find((p) => p.id === promptId);
      if (!prompt) {
        alert.show({
          message: "Prompt not found",
          severity: "error",
        });
        return;
      }

      const effectiveProfileId = prompt.profileId || selectedProfileId;
      const effectiveProjectId = prompt.projectId || selectedProjectId;

      if (!effectiveProfileId) {
        alert.show({
          title: "Profile Required",
          message: "Please select a profile first (use the Profile button or set per-row profile)",
          severity: "warning",
        });
        return;
      }

      if (!effectiveProjectId) {
        alert.show({
          title: "Project Required",
          message: "Please select a project first (use the Profile button or set per-row project)",
          severity: "warning",
        });
        return;
      }

      // Get selected images: prioritize per-prompt images, fallback to global
      const globalSelectedImages = useImageGalleryStore.getState().selectedImages;
      const effectiveImages =
        prompt.selectedImages && prompt.selectedImages.length > 0 ? prompt.selectedImages : globalSelectedImages;

      if (effectiveImages.length > 0) {
        console.log(`[SingleVideoCreation] Selected images for prompt ${promptId}:`, {
          perPrompt: prompt.selectedImages?.length || 0,
          global: globalSelectedImages.length,
          using: effectiveImages.length,
          images: effectiveImages,
        });
        // TODO: Pass effectiveImages to video generation API when backend supports ingredient-based generation
      }

      const jobId = createJob(promptId, promptText);
      console.log(`[SingleVideoCreation] Starting video generation for prompt: ${promptId}`);

      try {
        const result = await veo3IPC.startVideoGeneration(
          effectiveProfileId,
          effectiveProjectId,
          promptText,
          "VIDEO_ASPECT_RATIO_LANDSCAPE"
        );

        if (!result.success) {
          console.error("[SingleVideoCreation] Video generation failed:", result.error);
          alert.show({
            title: "Error",
            message: result.error || "Failed to start video generation",
            severity: "error",
          });
          updateJobStatus(jobId, "failed", {
            error: result.error || "Unknown error",
          });
          return;
        }

        const { generationId } = result.data;
        console.log(`[SingleVideoCreation] Video generation started: ${generationId}`);

        updateJobStatus(jobId, "processing", {
          generationId: generationId,
          progress: 0,
        });
      } catch (error) {
        console.error("[SingleVideoCreation] Exception during video generation:", error);
        alert.show({
          title: "Error",
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
        });
        updateJobStatus(jobId, "failed", {
          error: String(error),
        });
      }
    },
    [prompts, selectedProfileId, selectedProjectId, alert, createJob, updateJobStatus]
  );

  const handleCreateMultiple = useCallback(
    async (opts?: { skipConfirm?: boolean }) => {
      const selectedPrompts = prompts.filter((p) => p.selected);

      if (selectedPrompts.length === 0) {
        setAlertState({
          open: true,
          message: "Please select at least one prompt to generate videos",
          severity: "error",
        });
        return;
      }

      const promptsToGenerate = selectedPrompts.filter((prompt) => {
        const job = jobs.find((j) => j.promptId === prompt.id);
        return !job || job.status !== "completed";
      });

      const skippedCount = selectedPrompts.length - promptsToGenerate.length;

      if (promptsToGenerate.length === 0) {
        setAlertState({
          open: true,
          message: "All selected prompts already have completed videos. Please select prompts without videos.",
          severity: "warning",
        });
        return;
      }

      const invalidPrompts = promptsToGenerate.filter((p) => !p.text.trim());
      if (invalidPrompts.length > 0) {
        setAlertState({
          open: true,
          message: `${invalidPrompts.length} prompt(s) have no text. Please fill them in first.`,
          severity: "error",
        });
        return;
      }

      if (!opts?.skipConfirm) {
        const skippedMessage = skippedCount > 0 ? ` (${skippedCount} completed will be skipped)` : "";
        alert.show({
          title: "Starting Video Generation",
          message: `Generating videos for ${promptsToGenerate.length} prompt(s)${skippedMessage}...`,
          severity: "success",
          duration: 2000,
        });
      }

      console.log(`[MultiGen] Starting batch generation for ${promptsToGenerate.length} prompts`);

      const requests = promptsToGenerate.map((prompt) => {
        const effectiveProfileId = prompt.profileId || selectedProfileId;
        const effectiveProjectId = prompt.projectId || selectedProjectId;

        return {
          promptId: prompt.id,
          profileId: effectiveProfileId,
          projectId: effectiveProjectId,
          prompt: prompt.text,
          aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE" as const,
        };
      });

      const invalidRequests = requests.filter((r) => !r.profileId || !r.projectId);
      if (invalidRequests.length > 0) {
        setAlertState({
          open: true,
          message: `${invalidRequests.length} prompt(s) are missing profile or project.\n\nPlease select a global profile/project or set them individually for each prompt.`,
          severity: "error",
        });
        return;
      }

      const jobMap = new Map<string, string>();
      for (const prompt of promptsToGenerate) {
        const jobId = createJob(prompt.id, prompt.text);
        jobMap.set(prompt.id, jobId);
      }

      try {
        const cleanup = veo3IPC.onMultipleVideosProgress((progress) => {
          console.log(`[MultiGen] Progress event:`, progress);
          const { promptId, generationId, success, error } = progress;

          const currentJobs = useVideoCreationStore.getState().jobs;
          const updateStatus = useVideoCreationStore.getState().updateJobStatus;

          if (success && generationId) {
            const job = currentJobs.find((j) => j.promptId === promptId);
            if (job) {
              updateStatus(job.id, "processing", { generationId, progress: 0 });
            }
          } else if (error) {
            const job = currentJobs.find((j) => j.promptId === promptId);
            if (job) {
              updateStatus(job.id, "failed", { error });
            }
          }
        });

        const result = await veo3IPC.generateMultipleVideosAsync(requests, 1500);

        if (!result.success || !result.data) {
          console.error("[MultiGen] Batch generation failed:", result.error);
          setAlertState({
            open: true,
            message: `Error: ${result.error || "Unknown error"}`,
            severity: "error",
          });

          for (const [, jobId] of jobMap.entries()) {
            updateJobStatus(jobId, "failed", { error: result.error || "Batch generation failed" });
          }
          return;
        }

        const { batchId, total } = result.data;
        console.log(`[MultiGen] Batch started (${batchId}), ${total} videos will be processed`);

        const skippedMessage = skippedCount > 0 ? `\n\n${skippedCount} completed prompt(s) were skipped.` : "";
        setAlertState({
          open: true,
          message: `Batch generation started!${skippedMessage}\n\n${total} video(s) will be generated with delays between each request.`,
          severity: "success",
        });

        const cleanupTimeout = setTimeout(() => {
          console.log("[MultiGen] Cleaning up event listener");
          cleanup();
        }, total * 1500 + 10000);

        (window as any).__multiGenCleanup = { cleanup, timeout: cleanupTimeout };
      } catch (error) {
        console.error("[MultiGen] Error during batch generation:", error);
        setAlertState({
          open: true,
          message: `Error: ${error}`,
          severity: "error",
        });

        for (const [, jobId] of jobMap.entries()) {
          updateJobStatus(jobId, "failed", { error: String(error) });
        }
      }
    },
    [prompts, jobs, selectedProfileId, selectedProjectId, alert, createJob, updateJobStatus]
  );

  const handleDownloadSelected = useCallback(async () => {
    console.log("[SingleVideoCreation] handleDownloadSelected called");

    const selectedPrompts = prompts.filter((p) => p.selected);

    if (selectedPrompts.length === 0) {
      alert.show({
        title: "No Selection",
        message: "Please select at least one prompt to download videos",
        severity: "warning",
      });
      return;
    }

    const videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }> = [];
    for (const prompt of selectedPrompts) {
      const job = jobs.find((j) => j.promptId === prompt.id && j.status === "completed");

      if (job && job.videoUrl) {
        videos.push({
          videoUrl: job.videoUrl,
          filename: `video-${prompt.order}.mp4`,
          videoIndex: prompt.order,
        });
      }
    }

    if (videos.length === 0) {
      alert.show({
        title: "No Completed Videos",
        message: "No completed videos found for selected prompts",
        severity: "warning",
      });
      return;
    }

    try {
      const result = await (window as any).electronAPI.invoke("dialog:showOpenDialog", {
        properties: ["openDirectory", "createDirectory"],
        title: "Select Download Folder",
        defaultPath: singleVideoPath || undefined,
      });

      const dialogResult = result.success ? result.data : result;

      if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        console.log("[SingleVideoCreation] Download cancelled by user");
        return;
      }

      const selectedFolder = dialogResult.filePaths[0];
      setSingleVideoPath(selectedFolder);

      toast.info(`Downloading ${videos.length} video(s)...`, "Download", 3000);

      const downloadResult = await (window as any).electronAPI.invoke("video:download:batch", {
        videos,
        downloadPath: selectedFolder,
      });

      if (downloadResult.success) {
        toast.success(`Downloaded ${videos.length} video(s) successfully!`, "Download Complete", 3000);
      } else {
        alert.show({
          title: "Download Error",
          message: downloadResult.error || "Failed to download videos",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("[SingleVideoCreation] Download error:", error);
      alert.show({
        title: "Error",
        message: `Failed to download videos: ${error}`,
        severity: "error",
      });
    }
  }, [prompts, jobs, singleVideoPath, setSingleVideoPath, toast, alert]);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(
      prompts.map((p) => ({ text: p.text, order: p.order })),
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [prompts]);

  const handleCopyJson = useCallback(() => {
    const json = JSON.stringify(
      prompts.map((p) => ({ text: p.text, order: p.order })),
      null,
      2
    );
    navigator.clipboard.writeText(json).then(() => {
      toast.success("Prompts copied to clipboard", "Copied", 2000);
    });
  }, [prompts, toast]);

  const handleShowInfo = useCallback(
    (promptId: string) => {
      const job = jobs.find((j) => j.promptId === promptId);
      if (job) {
        console.log("Job info:", job);
      }
    },
    [jobs]
  );

  const handleShowInFolder = useCallback(
    (path: string) => {
      console.log("Show in folder:", path);
      alert.show({
        message: "This will open the folder in your OS explorer",
        severity: "info",
      });
    },
    [alert]
  );

  const handleDownload = useCallback(
    (url: string) => {
      console.log("Download:", url);
      alert.show({
        message: "Download functionality will be implemented",
        severity: "info",
      });
    },
    [alert]
  );

  const handleOpenHistory = useCallback(() => {
    navigate("/video-creation/history");
  }, [navigate]);

  const value: SingleVideoCreationContextValue = {
    selectedProfileId,
    selectedProjectId,
    setSelectedProfileId,
    setSelectedProjectId,
    alertState,
    setAlertState,
    handleCreateVideo,
    handleCreateMultiple,
    handleDownloadSelected,
    handleExportJson,
    handleCopyJson,
    handleOpenHistory,
    handleShowInfo,
    handleShowInFolder,
    handleDownload,
    hasSelection,
  };

  return <SingleVideoCreationContext.Provider value={value}>{children}</SingleVideoCreationContext.Provider>;
}

/**
 * Hook to access Single Video Creation context
 */
export function useSingleVideoCreation() {
  const context = useContext(SingleVideoCreationContext);
  if (!context) {
    throw new Error("useSingleVideoCreation must be used within a SingleVideoCreationProvider");
  }
  return context;
}
