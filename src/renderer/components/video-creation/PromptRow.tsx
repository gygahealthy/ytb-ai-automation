import { Archive, CheckCircle2, Eye, EyeOff, Info, Play, Video } from "lucide-react";
import { Prompt, VideoCreationJob } from "../../types/video-creation.types";

interface PromptRowProps {
  prompt: Prompt;
  index: number;
  canDelete: boolean;
  globalPreviewMode: boolean;
  job?: VideoCreationJob;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onTogglePreview: (id: string) => void;
  onCreate: (id: string, text: string) => void;
  onShowInfo: (id: string) => void;
}

export default function PromptRow({
  prompt,
  index,
  canDelete,
  globalPreviewMode,
  job,
  onUpdate,
  onDelete,
  onToggleSelect,
  onTogglePreview,
  onCreate,
  onShowInfo,
}: PromptRowProps) {
  const isValid = prompt.text.trim().length > 0;
  // Per-row preview: independent toggle even in global mode
  // If global mode is on, individual row can still hide its preview
  const showPreview = globalPreviewMode ? !prompt.showPreview : prompt.showPreview || false;

  // Determine row status for the left-edge indicator
  // If there's a job, use its status. Map 'idle' to 'new'. Otherwise treat as 'new'.
  const rawStatus = job?.status ?? "new";
  const status = rawStatus === "idle" ? "new" : rawStatus;

  // Support an optional `archived` flag on Prompt; the shared type doesn't include it so access safely
  const isArchived = (prompt as any)?.archived === true;

  const statusColor: Record<string, string> = {
    new: "bg-gray-300 dark:bg-gray-600",
    processing: "bg-blue-400 dark:bg-blue-700",
    completed: "bg-green-400 dark:bg-green-700",
    failed: "bg-red-400 dark:bg-red-700",
    archived: "bg-gray-200 dark:bg-gray-800",
  };

  const getStatusBadge = () => {
    if (!job) return null;
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed: { label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      processing: { label: "Processing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      failed: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      idle: { label: "Idle", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
    };
    const config = statusConfig[job.status] || statusConfig.idle;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-lg transition-transform transform will-change-transform ${
        prompt.selected
          ? "bg-primary-50 dark:bg-primary-900/20 shadow-2xl -translate-y-1"
          : "bg-white dark:bg-gray-800 shadow-md -translate-y-0.5 hover:shadow-2xl hover:-translate-y-1.5"
      }`}
      style={{ height: "180px" }}
    >
      {/* Left-edge status indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${isArchived ? statusColor.archived : statusColor[status]}`}
        title={isArchived ? "Archived" : status}
        aria-hidden="true"
      />
      {/* Video Created Indicator */}
      {job && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
      )}
      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-start pt-2">
        <input
          type="checkbox"
          checked={prompt.selected || false}
          onChange={() => onToggleSelect(prompt.id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
        />
      </div>

      {/* Index */}
      <div className="flex-shrink-0 flex items-start pt-1">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm">
          {index + 1}
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="flex-shrink-0 w-64 h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50">
          {job?.videoUrl ? (
            <video src={job.videoUrl} className="w-full h-full object-contain" controls />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Video className="w-12 h-12 text-gray-400" />
              <span className="text-xs text-gray-400">No video yet</span>
            </div>
          )}
        </div>
      )}

      {/* Vertical Action Buttons - Organized by function groups */}
      <div className="flex-shrink-0 flex flex-col gap-1 items-center justify-center py-2 px-1 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* View Controls Group */}
        <div className="flex flex-col gap-1 pb-1 mb-1 border-b border-gray-300 dark:border-gray-600">
          {/* Preview Toggle Button */}
          <button
            onClick={() => onTogglePreview(prompt.id)}
            className={`p-2 rounded-md transition-all shadow-sm ${
              showPreview
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            }`}
            title={
              globalPreviewMode
                ? showPreview
                  ? "Hide this preview"
                  : "Show this preview"
                : showPreview
                ? "Hide preview"
                : "Show preview"
            }
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Info Button */}
          <button
            onClick={() => job && onShowInfo(job.id)}
            disabled={!job}
            className={`p-2 rounded-md transition-all shadow-sm ${
              job
                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
            }`}
            title={job ? "View job details" : "No video created yet"}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-col gap-1">
          {/* Create Button */}
          <button
            onClick={() => onCreate(prompt.id, prompt.text)}
            disabled={!isValid}
            className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
            title="Create video from this prompt"
          >
            <Play className="w-4 h-4" />
          </button>

          {/* Archive/Delete Button */}
          {canDelete && (
            <button
              onClick={() => onDelete(prompt.id)}
              className="p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all shadow-sm border border-gray-200 dark:border-gray-600"
              title="Delete this prompt"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Prompt Text - Takes remaining space and full height */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Status Badge at top */}
        {job && <div className="flex-shrink-0 mb-2">{getStatusBadge()}</div>}

        {/* Prompt Input - Takes all remaining height */}
        <div className="flex-1 overflow-hidden">
          <textarea
            value={prompt.text}
            onChange={(e) => onUpdate(prompt.id, e.target.value)}
            placeholder={`Enter prompt ${index + 1}...`}
            className="w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Progress Bar - Only visible when processing */}
        {job?.status === "processing" && job.progress !== undefined && (
          <div className="flex-shrink-0 w-full mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{job.progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
