import { Loader2, Video, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import veo3IPC from "../../ipc/veo3";
import GenerationCard from "../../components/video-creation/video-history/GenerationCard";
import { VideoGeneration } from "src/shared/types/video-creation.types";

const VideoHistoryPage: React.FC = () => {
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "completed" | "failed">("all");
  const [globalPreview, setGlobalPreview] = useState<boolean>(true);

  const fetchGenerations = async () => {
    setLoading(true);
    try {
      const result = await veo3IPC.listGenerations(100, 0);
      if (result.success && result.data) {
        setGenerations(result.data);
      } else {
        console.error("[VideoHistory] Failed to fetch generations:", result.error);
      }
    } catch (error) {
      console.error("[VideoHistory] Error fetching generations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const handleRefreshStatus = async (generation: VideoGeneration) => {
    setRefreshingId(generation.id);
    try {
      const result = await veo3IPC.refreshVideoStatus(generation.operationName, generation.id);

      if (result.success) {
        console.log(`[VideoHistory] Status refreshed for ${generation.id}:`, result.data);
        // Refresh the list
        await fetchGenerations();

        if (result.data?.status === "completed") {
          alert(`Video completed! 🎉\nURL: ${result.data.videoUrl}`);
        }
      } else {
        console.error("[VideoHistory] Failed to refresh status:", result.error);
        alert(`Failed to refresh status: ${result.error}`);
      }
    } catch (error) {
      console.error("[VideoHistory] Error refreshing status:", error);
      alert(`Error: ${error}`);
    } finally {
      setRefreshingId(null);
    }
  };

  // helper functions moved into component files

  const filteredGenerations = generations.filter((gen) => {
    if (filter === "all") return true;
    return gen.status === filter;
  });

  const statusCounts = {
    all: generations.length,
    pending: generations.filter((g) => g.status === "pending").length,
    processing: generations.filter((g) => g.status === "processing").length,
    completed: generations.filter((g) => g.status === "completed").length,
    failed: generations.filter((g) => g.status === "failed").length,
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Video className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Creation History</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {statusCounts.all} total videos • {statusCounts.processing} in progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGlobalPreview((s) => !s)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-800 dark:text-gray-300"
            >
              {globalPreview ? "Hide Previews" : "Show Previews"}
            </button>

            <button
              onClick={fetchGenerations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {(["all", "processing", "completed", "failed", "pending"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === status
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredGenerations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No videos found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === "all" ? "Start creating videos to see them here" : `No ${filter} videos found`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGenerations.map((generation) => (
              <GenerationCard key={generation.id} generation={generation} refreshingId={refreshingId} onRefresh={handleRefreshStatus} globalPreview={globalPreview} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoHistoryPage;
