import { useEffect, useState, useMemo } from "react";
import { History, User } from "lucide-react";
import veo3IPC from "../../ipc/veo3";
import { useNavigate } from "react-router-dom";
import { useDrawer } from "@hooks/useDrawer";
import { useAlert } from "@hooks/useAlert";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useFilePathsStore } from "@store/file-paths.store";
import { useToast } from "@hooks/useToast";
import AppAlert from "@components/common/AppAlert";
import AddJsonModal from "@/renderer/components/video-creation/single-video-page/AddJsonModal";
// Draft manager removed: drafts are persisted automatically to zustand
import JobDetailsModal from "@/renderer/components/video-creation/single-video-page/JobDetailsModal";
import JsonToolbar from "@/renderer/components/video-creation/single-video-page/JsonToolbar";
import ProfileDrawer from "@/renderer/components/video-creation/single-video-page/ProfileDrawer";
import VideoPromptRow from "@/renderer/components/video-creation/single-video-page/VideoPromptRow";

export default function SingleVideoCreationPage() {
  const [showAddJsonModal, setShowAddJsonModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });

  const { openDrawer, closeDrawer } = useDrawer();
  const navigate = useNavigate();

  // Subscribe to specific store values to ensure re-renders
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);
  // drafts are persisted automatically in the store; manual manager removed

  const globalPreviewMode = useVideoCreationStore((state) => state.globalPreviewMode);
  const statusFilter = useVideoCreationStore((state) => state.statusFilter);
  const sortBy = useVideoCreationStore((state) => state.sortBy);

  // Actions
  const addPrompt = useVideoCreationStore((state) => state.addPrompt);
  const removePrompt = useVideoCreationStore((state) => state.removePrompt);
  const updatePrompt = useVideoCreationStore((state) => state.updatePrompt);
  const togglePromptSelection = useVideoCreationStore((state) => state.togglePromptSelection);
  const togglePromptPreview = useVideoCreationStore((state) => state.togglePromptPreview);
  const togglePromptProfileSelect = useVideoCreationStore((state) => state.togglePromptProfileSelect);
  const updatePromptProfile = useVideoCreationStore((state) => state.updatePromptProfile);
  const updatePromptProject = useVideoCreationStore((state) => state.updatePromptProject);
  const loadFromJson = useVideoCreationStore((state) => state.loadFromJson);
  const undo = useVideoCreationStore((state) => state.undo);
  const redo = useVideoCreationStore((state) => state.redo);
  const canUndo = useVideoCreationStore((state) => state.canUndo);
  const canRedo = useVideoCreationStore((state) => state.canRedo);
  // saveDraft/loadDraft deprecated; methods are no-ops in the store
  const createJob = useVideoCreationStore((state) => state.createJob);
  const updateJobStatus = useVideoCreationStore((state) => state.updateJobStatus);
  const clearAllPrompts = useVideoCreationStore((state) => state.clearAllPrompts);
  const toggleGlobalPreview = useVideoCreationStore((state) => state.toggleGlobalPreview);
  const setStatusFilter = useVideoCreationStore((state) => state.setStatusFilter);
  const setSortBy = useVideoCreationStore((state) => state.setSortBy);

  const toast = useToast();
  const alert = useAlert(); // Ensure global previews are enabled by default when entering the single creation page
  useEffect(() => {
    // Ensure global preview mode is enabled. toggleGlobalPreview is a toggle (no args),
    // so call it only when the current mode is false.
    if (!globalPreviewMode) {
      try {
        toggleGlobalPreview();
      } catch (e) {
        // ignore; best-effort to enable previews
      }
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSelection = prompts.some((p) => p.selected);

  // Filter and sort prompts based on status and sort preference
  const filteredPrompts = useMemo(() => {
    return prompts
      .filter((prompt) => {
        if (statusFilter === "all") return true;

        const job = jobs.find((j) => j.promptId === prompt.id);

        if (statusFilter === "idle") {
          return !job; // No job exists for this prompt
        }

        return job?.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === "status") {
          // Sort by status priority
          const statusPriority: Record<string, number> = {
            failed: 1,
            processing: 2,
            completed: 3,
            idle: 4,
          };

          const jobA = jobs.find((j) => j.promptId === a.id);
          const jobB = jobs.find((j) => j.promptId === b.id);

          const statusA = jobA?.status || "idle";
          const statusB = jobB?.status || "idle";

          const priorityA = statusPriority[statusA] || 999;
          const priorityB = statusPriority[statusB] || 999;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // Within same status, sort by array index
          return a.order - b.order;
        }

        // Sort by index (array order)
        return a.order - b.order;
      });
  }, [prompts, jobs, statusFilter, sortBy]);

  // Listen for custom event to toggle profile drawer
  useEffect(() => {
    const handleToggleProfileDrawer = () => {
      handleOpenProfileDrawer();
    };

    window.addEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
    return () => window.removeEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
  }, [selectedProfileId, selectedProjectId]);

  // Listen for VEO3 events and update job status
  useEffect(() => {
    console.log("[SingleVideoCreationPage] 🔄 Setting up VEO3 event listeners...");

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.on) {
      console.error("[SingleVideoCreationPage] ❌ electronAPI.on not available!");
      return;
    }

    console.log("[SingleVideoCreationPage] ✅ electronAPI.on available, setting up listeners...");

    // Listen for generation status updates from backend polling
    const unsubStatus = electronAPI.on("veo3:generation:status", (data: any) => {
      console.log("[SingleVideoCreationPage] 📨 veo3:generation:status event received:", data);

      const { generationId, promptId, status, videoUrl, error, progress } = data;

      // Get current jobs from store to avoid stale closure
      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      // Find the job by generationId or promptId
      const job = currentJobs.find((j) => j.generationId === generationId || j.promptId === promptId);

      if (job) {
        console.log(`[SingleVideoCreationPage] 🔄 Updating job ${job.id} with status: ${status}`);

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
        console.warn(`[SingleVideoCreationPage] ⚠️ No job found for generationId: ${generationId}, promptId: ${promptId}`);
      }
    });

    // Listen for batch progress (when each video starts generating)
    const unsubProgress = electronAPI.on("veo3:multipleVideos:progress", (data: any) => {
      console.log("[SingleVideoCreationPage] 📨 veo3:multipleVideos:progress event received:", data);

      const { promptId, generationId, success, error } = data;

      // Get current jobs from store to avoid stale closure
      const currentJobs = useVideoCreationStore.getState().jobs;
      const updateStatus = useVideoCreationStore.getState().updateJobStatus;

      if (success && generationId) {
        // Find job by promptId and update with generationId
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          console.log(`[SingleVideoCreationPage] 🔄 Updating job ${job.id} with generationId: ${generationId}`);
          updateStatus(job.id, "processing", {
            generationId,
            progress: 0,
          });
        }
      } else if (error) {
        const job = currentJobs.find((j) => j.promptId === promptId);
        if (job) {
          console.error(`[SingleVideoCreationPage] ❌ Job ${job.id} failed: ${error}`);
          updateStatus(job.id, "failed", {
            error,
          });
        }
      }
    });

    const unsubBatchStarted = electronAPI.on("veo3:batch:started", (data: any) => {
      console.log("[SingleVideoCreationPage] 📨 veo3:batch:started event received:", data);
    });

    console.log("[SingleVideoCreationPage] ✅ All event listeners registered!");

    return () => {
      console.log("[SingleVideoCreationPage] 🛑 Unsubscribing from event listeners");
      if (unsubStatus) unsubStatus();
      if (unsubProgress) unsubProgress();
      if (unsubBatchStarted) unsubBatchStarted();
    };
  }, []); // Empty deps - listeners set up once and use getState() to get current data

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleCreateVideo = async (promptId: string, promptText: string) => {
    if (!promptText.trim()) {
      alert.show({
        message: "Prompt text cannot be empty",
        severity: "warning",
      });
      return;
    }

    // Get the prompt to determine which profile/project to use
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
    console.log(`[VideoCreation] Starting video generation for prompt: ${promptId}`);
    console.log(`[VideoCreation] Using profile: ${effectiveProfileId}, project: ${effectiveProjectId}`);

    try {
      // Call backend to start video generation
      const result = await veo3IPC.startVideoGeneration(
        effectiveProfileId,
        effectiveProjectId,
        promptText,
        "VIDEO_ASPECT_RATIO_LANDSCAPE" // Default aspect ratio, can be made configurable later
      );

      if (!result.success) {
        console.error("[VideoCreation] Failed to start video generation:", result.error);
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
      console.log(`[VideoCreation] Video generation started: ${generationId}`);
      console.log(`[VideoCreation] Scene ID: ${sceneId}, Operation: ${operationName}`);

      // Update job to processing status and store generationId - use store method to trigger re-render
      updateJobStatus(jobId, "processing", {
        generationId: generationId,
        progress: 0,
      });

      console.log(
        `[VideoCreation] Job ${jobId} updated with generationId: ${generationId}. VideoPromptRow will now poll for status updates.`
      );
    } catch (error) {
      console.error("[VideoCreation] Exception during video generation:", error);
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
  };

  const handleAddJson = (jsonString: string) => {
    const success = loadFromJson(jsonString, "add");
    return success;
  };

  // Register a profile drawer API that uses the real ProfileDrawerContent so shortcuts can open it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const api = (window as any).__veo3_drawer_api;
    (window as any).__veo3_profile_drawer_api = {
      toggle: () => {
        try {
          if (api && typeof api.toggle === "function") {
            api.toggle({
              title: "Profile & Project Selection",
              icon: <User className="w-5 h-5" />,
              children: (
                <ProfileDrawer
                  initialProfileId={selectedProfileId || null}
                  initialProjectId={selectedProjectId || null}
                  onApply={(p, pr) => {
                    setSelectedProfileId(p || "");
                    setSelectedProjectId(pr || "");
                    // closeDrawer will be handled by ProfileDrawer via onApply if desired
                  }}
                />
              ),
            });
          } else {
            // fallback to dispatch event
            window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
          }
        } catch (err) {
          console.error("[Profile API] Failed to toggle profile drawer", err);
          window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
        }
      },
      isOpen: () => (api && typeof api.isOpen === "function" ? api.isOpen() : false),
    };

    return () => {
      try {
        delete (window as any).__veo3_profile_drawer_api;
      } catch (e) {
        /* ignore */
      }
    };
  }, [selectedProfileId, selectedProjectId]);

  const handleCreateMultiple = async (opts?: { skipConfirm?: boolean }) => {
    // Get selected prompts
    const selectedPrompts = prompts.filter((p) => p.selected);

    if (selectedPrompts.length === 0) {
      setAlertState({
        open: true,
        message: "Please select at least one prompt to generate videos",
        severity: "error",
      });
      return;
    }

    // Filter out prompts that already have completed jobs
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

    // Validate all selected prompts have text
    const invalidPrompts = promptsToGenerate.filter((p) => !p.text.trim());
    if (invalidPrompts.length > 0) {
      setAlertState({
        open: true,
        message: `${invalidPrompts.length} prompt(s) have no text. Please fill them in first.`,
        severity: "error",
      });
      return;
    }

    // Confirmation is handled in toolbar for toolbar clicks (skipConfirm=true)
    // This fallback message only shows if called programmatically without confirmation
    if (!opts?.skipConfirm) {
      const skippedMessage = skippedCount > 0 ? ` (${skippedCount} completed will be skipped)` : "";
      alert.show({
        title: "Starting Video Generation",
        message: `Generating videos for ${promptsToGenerate.length} prompt(s)${skippedMessage}...`,
        severity: "success",
        duration: 2000, // Auto-dismiss after 2 seconds
      });
    }

    console.log(`[MultiGen] Starting batch generation for ${promptsToGenerate.length} prompts (${skippedCount} skipped)`);

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
      setAlertState({
        open: true,
        message: `${invalidRequests.length} prompt(s) are missing profile or project.\n\nPlease select a global profile/project or set them individually for each prompt.`,
        severity: "error",
      });
      return;
    }

    // Create jobs for all prompts immediately (with "processing" status)
    const jobMap = new Map<string, string>(); // promptId -> jobId
    for (const prompt of promptsToGenerate) {
      const jobId = createJob(prompt.id, prompt.text);
      jobMap.set(prompt.id, jobId);
    }

    try {
      // Set up event listener for progress updates (BEFORE calling async method)
      console.log(`[MultiGen] Setting up progress event listener...`);
      const cleanup = veo3IPC.onMultipleVideosProgress((progress) => {
        console.log(`[MultiGen] 🎯 Progress event received for prompt ${progress.promptId}:`, progress);

        const jobId = jobMap.get(progress.promptId);
        if (!jobId) {
          console.warn(
            `[MultiGen] ⚠️ No job found for promptId: ${progress.promptId}. Available jobs:`,
            Array.from(jobMap.keys())
          );
          return;
        }

        if (progress.success && progress.generationId) {
          console.log(`[MultiGen] ✅ [${progress.index}/${progress.total}] Video generation started: ${progress.generationId}`);
          console.log(`[MultiGen] Updating job ${jobId} with generationId ${progress.generationId}`);

          // Update job with generationId - this will trigger polling in VideoPromptRow
          updateJobStatus(jobId, "processing", {
            generationId: progress.generationId,
            progress: 0,
          });

          console.log(`[MultiGen] Job ${jobId} updated successfully`);
        } else {
          console.error(`[MultiGen] ❌ [${progress.index}/${progress.total}] Failed: ${progress.error}`);

          updateJobStatus(jobId, "failed", {
            error: progress.error || "Unknown error",
          });
        }
      });
      console.log(`[MultiGen] Event listener registered. Cleanup function created:`, !!cleanup);

      // Call backend async method - returns immediately
      console.log(`[MultiGen] Calling async backend for ${requests.length} videos...`);
      const result = await veo3IPC.generateMultipleVideosAsync(requests, 1500); // 1.5s delay between requests

      if (!result.success || !result.data) {
        console.error("[MultiGen] Failed to start batch generation:", result.error);
        setAlertState({
          open: true,
          message: `Failed to start batch generation: ${result.error}`,
          severity: "error",
        });
        cleanup(); // Clean up event listener

        // Mark all jobs as failed
        for (const [, jobId] of jobMap.entries()) {
          updateJobStatus(jobId, "failed", {
            error: result.error || "Batch generation failed",
          });
        }
        return;
      }

      const { batchId, total } = result.data;
      console.log(`[MultiGen] Batch started (${batchId}), ${total} videos will be processed in background`);

      const skippedMessage = skippedCount > 0 ? `\n\n${skippedCount} completed prompt(s) were skipped.` : "";
      setAlertState({
        open: true,
        message: `Batch generation started!${skippedMessage}\n\n${total} video(s) will be generated with delays between each request.\n\nEach video will update independently as processing starts.`,
        severity: "success",
      });

      // Clean up event listener after a reasonable time (total * delayMs + buffer)
      const cleanupTimeout = setTimeout(() => {
        cleanup();
        console.log(`[MultiGen] Event listener cleaned up for batch ${batchId}`);
      }, total * 1500 + 10000); // Add 10s buffer

      // Store cleanup reference if needed later
      (window as any).__multiGenCleanup = { cleanup, timeout: cleanupTimeout };
    } catch (error) {
      console.error("[MultiGen] Error during batch generation:", error);
      setAlertState({
        open: true,
        message: `Error: ${error}`,
        severity: "error",
      });

      // Mark all jobs as failed
      for (const [, jobId] of jobMap.entries()) {
        updateJobStatus(jobId, "failed", {
          error: String(error),
        });
      }
    }
  };

  const { singleVideoPath, setSingleVideoPath } = useFilePathsStore();

  const handleDownloadSelected = async () => {
    console.log("[SingleVideoCreationPage] handleDownloadSelected called");

    const selectedPrompts = prompts.filter((p) => p.selected);
    console.log(`[SingleVideoCreationPage] Selected prompts: ${selectedPrompts.length}`);

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
        `[SingleVideoCreationPage] Prompt ${prompt.id}: job found=${!!job}, status=${job?.status}, videoUrl=${job?.videoUrl}`
      );

      if (job && job.videoUrl) {
        videos.push({
          videoUrl: job.videoUrl,
          filename: prompt.text ? `${prompt.text.substring(0, 50).replace(/[<>:"|?*]/g, "-")}` : `video-${job.id}`,
          videoIndex: prompt.order,
        });
      }
    }

    console.log(`[SingleVideoCreationPage] Videos to download: ${videos.length}`);

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
      console.log("[SingleVideoCreationPage] Opening folder selection dialog...");

      const result = await (window as any).electronAPI.invoke("dialog:showOpenDialog", {
        properties: ["openDirectory", "createDirectory"],
        title: "Select Download Folder",
        defaultPath: singleVideoPath || undefined,
      });

      console.log("[SingleVideoCreationPage] Dialog result:", result);

      // Dialog handler wraps response in {success, data}, extract the actual dialog result
      const dialogResult = result.success ? result.data : result;

      if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        console.log("[SingleVideoCreationPage] Dialog cancelled");
        return;
      }

      const selectedFolder = dialogResult.filePaths[0];
      console.log(`[SingleVideoCreationPage] Selected folder: ${selectedFolder}`);

      setSingleVideoPath(selectedFolder);

      toast.info(`Downloading ${videos.length} video(s)...`, "Download", 3000);

      console.log(`[SingleVideoCreationPage] Calling video:download:batch with ${videos.length} videos to ${selectedFolder}`);

      const downloadResult = await (window as any).electronAPI.video.download.batch(videos, selectedFolder);

      console.log("[SingleVideoCreationPage] Download result:", downloadResult);

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
      console.error("[SingleVideoCreationPage] Download error:", error);
      alert.show({
        title: "Download Error",
        message: message,
        severity: "error",
      });
    }
  };

  // manual save/load handlers removed - drafts are auto-persisted

  const handleExportJson = () => {
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
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(
      prompts.map((p) => ({ text: p.text, order: p.order })),
      null,
      2
    );
    navigator.clipboard.writeText(json).then(() => {
      toast.success("✓ JSON copied to clipboard", "Copy Complete", 3000);
    });
  };

  const handleShowInfo = (promptId: string) => {
    const job = jobs.find((j) => j.promptId === promptId);
    if (job) {
      setSelectedJobId(job.id);
    }
  };

  const handleShowInFolder = (path: string) => {
    // TODO: Implement with IPC
    console.log("Show in folder:", path);
    alert.show({
      message: "This will open the folder in your OS explorer",
      severity: "info",
    });
  };

  const handleDownload = (url: string) => {
    // TODO: Implement download
    console.log("Download:", url);
    alert.show({
      message: "Download functionality will be implemented",
      severity: "info",
    });
  };

  const handleOpenHistory = () => {
    // Navigate to the central history page instead of opening a drawer
    navigate("/video-creation/history");
  };

  const handleOpenProfileDrawer = () => {
    openDrawer({
      title: "Profile & Project Selection",
      icon: <User className="w-5 h-5" />,
      children: (
        <ProfileDrawer
          initialProfileId={selectedProfileId || null}
          initialProjectId={selectedProjectId || null}
          onApply={(p, pr) => {
            setSelectedProfileId(p || "");
            setSelectedProjectId(pr || "");
          }}
          onClose={closeDrawer}
        />
      ),
    });
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Single Video Creation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create videos using single or multiple prompts</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenProfileDrawer}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                selectedProfileId
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}
              title="Select profile & project (Ctrl+F)"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={handleOpenHistory}
              className="relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
              title="Open History"
            >
              <History className="w-4 h-4 opacity-95" />
              <span className="text-sm">History</span>

              <span className="ml-2 inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/90 text-orange-600 font-medium text-xs shadow-sm">
                {jobs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="mb-4">
          <JsonToolbar
            canUndo={canUndo()}
            canRedo={canRedo()}
            hasSelection={hasSelection}
            globalPreviewMode={globalPreviewMode}
            statusFilter={statusFilter}
            selectedCount={prompts.filter((p) => p.selected).length}
            totalCount={prompts.length}
            onUndo={undo}
            onRedo={redo}
            onAddJson={() => setShowAddJsonModal(true)}
            onClearAll={clearAllPrompts}
            onExportJson={handleExportJson}
            onCopyJson={handleCopyJson}
            onToggleGlobalPreview={toggleGlobalPreview}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
            currentSort={sortBy}
            onCreateMultiple={handleCreateMultiple}
            onDownloadSelected={handleDownloadSelected}
            onSelectAll={useVideoCreationStore.getState().selectAllPrompts}
            onDeselectAll={useVideoCreationStore.getState().clearAllSelections}
          />
        </div>

        {/* Add Prompt button in-flow (takes up the row) */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="absolute -inset-1 rounded-full border-2 border-rose-300 opacity-60 transform-gpu animate-pulse-slow"
                aria-hidden="true"
              ></span>
              <button
                onClick={addPrompt}
                aria-label="Add New Prompt"
                title="Add New Prompt"
                className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_10px_36px_rgba(79,70,229,0.18)] hover:shadow-[0_16px_48px_rgba(79,70,229,0.22)] transform hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* spacer to visually align with previous layout */}
            <div className="flex-1">
              {/* previously the prompt input area begins here; keeping spacer ensures the button sits on the left of the prompt row */}
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <div className="space-y-3">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No prompts match the current filter</p>
            </div>
          ) : (
            filteredPrompts.map((prompt, index) => {
              const job = jobs.find((j) => j.promptId === prompt.id);
              return (
                <VideoPromptRow
                  key={prompt.id}
                  prompt={prompt}
                  index={index}
                  canDelete={prompts.length > 1}
                  globalPreviewMode={globalPreviewMode}
                  globalProfileId={selectedProfileId}
                  job={job}
                  onUpdate={updatePrompt}
                  onDelete={removePrompt}
                  onToggleSelect={togglePromptSelection}
                  onTogglePreview={togglePromptPreview}
                  onCreate={handleCreateVideo}
                  onShowInfo={handleShowInfo}
                  onToggleProfileSelect={togglePromptProfileSelect}
                  onProfileChange={updatePromptProfile}
                  onProjectChange={updatePromptProject}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <AddJsonModal isOpen={showAddJsonModal} onClose={() => setShowAddJsonModal(false)} onAdd={handleAddJson} />

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJobId(null)}
        onShowInFolder={handleShowInFolder}
        onDownload={handleDownload}
      />

      {/* Draft manager and manual save dialog removed - drafts persist automatically */}

      {/* AppAlert for validation and notifications */}
      {alertState.open && (
        <AppAlert
          title={alertState.severity === "error" ? "Error" : alertState.severity === "success" ? "Success" : "Notice"}
          message={alertState.message}
          severity={alertState.severity}
          onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
