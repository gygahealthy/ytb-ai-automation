import { useEffect, useCallback } from "react";
import veo3IPC from "@/renderer/ipc/veo3";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useAlert } from "@hooks/useAlert";

/**
 * Hook to handle video generation logic for single and batch creation
 */
export function useVideoGeneration() {
  const alert = useAlert();

  // Store actions
  const createJob = useVideoCreationStore((state) => state.createJob);
  const updateJobStatus = useVideoCreationStore((state) => state.updateJobStatus);

  /**
   * Set up event listeners for video generation status updates
   */
  useEffect(() => {
    console.log("[useVideoGeneration] 🔄 Setting up VEO3 event listeners...");

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.on) {
      console.error("[useVideoGeneration] ❌ electronAPI.on not available!");
      return;
    }

    console.log("[useVideoGeneration] ✅ electronAPI.on available, setting up listeners...");

    // Listen for generation status updates from backend polling
    const unsubStatus = electronAPI.on("veo3:generation:status", (data: any) => {
      console.log("[useVideoGeneration] 📨 veo3:generation:status event received:", data);

      const { generationId, promptId, status, videoUrl, error, progress } = data;

      // Get current jobs from store to avoid stale closure
      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      // Find the job by generationId or promptId
      const job = currentJobs.find((j) => j.generationId === generationId || j.promptId === promptId);

      if (job) {
        console.log(`[useVideoGeneration] 🔄 Updating job ${job.id} with status: ${status}`);

        if (status === "completed") {
          updateStatus(job.id, "completed", {
            videoUrl,
            progress: 100,
          });
        } else if (status === "failed") {
          updateStatus(job.id, "failed", {
            error,
            progress: 0,
          });
        } else if (status === "processing") {
          updateStatus(job.id, "processing", {
            progress: progress || job.progress || 0,
          });
        }
      } else {
        console.warn(
          `[useVideoGeneration] ⚠️ No job found for generationId: ${generationId}, promptId: ${promptId}`
        );
      }
    });

    // Listen for batch progress (when each video starts generating)
    const unsubProgress = electronAPI.on("veo3:multipleVideos:progress", (data: any) => {
      console.log("[useVideoGeneration] 📨 veo3:multipleVideos:progress event received:", data);

      const { promptId, generationId, success, error } = data;

      // Get current jobs from store to avoid stale closure
      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      if (success && generationId) {
        // Find job by promptId and update with generationId
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          console.log(`[useVideoGeneration] 🔄 Updating job ${job.id} with generationId: ${generationId}`);
          updateStatus(job.id, "processing", {
            generationId,
            progress: 0,
          });
        }
      } else if (error) {
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          console.error(`[useVideoGeneration] ❌ Job ${job.id} failed: ${error}`);
          updateStatus(job.id, "failed", {
            error,
          });
        }
      }
    });

    const unsubBatchStarted = electronAPI.on("veo3:batch:started", (data: any) => {
      console.log("[useVideoGeneration] 📨 veo3:batch:started event received:", data);
    });

    console.log("[useVideoGeneration] ✅ All event listeners registered!");

    return () => {
      console.log("[useVideoGeneration] 🛑 Unsubscribing from event listeners");
      if (unsubStatus) unsubStatus();
      if (unsubProgress) unsubProgress();
      if (unsubBatchStarted) unsubBatchStarted();
    };
  }, []); // Empty deps - listeners set up once and use getState() to get current data

  /**
   * Create a single video from a prompt
   */
  const handleCreateVideo = useCallback(
    async (promptId: string, promptText: string, selectedProfileId: string, selectedProjectId: string) => {
      if (!promptText.trim()) {
        alert.show({
          message: "Prompt text cannot be empty",
          severity: "warning",
        });
        return;
      }

      // Get the prompt to determine which profile/project to use
      const prompts = useVideoCreationStore.getState().prompts;
      const prompt = prompts.find((p) => p.id === promptId);
      if (!prompt) {
        alert.show({
          message: "Prompt not found",
          severity: "error",
        });
        return;
      }

      // Determine effective profile and project
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

      // Create job in store with "processing" status
      const jobId = createJob(promptId, promptText);
      console.log(`[useVideoGeneration] Starting video generation for prompt: ${promptId}`);
      console.log(`[useVideoGeneration] Using profile: ${effectiveProfileId}, project: ${effectiveProjectId}`);

      try {
        // Call backend to start video generation
        const result = await veo3IPC.startVideoGeneration(
          effectiveProfileId,
          effectiveProjectId,
          promptText,
          "VIDEO_ASPECT_RATIO_LANDSCAPE" // Default aspect ratio, can be made configurable later
        );

        if (!result.success) {
          console.error("[useVideoGeneration] Failed to start video generation:", result.error);
          alert.show({
            title: "Generation Failed",
            message: `Failed to start video generation: ${result.error}`,
            severity: "error",
          });
          // Update job status to failed using store method
          updateJobStatus(jobId, "failed", {
            error: result.error,
          });
          return;
        }

        const { generationId, sceneId, operationName } = result.data;
        console.log(`[useVideoGeneration] Video generation started: ${generationId}`);
        console.log(`[useVideoGeneration] Scene ID: ${sceneId}, Operation: ${operationName}`);

        // Update job to processing status and store generationId - use store method to trigger re-render
        updateJobStatus(jobId, "processing", {
          generationId: generationId,
          progress: 0,
        });

        console.log(
          `[useVideoGeneration] Job ${jobId} updated with generationId: ${generationId}. VideoPromptRow will now poll for status updates.`
        );
      } catch (error) {
        console.error("[useVideoGeneration] Exception during video generation:", error);
        alert.show({
          title: "Error",
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
        });
        // Update job status to failed using store method
        updateJobStatus(jobId, "failed", {
          error: String(error),
        });
      }
    },
    [alert, createJob, updateJobStatus]
  );

  /**
   * Create multiple videos from selected prompts
   */
  const handleCreateMultiple = useCallback(
    async (
      selectedProfileId: string,
      selectedProjectId: string,
      _opts?: { skipConfirm?: boolean }
    ): Promise<{ success: boolean; message?: string; skippedCount?: number; generatedCount?: number }> => {
      // Get selected prompts
      const prompts = useVideoCreationStore.getState().prompts;
      const jobs = useVideoCreationStore.getState().jobs;
      const selectedPrompts = prompts.filter((p) => p.selected);

      if (selectedPrompts.length === 0) {
        return {
          success: false,
          message: "Please select at least one prompt to generate videos",
        };
      }

      // Filter out prompts that already have completed jobs
      const promptsToGenerate = selectedPrompts.filter((prompt) => {
        const job = jobs.find((j) => j.promptId === prompt.id);
        return !job || job.status !== "completed";
      });

      const skippedCount = selectedPrompts.length - promptsToGenerate.length;

      if (promptsToGenerate.length === 0) {
        return {
          success: false,
          message: "All selected prompts already have completed videos. Please select prompts without videos.",
        };
      }

      // Validate all selected prompts have text
      const invalidPrompts = promptsToGenerate.filter((p) => !p.text.trim());
      if (invalidPrompts.length > 0) {
        return {
          success: false,
          message: `${invalidPrompts.length} prompt(s) have no text. Please fill them in first.`,
        };
      }

      console.log(
        `[useVideoGeneration] Starting batch generation for ${promptsToGenerate.length} prompts (${skippedCount} skipped)`
      );

      // Prepare requests for all selected prompts
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

      // Validate all requests have profile and project
      const invalidRequests = requests.filter((r) => !r.profileId || !r.projectId);
      if (invalidRequests.length > 0) {
        return {
          success: false,
          message: `${invalidRequests.length} prompt(s) are missing profile or project.\n\nPlease select a global profile/project or set them individually for each prompt.`,
        };
      }

      // Create jobs for all prompts immediately (with "processing" status)
      const jobMap = new Map<string, string>(); // promptId -> jobId
      for (const prompt of promptsToGenerate) {
        const jobId = createJob(prompt.id, prompt.text);
        jobMap.set(prompt.id, jobId);
      }

      try {
        // Set up event listener for progress updates (BEFORE calling async method)
        console.log(`[useVideoGeneration] Setting up progress event listener...`);
        const cleanup = veo3IPC.onMultipleVideosProgress((progress) => {
          console.log(`[useVideoGeneration] 🎯 Progress event received for prompt ${progress.promptId}:`, progress);

          const jobId = jobMap.get(progress.promptId);
          if (!jobId) {
            console.warn(
              `[useVideoGeneration] ⚠️ No job found for promptId: ${progress.promptId}. Available jobs:`,
              Array.from(jobMap.keys())
            );
            return;
          }

          if (progress.success && progress.generationId) {
            console.log(
              `[useVideoGeneration] ✅ [${progress.index}/${progress.total}] Video generation started: ${progress.generationId}`
            );
            console.log(`[useVideoGeneration] Updating job ${jobId} with generationId ${progress.generationId}`);

            // Update job with generationId - this will trigger polling in VideoPromptRow
            updateJobStatus(jobId, "processing", {
              generationId: progress.generationId,
              progress: 0,
            });

            console.log(`[useVideoGeneration] Job ${jobId} updated successfully`);
          } else {
            console.error(`[useVideoGeneration] ❌ [${progress.index}/${progress.total}] Failed: ${progress.error}`);

            updateJobStatus(jobId, "failed", {
              error: progress.error || "Unknown error",
            });
          }
        });
        console.log(`[useVideoGeneration] Event listener registered. Cleanup function created:`, !!cleanup);

        // Call backend async method - returns immediately
        console.log(`[useVideoGeneration] Calling async backend for ${requests.length} videos...`);
        const result = await veo3IPC.generateMultipleVideosAsync(requests, 1500); // 1.5s delay between requests

        if (!result.success || !result.data) {
          console.error("[useVideoGeneration] Failed to start batch generation:", result.error);
          cleanup(); // Clean up event listener

          // Mark all jobs as failed
          for (const [, jobId] of jobMap.entries()) {
            updateJobStatus(jobId, "failed", {
              error: result.error || "Batch generation failed",
            });
          }

          return {
            success: false,
            message: `Failed to start batch generation: ${result.error}`,
          };
        }

        const { batchId, total } = result.data;
        console.log(`[useVideoGeneration] Batch started (${batchId}), ${total} videos will be processed in background`);

        // Clean up event listener after a reasonable time (total * delayMs + buffer)
        const cleanupTimeout = setTimeout(() => {
          cleanup();
          console.log(`[useVideoGeneration] Event listener cleaned up for batch ${batchId}`);
        }, total * 1500 + 10000); // Add 10s buffer

        // Store cleanup reference if needed later
        (window as any).__multiGenCleanup = { cleanup, timeout: cleanupTimeout };

        return {
          success: true,
          skippedCount,
          generatedCount: total,
        };
      } catch (error) {
        console.error("[useVideoGeneration] Error during batch generation:", error);

        // Mark all jobs as failed
        for (const [, jobId] of jobMap.entries()) {
          updateJobStatus(jobId, "failed", {
            error: String(error),
          });
        }

        return {
          success: false,
          message: `Error: ${error}`,
        };
      }
    },
    [createJob, updateJobStatus]
  );

  return {
    handleCreateVideo,
    handleCreateMultiple,
  };
}
