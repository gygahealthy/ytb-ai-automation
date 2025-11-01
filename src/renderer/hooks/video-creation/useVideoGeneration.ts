import { useEffect, useCallback } from "react";
import veo3IPC from "@/renderer/ipc/veo3";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useImageGalleryStore } from "@store/image-gallery.store";
import { useVEO3ModelsStore } from "@store/veo3-models.store";
import { useAlert } from "@hooks/useAlert";
import type { VideoCreationMode } from "@/renderer/components/video-creation/single-video-page/VideoCreationModeTabs";

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
        console.warn(`[useVideoGeneration] ⚠️ No job found for generationId: ${generationId}, promptId: ${promptId}`);
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
    async (
      promptId: string,
      promptText: string,
      selectedProfileId: string,
      selectedProjectId: string,
      creationMode?: VideoCreationMode
    ) => {
      if (!promptText.trim()) {
        alert.show({
          message: "Prompt text cannot be empty",
          severity: "warning",
        });
        return;
      }

      // Get the prompt to determine which profile/project/model to use
      const prompts = useVideoCreationStore.getState().prompts;
      // Model selection: use mode-specific default > hardcoded fallback (ignore global defaultModel for ingredients)
      const modeSpecificDefaultModel =
        creationMode === "ingredients"
          ? useVEO3ModelsStore.getState().defaultModelForImageReference || "veo_3_0_r2v_fast_ultra"
          : useVEO3ModelsStore.getState().defaultModelForTextToVideo || useVideoCreationStore.getState().defaultModel;
      const defaultModel = modeSpecificDefaultModel;
      const prompt = prompts.find((p) => p.id === promptId);
      if (!prompt) {
        alert.show({
          message: "Prompt not found",
          severity: "error",
        });
        return;
      }

      // Determine effective profile, project, and model
      const effectiveProfileId = prompt.profileId || selectedProfileId;
      const effectiveProjectId = prompt.projectId || selectedProjectId;
      const effectiveModel = prompt.model || defaultModel || undefined;

      console.log(
        `[useVideoGeneration] 🎬 Mode: ${creationMode}, defaultModel: ${defaultModel}, effectiveModel: ${effectiveModel}`
      );

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

      // Check if using ingredients mode
      const isIngredientsMode = creationMode === "ingredients";

      // If ingredients mode, check for selected images
      let imageReferences: Array<{ mediaId: string; imageId: string }> | undefined;
      if (isIngredientsMode) {
        // Use per-prompt selected images (not global gallery selection)
        const selectedImages = prompt.selectedImages || [];

        if (!selectedImages || selectedImages.length === 0) {
          alert.show({
            title: "Images Required",
            message: "Please select at least 1 image (maximum 3) from the Image Gallery for Ingredients mode",
            severity: "warning",
          });
          return;
        }

        if (selectedImages.length > 3) {
          alert.show({
            title: "Too Many Images",
            message: "Maximum 3 images allowed for Ingredients mode",
            severity: "warning",
          });
          return;
        }

        // Validate all images have name (CAMaJ... identifier)
        const invalidImages = selectedImages.filter((img) => !img.name);
        if (invalidImages.length > 0) {
          alert.show({
            title: "Invalid Images",
            message: "Some selected images are missing identifiers. Please re-select your images.",
            severity: "error",
          });
          return;
        }

        // Validate images belong to the selected profile
        const wrongProfileImages = selectedImages.filter((img) => img.profileId !== effectiveProfileId);
        if (wrongProfileImages.length > 0) {
          alert.show({
            title: "Profile Mismatch",
            message: `The selected images belong to a different profile. Please select images generated by the current profile.`,
            severity: "error",
          });
          return;
        }

        // Prepare image references for API (use 'name' as mediaId, which is the full CAMaJ... identifier)
        imageReferences = selectedImages.map((img) => ({
          mediaId: img.name, // name contains the full CAMaJ... identifier required by VEO3 API
          imageId: img.id,
        }));

        console.log(`[useVideoGeneration] Using ${imageReferences.length} image(s) for ingredients generation`);
      }

      // Create job in store with "processing" status
      const jobId = createJob(promptId, promptText, effectiveModel || undefined);
      console.log(`[useVideoGeneration] Starting video generation for prompt: ${promptId}`);
      console.log(`[useVideoGeneration] Mode: ${isIngredientsMode ? "ingredients" : "text-to-video"}`);
      console.log(
        `[useVideoGeneration] Using profile: ${effectiveProfileId}, project: ${effectiveProjectId}, model: ${effectiveModel}`
      );

      try {
        let result;

        // Call appropriate API based on mode
        if (isIngredientsMode && imageReferences) {
          // Call image-to-video API
          result = await (window as any).electronAPI.veo3.generateVideoFromImages(
            effectiveProfileId,
            effectiveProjectId,
            promptText,
            imageReferences,
            "VIDEO_ASPECT_RATIO_LANDSCAPE", // Default aspect ratio
            effectiveModel || "veo_3_0_r2v_fast_ultra" // Use model or default
          );
        } else {
          // Call text-to-video API
          result = await veo3IPC.startVideoGeneration(
            effectiveProfileId,
            effectiveProjectId,
            promptText,
            "VIDEO_ASPECT_RATIO_LANDSCAPE", // Default aspect ratio
            effectiveModel // Pass model if available
          );
        }

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
      creationMode?: VideoCreationMode,
      _opts?: { skipConfirm?: boolean }
    ): Promise<{ success: boolean; message?: string; skippedCount?: number; generatedCount?: number }> => {
      // Get selected prompts and default model
      const prompts = useVideoCreationStore.getState().prompts;
      const jobs = useVideoCreationStore.getState().jobs;
      // Model selection: use mode-specific default > hardcoded fallback (ignore global defaultModel for ingredients)
      const modeSpecificDefaultModel =
        creationMode === "ingredients"
          ? useVEO3ModelsStore.getState().defaultModelForImageReference || "veo_3_0_r2v_fast_ultra"
          : useVEO3ModelsStore.getState().defaultModelForTextToVideo || useVideoCreationStore.getState().defaultModel;
      const defaultModel = modeSpecificDefaultModel;
      const selectedPrompts = prompts.filter((p) => p.selected);

      if (selectedPrompts.length === 0) {
        return {
          success: false,
          message: "Please select at least one prompt to generate videos",
        };
      }

      // Validate global profile/project selection early
      if (!selectedProfileId) {
        return {
          success: false,
          message: "Please select a profile first (use the Profile selector at the top)",
        };
      }

      if (!selectedProjectId) {
        return {
          success: false,
          message: "Please select a project first (use the Profile selector at the top)",
        };
      }

      // Check if using ingredients mode
      const isIngredientsMode = creationMode === "ingredients";

      // If ingredients mode, validate selected images
      let imageReferences: Array<{ mediaId: string; imageId: string }> | undefined;
      if (isIngredientsMode) {
        const selectedImages = useImageGalleryStore.getState().selectedImages;

        if (!selectedImages || selectedImages.length === 0) {
          return {
            success: false,
            message: "Please select at least 1 image (maximum 3) from the Image Gallery for Ingredients mode",
          };
        }

        if (selectedImages.length > 3) {
          return {
            success: false,
            message: "Maximum 3 images allowed for Ingredients mode",
          };
        }

        // Validate all images have name (CAMaJ... identifier)
        const invalidImages = selectedImages.filter((img) => !img.name);
        if (invalidImages.length > 0) {
          return {
            success: false,
            message: "Some selected images are missing identifiers. Please re-select your images.",
          };
        }

        // Validate images belong to the selected profile
        const wrongProfileImages = selectedImages.filter((img) => img.profileId !== selectedProfileId);
        if (wrongProfileImages.length > 0) {
          return {
            success: false,
            message: `Some selected images belong to a different profile. Please select images from the current profile (${selectedProfileId}).`,
          };
        }

        // Prepare image references for API (use 'name' as mediaId, which is the full CAMaJ... identifier)
        imageReferences = selectedImages.map((img) => ({
          mediaId: img.name, // name contains the full CAMaJ... identifier required by VEO3 API
          imageId: img.id,
        }));

        console.log(`[useVideoGeneration] Batch using ${imageReferences.length} image(s) for ingredients generation`);
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
      console.log(`[useVideoGeneration] Mode: ${isIngredientsMode ? "ingredients" : "text-to-video"}`);

      // Create jobs for all prompts immediately (with "processing" status)
      const jobMap = new Map<string, string>(); // promptId -> jobId
      for (const prompt of promptsToGenerate) {
        const effectiveModel = prompt.model || defaultModel || undefined;
        const jobId = createJob(prompt.id, prompt.text, effectiveModel);
        jobMap.set(prompt.id, jobId);
      }

      try {
        // For ingredients mode with batch, we need to call the API for each prompt individually
        // since the batch API doesn't support image references yet
        if (isIngredientsMode && imageReferences && Array.isArray(imageReferences)) {
          console.log(`[useVideoGeneration] Using individual API calls for ingredients batch generation`);

          let successCount = 0;
          let failureCount = 0;

          for (const prompt of promptsToGenerate) {
            const effectiveProfileId = prompt.profileId || selectedProfileId;
            const effectiveProjectId = prompt.projectId || selectedProjectId;
            const effectiveModel = prompt.model || defaultModel;

            console.log(
              `[useVideoGeneration] Processing prompt ${prompt.id}: profileId=${effectiveProfileId}, projectId=${effectiveProjectId}, model=${effectiveModel}`
            );

            if (!effectiveProfileId || !effectiveProjectId) {
              const jobId = jobMap.get(prompt.id);
              console.error(`[useVideoGeneration] Missing profile or project for prompt ${prompt.id}`);
              if (jobId) {
                updateJobStatus(jobId, "failed", {
                  error: "Missing profile or project",
                });
              }
              failureCount++;
              continue;
            }

            try {
              // Clone imageReferences to avoid any spread/iteration issues
              const imageRefsClone = [...imageReferences];

              console.log(
                `[useVideoGeneration] Calling generateVideoFromImages for prompt ${prompt.id} with ${imageRefsClone.length} images, model: ${effectiveModel}`
              );

              const result = await (window as any).electronAPI.veo3.generateVideoFromImages(
                effectiveProfileId,
                effectiveProjectId,
                prompt.text,
                imageRefsClone,
                "VIDEO_ASPECT_RATIO_LANDSCAPE",
                effectiveModel || "veo_3_0_r2v_fast_ultra"
              );

              console.log(`[useVideoGeneration] Result for prompt ${prompt.id}:`, result);

              const jobId = jobMap.get(prompt.id);
              if (!jobId) {
                console.warn(`[useVideoGeneration] No jobId found for prompt ${prompt.id}`);
                continue;
              }

              if (result.success && result.data?.generationId) {
                console.log(`[useVideoGeneration] Success for prompt ${prompt.id}, generationId: ${result.data.generationId}`);
                updateJobStatus(jobId, "processing", {
                  generationId: result.data.generationId,
                  progress: 0,
                });
                successCount++;
              } else {
                console.error(`[useVideoGeneration] Failed for prompt ${prompt.id}:`, result.error);
                updateJobStatus(jobId, "failed", {
                  error: result.error || "Unknown error",
                });
                failureCount++;
              }

              // Add delay between requests
              if (promptsToGenerate.indexOf(prompt) < promptsToGenerate.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
              }
            } catch (error) {
              console.error(`[useVideoGeneration] Exception for prompt ${prompt.id}:`, error);
              const jobId = jobMap.get(prompt.id);
              if (jobId) {
                updateJobStatus(jobId, "failed", {
                  error: String(error),
                });
              }
              failureCount++;
            }
          }

          return {
            success: successCount > 0,
            skippedCount,
            generatedCount: successCount,
            message:
              failureCount > 0
                ? `${successCount} videos started with ${imageReferences.length} image(s), ${failureCount} failed`
                : `${successCount} videos started successfully with ${imageReferences.length} image(s)`,
          };
        }

        // Text-to-video mode: use batch API
        // Prepare requests for all selected prompts
        const requests = promptsToGenerate.map((prompt) => {
          const effectiveProfileId = prompt.profileId || selectedProfileId;
          const effectiveProjectId = prompt.projectId || selectedProjectId;
          const effectiveModel = prompt.model || defaultModel;

          return {
            promptId: prompt.id,
            profileId: effectiveProfileId,
            projectId: effectiveProjectId,
            prompt: prompt.text,
            aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE" as const,
            model: effectiveModel || undefined,
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
