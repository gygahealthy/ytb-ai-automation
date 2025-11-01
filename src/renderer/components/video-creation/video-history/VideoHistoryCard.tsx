import { Calendar, CheckCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { VideoGeneration } from "src/shared/types/video-creation.types";
import PreviewPanel from "../../common/PreviewPanel";
import StatusBadge from "./history-card/StatusBadge";
import TechnicalDetails from "./history-card/TechnicalDetails";
import VideoLink from "./history-card/VideoLink";
import DownloadVideo from "./history-card/DownloadVideo";
import UpscaleVideo from "./history-card/UpscaleVideo";
import { useSingleGenerationPolling } from "../../../contexts/VideoGenerationPollingContext";

export default function VideoHistoryCard({
  generation,
  onRefresh,
  refreshingId,
  globalPreview,
}: {
  generation: VideoGeneration;
  onRefresh: (g: VideoGeneration) => void;
  refreshingId: string | null;
  globalPreview?: boolean;
}) {
  const [showPreview, setShowPreview] = useState<boolean>(!!globalPreview);

  // Only poll if generation is processing or pending (not completed/failed)
  const shouldPoll = generation.status === "processing" || generation.status === "pending";
  const { progress } = useSingleGenerationPolling(shouldPoll ? generation.id : null);

  // Sync showPreview when globalPreview changes
  useEffect(() => {
    setShowPreview(!!globalPreview);
  }, [globalPreview]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAspectRatioLabel = (aspectRatio: string) => {
    switch (aspectRatio) {
      case "VIDEO_ASPECT_RATIO_LANDSCAPE":
        return "Landscape (16:9)";
      case "VIDEO_ASPECT_RATIO_PORTRAIT":
        return "Portrait (9:16)";
      case "VIDEO_ASPECT_RATIO_SQUARE":
        return "Square (1:1)";
      default:
        return aspectRatio;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-0 flex">
        {/* Left preview column - only render when visible. Wider preview for better visibility */}
        {(globalPreview || showPreview) && (
          <div className="w-96 p-4 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="w-full h-56 bg-gray-50 dark:bg-gray-900/20 rounded-md overflow-hidden">
              <PreviewPanel job={generation} pollingProgress={progress} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="p-6 flex-1 min-h-[160px]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {/* External link icon near title */}
                  <VideoLink generation={generation} />
                  {/* Download video button */}
                  <DownloadVideo generation={generation} />
                  {/* Upscale video button */}
                  <UpscaleVideo generation={generation} />
                  {/* Toggle preview */}
                  <button
                    onClick={() => setShowPreview((s) => !s)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-900/30"
                    title={showPreview ? "Hide preview" : "Show preview"}
                  >
                    {showPreview ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {/* Refresh button (only for non-completed) */}
                  {generation.status !== "completed" && (
                    <button
                      onClick={() => onRefresh(generation)}
                      disabled={refreshingId === generation.id}
                      className="flex-shrink-0 p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Check Status"
                    >
                      <RefreshCw className={`w-5 h-5 ${refreshingId === generation.id ? "animate-spin" : ""}`} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{generation.prompt}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">{getAspectRatioLabel(generation.aspectRatio)}</span>
              <StatusBadge status={generation.status} />
            </div>
          </div>

          {generation.status === "processing" && (
            <div className="mb-4 animate-pulse">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner mb-2">
                <div
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">🎬 Generating video...</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{progress}%</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(generation.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">Seed: {generation.seed}</span>
            </div>
            {generation.completedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-4 h-4" />
                <span>Done: {formatDate(generation.completedAt)}</span>
              </div>
            )}
          </div>

          {generation.errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{generation.errorMessage}</p>
            </div>
          )}

          <TechnicalDetails generation={generation} />
        </div>
      </div>
    </div>
  );
}
