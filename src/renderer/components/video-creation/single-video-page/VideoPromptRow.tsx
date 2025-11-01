import { CheckCircle2, Image as ImageIcon, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useVideoCreationStore } from "../../../store/video-creation.store";
import { Prompt, VideoCreationJob } from "../../../types/video-creation.types";
import PreviewPanel from "../../common/PreviewPanel";
import ActionControls from "../video-prompt-row/ActionControls";
import { useSingleGenerationPolling } from "../../../contexts/VideoGenerationPollingContext";
import { useModal } from "../../../hooks/useModal";
import { ImageSelectionModal } from "../../common/modals/ImageSelectionModal";
import { useImageCache } from "../../../contexts/ImageCacheContext";
import type { VideoCreationMode } from "./VideoCreationModeTabs";

interface VideoPromptRowProps {
  prompt: Prompt;
  index: number;
  canDelete: boolean;
  globalPreviewMode: boolean;
  globalProfileId?: string;
  job?: VideoCreationJob;
  creationMode?: VideoCreationMode;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onTogglePreview: (id: string) => void;
  onCreate: (id: string, text: string) => void;
  onShowInfo: (id: string) => void;
  onToggleProfileSelect: (id: string) => void;
  onProfileChange: (id: string, profileId: string) => void;
  onProjectChange: (id: string, projectId: string) => void;
}

export default function VideoPromptRow({
  prompt,
  index,
  canDelete,
  globalPreviewMode,
  // globalProfileId, // Not used in this component
  job,
  creationMode = "text-to-video",
  onUpdate,
  onDelete,
  onToggleSelect,
  onTogglePreview,
  onCreate,
  onShowInfo,
}: VideoPromptRowProps) {
  const { openModal } = useModal();
  const { togglePromptImageSelection } = useVideoCreationStore();

  // Use shared image cache for thumbnails
  const { imageSrcCache } = useImageCache();

  // Only show image selection in ingredients mode
  const isIngredientsMode = creationMode === "ingredients";

  // Use centralized polling context - same pattern as VideoHistoryCard
  // Only poll if we have a generation ID and job is still processing
  const shouldPoll = job && job.generationId && job.status === "processing";
  const { generation: polledGeneration, progress: contextProgress } = useSingleGenerationPolling(
    shouldPoll ? job.generationId : null
  );

  // Sync polled data back to job store for persistence (completed/failed status)
  useEffect(() => {
    if (!polledGeneration || !job) return;

    // Sync status changes to store for persistence
    if (polledGeneration.status === "completed" && job.status !== "completed") {
      console.log(`[VideoPromptRow] 💾 Persisting completed status to store for job ${job.id}`);
      const { updateJobStatus: update } = useVideoCreationStore.getState();
      update(job.id, "completed", {
        videoUrl: polledGeneration.videoUrl,
        completedAt: new Date().toISOString(),
      });
    } else if (polledGeneration.status === "failed" && job.status !== "failed") {
      console.log(`[VideoPromptRow] 💾 Persisting failed status to store for job ${job.id}`);
      const { updateJobStatus: update } = useVideoCreationStore.getState();
      update(job.id, "failed", {
        error: polledGeneration.errorMessage,
        completedAt: new Date().toISOString(),
      });
    } else if (polledGeneration.status === "processing" && job.status === "idle") {
      // Update from idle to processing when polling detects it
      console.log(`[VideoPromptRow] 💾 Updating status from idle to processing for job ${job.id}`);
      const { updateJobStatus: update } = useVideoCreationStore.getState();
      update(job.id, "processing", {});
    }
  }, [polledGeneration?.status, polledGeneration?.videoUrl, polledGeneration?.errorMessage, job?.id, job?.status]);

  const isValid = prompt.text.trim().length > 0;
  // When globalPreviewMode is false (default), show all previews
  // When globalPreviewMode is true, hide all previews
  // Individual prompt.showPreview can override this behavior
  const showPreview = globalPreviewMode ? false : prompt.showPreview ?? true;

  useEffect(() => {
    console.log(
      `[VideoPromptRow] 🔄 Effect triggered - job:`,
      job?.id,
      `generationId:`,
      job?.generationId,
      `status:`,
      job?.status,
      `contextProgress:`,
      contextProgress
    );

    // Progress is now handled by centralized VideoGenerationPollingContext
    // which automatically increments 1% per second during processing
  }, [job?.id, job?.generationId, job?.status, contextProgress]);

  // CRITICAL: Use polled generation data when available (database is fresher than store cache)
  // Same pattern as VideoHistoryCard - polled data takes precedence
  const displayStatus = polledGeneration?.status || job?.status || "new";
  const displayVideoUrl = polledGeneration?.videoUrl || job?.videoUrl;
  const displayError = polledGeneration?.errorMessage || job?.error;

  // Create merged job object for PreviewPanel (combines job store + polled data)
  const displayJob = job
    ? {
        ...job,
        status: displayStatus,
        videoUrl: displayVideoUrl,
        error: displayError,
        videoPath: polledGeneration?.videoPath || job?.videoUrl, // Use polled videoPath if available
      }
    : undefined;

  const effectiveStatus = displayStatus;
  const rawStatus = effectiveStatus;
  const status = rawStatus === "idle" ? "new" : rawStatus === "pending" ? "processing" : rawStatus;
  const isArchived = (prompt as any)?.archived === true;
  const statusColor: Record<string, string> = {
    new: "bg-gray-300 dark:bg-gray-600",
    processing: "bg-blue-400 dark:bg-blue-700",
    completed: "bg-green-400 dark:bg-green-700",
    failed: "bg-red-400 dark:bg-red-700",
    archived: "bg-gray-200 dark:bg-gray-800",
  };

  const getStatusBadge = () => {
    if (!displayJob) return null;
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed: { label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      processing: { label: "Processing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      failed: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      idle: { label: "Idle", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    };
    // Use display status (polled data takes absolute precedence for accuracy)
    const config = statusConfig[displayStatus] || statusConfig.idle;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-lg transition-transform transform will-change-transform ${
        prompt.selected
          ? "bg-primary-50 dark:bg-slate-900/30 shadow-2xl -translate-y-1"
          : "bg-white dark:bg-slate-900 shadow-md -translate-y-0.5 hover:shadow-2xl hover:-translate-y-1.5"
      }`}
      style={{ height: "180px" }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${isArchived ? statusColor.archived : statusColor[status]}`}
        title={isArchived ? "Archived" : status}
        aria-hidden="true"
      />

      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Image Selection Button - Only show in ingredients mode */}
        {isIngredientsMode && (
          <button
            onClick={() =>
              openModal({
                title: "Select Images for This Prompt (Max 3)",
                content: <ImageSelectionModal promptId={prompt.id} />,
                size: "lg",
              })
            }
            className={`p-1.5 rounded-md transition-all shadow-sm ${
              prompt.selectedImages && prompt.selectedImages.length > 0
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            }`}
            title={`Select images for this prompt (${prompt.selectedImages?.length || 0}/3 selected)`}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        {job && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      </div>

      {/* Selected Images Display - Bottom Right Corner - Only show in ingredients mode */}
      {isIngredientsMode && prompt.selectedImages && prompt.selectedImages.length > 0 && (
        <div className="absolute bottom-2 right-2 z-10 flex gap-1">
          {prompt.selectedImages.slice(0, 3).map((img) => (
            <div key={img.id} className="relative group">
              <div
                className="w-12 h-12 rounded border-2 border-purple-500 bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-lg"
                title={img.name}
              >
                {imageSrcCache[img.id] ? (
                  <img
                    src={imageSrcCache[img.id]}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Trash Icon - Half inside, half outside - Only visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePromptImageSelection(prompt.id, img);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                title="Remove from selection"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex-shrink-0 flex items-start pt-2">
        <input
          type="checkbox"
          checked={prompt.selected || false}
          onChange={() => onToggleSelect(prompt.id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
        />
      </div>

      <div className="flex-shrink-0 flex items-start pt-1">
        <div
          className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm border border-gray-200 dark:border-gray-700"
          aria-hidden
          style={{
            // ensure strong dark background and contrast for the index bubble
            backgroundColor: undefined,
          }}
        >
          <span className="dark:bg-slate-800 dark:text-gray-100 px-2 py-1 rounded-full">{index + 1}</span>
        </div>
      </div>

      {showPreview && (
        <div className="flex-shrink-0 w-64 h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50">
          <PreviewPanel job={displayJob} pollingProgress={contextProgress} />
        </div>
      )}

      <ActionControls
        showPreview={showPreview}
        onTogglePreview={onTogglePreview}
        job={displayJob}
        onShowInfo={onShowInfo}
        onCreate={onCreate}
        onDelete={onDelete}
        canDelete={canDelete}
        isValid={isValid}
        promptId={prompt.id}
        promptText={prompt.text}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Show status badge when job exists and preview is hidden (preview has its own status display) */}
        {displayJob && !showPreview && <div className="flex-shrink-0 mb-2">{getStatusBadge()}</div>}

        {/* Show progress bar only when processing, has generationId, and preview is hidden */}
        {displayJob && displayStatus === "processing" && displayJob.generationId && !showPreview && (
          <div className="flex-shrink-0 mb-2 animate-pulse">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${contextProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">🎬 Generating video...</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{contextProgress}%</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Auto-checking every 10 seconds</p>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <textarea
            value={prompt.text}
            onChange={(e) => onUpdate(prompt.id, e.target.value)}
            placeholder={`Enter prompt ${index + 1}...`}
            className={
              "w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm leading-relaxed caret-primary-600 selection:bg-primary-300 selection:text-white dark:selection:bg-primary-600 whitespace-pre-wrap"
            }
            style={{ minHeight: "100%" }}
          />
        </div>
      </div>

      {/* Image Selection Modal */}
    </div>
  );
}
