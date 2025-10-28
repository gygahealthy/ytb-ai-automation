import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import veo3IPC from "../ipc/veo3";
import { VideoGeneration } from "../../shared/types/video-creation.types";
import { Logger } from "../../shared/utils/logger";

const logger = new Logger("VideoGenerationPollingContext");

interface VideoGenerationPollingState {
  // Active generations being polled (generationId -> VideoGeneration)
  activeGenerations: Map<string, VideoGeneration>;

  // Progress tracking (generationId -> progress percentage 0-100)
  progressMap: Map<string, number>;

  // Register a generation for polling
  registerGeneration: (generationId: string) => void;

  // Unregister a generation (when completed/failed)
  unregisterGeneration: (generationId: string) => void;

  // Get generation by ID
  getGeneration: (generationId: string) => VideoGeneration | null;

  // Get progress for a generation
  getProgress: (generationId: string) => number;

  // Force refresh all active generations
  refreshAll: () => Promise<void>;
}

const VideoGenerationPollingContext = createContext<VideoGenerationPollingState | undefined>(undefined);

interface VideoGenerationPollingProviderProps {
  children: React.ReactNode;
  pollInterval?: number; // Base interval in ms (default 10000)
  staggerDelay?: number; // Delay between each poll in ms (default 1000)
}

/**
 * Centralized Video Generation Polling Provider
 *
 * Manages real-time polling for all active video generations across the app.
 * Features:
 * - Staggered DB polling (1s delay between each video)
 * - 10s base polling interval
 * - Automatic cleanup when generations complete/fail
 * - Synced state across all components/pages
 * - Lightweight DB queries only
 */
export const VideoGenerationPollingProvider: React.FC<VideoGenerationPollingProviderProps> = ({
  children,
  pollInterval = 10000,
  staggerDelay = 1000,
}) => {
  const [activeGenerations, setActiveGenerations] = useState<Map<string, VideoGeneration>>(new Map());
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Poll a single generation from the database
   */
  const pollSingleGeneration = useCallback(async (generationId: string): Promise<VideoGeneration | null> => {
    try {
      const result = await veo3IPC.pollGenerationStatusDB(generationId);

      if (result.success && result.data) {
        return result.data;
      } else {
        logger.warn(`Failed to poll generation ${generationId}: ${result.error}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error polling generation ${generationId}: ${error}`);
      return null;
    }
  }, []);

  /**
   * Poll all active generations with staggered delays
   */
  const pollAllGenerations = useCallback(async () => {
    const generationIds = Array.from(activeGenerations.keys());

    if (generationIds.length === 0) {
      return;
    }

    logger.debug(`Polling ${generationIds.length} generation(s) with ${staggerDelay}ms stagger`);

    // Poll each generation with staggered delays
    for (let i = 0; i < generationIds.length; i++) {
      const generationId = generationIds[i];
      const delayMs = i * staggerDelay; // 0s, 1s, 2s, etc.

      // Apply stagger delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Poll this generation (don't await - let it run async)
      pollSingleGeneration(generationId)
        .then((generation) => {
          if (!generation) return;

          // Update state if status changed
          setActiveGenerations((prev) => {
            const existing = prev.get(generationId);

            // Only update if status/videoUrl/error changed
            if (
              !existing ||
              existing.status !== generation.status ||
              existing.videoUrl !== generation.videoUrl ||
              existing.errorMessage !== generation.errorMessage
            ) {
              logger.info(`Status changed for ${generationId}: ${generation.status}`);
              const next = new Map(prev);
              next.set(generationId, generation);

              // Stop polling when generation is completed or failed
              // Remove from active polling immediately
              if (generation.status === "completed" || generation.status === "failed") {
                logger.info(`Generation ${generationId} finished with status: ${generation.status}. Stopping polling.`);

                // Keep the final result visible for 30s, then remove
                setTimeout(() => {
                  setActiveGenerations((current) => {
                    const updated = new Map(current);
                    updated.delete(generationId);
                    logger.debug(`Auto-removed ${generation.status} generation: ${generationId}`);
                    return updated;
                  });
                }, 30000); // Keep for 30s after completion

                // Immediately remove from polling by not returning it in the map
                // This will cause activeGenerations.size to decrease and polling to stop
                next.delete(generationId);
              }

              return next;
            }

            return prev;
          });
        })
        .catch((err) => {
          logger.error(`Error in staggered poll for ${generationId}: ${err.message}`);
        });
    }
  }, [activeGenerations, staggerDelay, pollSingleGeneration]);

  /**
   * Start polling loop
   */
  useEffect(() => {
    if (activeGenerations.size === 0) {
      // No active generations - clear intervals
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Initial poll immediately
    pollAllGenerations();

    // Set up interval for subsequent polls
    pollingIntervalRef.current = setInterval(() => {
      pollAllGenerations();
    }, pollInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeGenerations.size, pollInterval, pollAllGenerations]);

  /**
   * Progress animation loop - increment 1% per second for processing videos
   */
  useEffect(() => {
    if (activeGenerations.size === 0) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      setProgressMap((prev) => {
        const next = new Map(prev);
        let updated = false;

        // Increment progress for all processing generations
        for (const [generationId, generation] of activeGenerations.entries()) {
          if (generation.status === "processing") {
            const currentProgress = next.get(generationId) || 0;

            // Increment by 1%, cap at 95% (will reach 100% on completion)
            if (currentProgress < 95) {
              next.set(generationId, currentProgress + 1);
              updated = true;
            }
          }
        }

        return updated ? next : prev;
      });
    }, 1000); // Update every 1 second

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [activeGenerations]);

  /**
   * Register a generation for polling
   */
  const registerGeneration = useCallback((generationId: string) => {
    setActiveGenerations((prev) => {
      if (prev.has(generationId)) {
        logger.debug(`Generation ${generationId} already registered`);
        return prev;
      }

      logger.info(`Registered generation for polling: ${generationId}`);
      const next = new Map(prev);

      // Add with placeholder data (will be updated by first poll)
      next.set(generationId, {
        id: generationId,
        status: "processing",
        prompt: "",
        profileId: "",
        projectId: "",
        aspectRatio: "VIDEO_ASPECT_RATIO_LANDSCAPE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as VideoGeneration);

      return next;
    });
  }, []);

  /**
   * Unregister a generation (manual cleanup)
   */
  const unregisterGeneration = useCallback((generationId: string) => {
    setActiveGenerations((prev) => {
      if (!prev.has(generationId)) {
        return prev;
      }

      logger.info(`Unregistered generation: ${generationId}`);
      const next = new Map(prev);
      next.delete(generationId);
      return next;
    });
  }, []);

  /**
   * Get generation by ID
   */
  const getGeneration = useCallback(
    (generationId: string): VideoGeneration | null => {
      return activeGenerations.get(generationId) || null;
    },
    [activeGenerations]
  );

  /**
   * Get progress for a generation
   */
  const getProgress = useCallback(
    (generationId: string): number => {
      const generation = activeGenerations.get(generationId);

      if (!generation) return 0;
      if (generation.status === "completed") return 100;
      if (generation.status === "failed") return 0;

      // Return animated progress for processing videos
      return progressMap.get(generationId) || 0;
    },
    [activeGenerations, progressMap]
  );

  /**
   * Force refresh all active generations
   */
  const refreshAll = useCallback(async () => {
    logger.info("Force refreshing all active generations");
    await pollAllGenerations();
  }, [pollAllGenerations]);

  const value: VideoGenerationPollingState = {
    activeGenerations,
    progressMap,
    registerGeneration,
    unregisterGeneration,
    getGeneration,
    getProgress,
    refreshAll,
  };

  return <VideoGenerationPollingContext.Provider value={value}>{children}</VideoGenerationPollingContext.Provider>;
};

/**
 * Hook to access video generation polling context
 */
export const useVideoGenerationPolling = (): VideoGenerationPollingState => {
  const context = useContext(VideoGenerationPollingContext);
  if (!context) {
    throw new Error("useVideoGenerationPolling must be used within VideoGenerationPollingProvider");
  }
  return context;
};

/**
 * Hook to poll a single generation with progress (simplified interface)
 * Returns object with generation data and progress percentage
 */
export const useSingleGenerationPolling = (generationId: string | null | undefined) => {
  const { registerGeneration, getGeneration, getProgress } = useVideoGenerationPolling();

  useEffect(() => {
    if (!generationId) return;

    registerGeneration(generationId);

    return () => {
      // Don't immediately unregister - let auto-cleanup handle it after 30s
      // This prevents flicker when components remount
    };
  }, [generationId, registerGeneration]);

  const generation = getGeneration(generationId || "");
  const progress = getProgress(generationId || "");

  return {
    generation,
    progress,
  };
};
