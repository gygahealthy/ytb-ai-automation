import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import veo3IPC from "../ipc/veo3";
import { VideoGeneration } from "src/shared/types/video-creation.types";
import { useMultipleGenerationPolling } from "../hooks/useGenerationPolling";

interface DateGroup {
  date: string;
  dateLabel: string;
  items: VideoGeneration[];
}

interface VideoHistoryFilter {
  status: "all" | "pending" | "processing" | "completed" | "failed";
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

interface StatusCounts {
  all: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface VideoHistoryContextType {
  // State
  dateGroups: DateGroup[];
  loading: boolean;
  loadingMore: boolean;
  refreshingId: string | null;
  filter: VideoHistoryFilter;
  globalPreview: boolean;
  currentPage: number;
  hasMore: boolean;
  total: number;
  statusCounts: StatusCounts;
  observerTarget: React.RefObject<HTMLDivElement>;

  // Actions
  setFilter: (filter: VideoHistoryFilter) => void;
  setGlobalPreview: (value: boolean) => void;
  handleRefreshAll: () => Promise<void>;
  handleRefreshStatus: (generation: VideoGeneration) => Promise<void>;
  loadMoreVideos: () => void;
}

const VideoHistoryContext = createContext<VideoHistoryContextType | undefined>(undefined);

export const useVideoHistory = () => {
  const context = useContext(VideoHistoryContext);
  if (!context) {
    throw new Error("useVideoHistory must be used within VideoHistoryProvider");
  }
  return context;
};

interface VideoHistoryProviderProps {
  children: React.ReactNode;
  pageSize?: number;
}

export const VideoHistoryProvider: React.FC<VideoHistoryProviderProps> = ({ children, pageSize = 20 }) => {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [filter, setFilterState] = useState<VideoHistoryFilter>({ status: "all" });
  const [globalPreview, setGlobalPreview] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  // Collect all processing generation IDs for polling
  const processingGenerationIds = dateGroups.flatMap((group) =>
    group.items.filter((item) => item.status === "processing" || item.status === "pending").map((item) => item.id)
  );

  // Set up polling for active generations
  useMultipleGenerationPolling(processingGenerationIds, {
    enabled: processingGenerationIds.length > 0,
    interval: 10000, // Poll every 10 seconds
    onStatusUpdate: (generation) => {
      console.log(`[VideoHistory] 📡 Poll update for ${generation.id}: status=${generation.status}`);

      // Update the generation in the dateGroups
      setDateGroups((prevGroups) => {
        return prevGroups.map((group) => ({
          ...group,
          items: group.items.map((item) => (item.id === generation.id ? generation : item)),
        }));
      });

      // Update status counts if generation completed or failed
      if (generation.status === "completed" || generation.status === "failed") {
        fetchStatusCounts();
      }
    },
    onError: (error) => {
      console.error(`[VideoHistory] ❌ Poll error: ${error.message}`);
    },
  });

  const fetchStatusCounts = useCallback(async () => {
    try {
      const result = await veo3IPC.getStatusCounts();
      if (result.success && result.data) {
        setStatusCounts(result.data);
      }
    } catch (error) {
      console.error("[VideoHistory] Error fetching status counts:", error);
    }
  }, []);

  const fetchHistory = useCallback(
    async (page: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await veo3IPC.getVideoHistoryGroupedByDate(page, pageSize, filter);

        if (result.success && result.data) {
          const { groups, total: totalCount, hasMore: moreAvailable } = result.data;

          if (append) {
            // Merge new groups with existing ones
            setDateGroups((prev) => {
              const merged = [...prev];

              for (const newGroup of groups) {
                const existingIndex = merged.findIndex((g) => g.date === newGroup.date);
                if (existingIndex >= 0) {
                  // Merge items into existing group
                  merged[existingIndex].items = [...merged[existingIndex].items, ...newGroup.items];
                } else {
                  // Add new group
                  merged.push(newGroup);
                }
              }

              // Sort groups by date descending
              merged.sort((a, b) => b.date.localeCompare(a.date));
              return merged;
            });
          } else {
            // Replace all groups
            setDateGroups(groups);
          }

          setTotal(totalCount);
          setHasMore(moreAvailable);
        } else {
          console.error("[VideoHistory] Failed to fetch history:", result.error);
        }
      } catch (error) {
        console.error("[VideoHistory] Error fetching history:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, pageSize]
  );

  // Initial load when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setDateGroups([]);
    setHasMore(true);
    fetchHistory(1, false);
    fetchStatusCounts();
  }, [filter, fetchHistory, fetchStatusCounts]);

  const setFilter = useCallback((newFilter: VideoHistoryFilter) => {
    setFilterState(newFilter);
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setCurrentPage(1);
    setDateGroups([]);
    setHasMore(true);
    await fetchHistory(1, false);
    await fetchStatusCounts();
  }, [fetchHistory, fetchStatusCounts]);

  const handleRefreshStatus = useCallback(
    async (generation: VideoGeneration) => {
      setRefreshingId(generation.id);
      try {
        // Query DB only - worker thread handles API polling automatically
        const result = await veo3IPC.getGenerationStatusFromDB(generation.id);

        if (result.success) {
          console.log(`[VideoHistory] Status refreshed from DB for ${generation.id}:`, result.data);
          // Refresh the current view - this will update the video data silently
          await handleRefreshAll();
        } else {
          console.error("[VideoHistory] Failed to refresh status from DB:", result.error);
        }
      } catch (error) {
        console.error("[VideoHistory] Error refreshing status from DB:", error);
      } finally {
        setRefreshingId(null);
      }
    },
    [handleRefreshAll]
  );

  const loadMoreVideos = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistory(nextPage, true);
    }
  }, [hasMore, loading, loadingMore, currentPage, fetchHistory]);

  const value: VideoHistoryContextType = {
    dateGroups,
    loading,
    loadingMore,
    refreshingId,
    filter,
    globalPreview,
    currentPage,
    hasMore,
    total,
    statusCounts,
    observerTarget,
    setFilter,
    setGlobalPreview,
    handleRefreshAll,
    handleRefreshStatus,
    loadMoreVideos,
  };

  return <VideoHistoryContext.Provider value={value}>{children}</VideoHistoryContext.Provider>;
};
