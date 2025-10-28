import { useEffect, useRef } from "react";
import veo3IPC from "../ipc/veo3";
import { VideoGeneration } from "../../shared/types/video-creation.types";
import { Logger } from "../../shared/utils/logger";

const logger = new Logger("useGenerationPolling");

interface PollingOptions {
  enabled?: boolean;
  interval?: number; // milliseconds, default 10000 (10 seconds)
  onStatusUpdate?: (generation: VideoGeneration) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for polling video generation status from the database
 * Lightweight DB queries that don't hit the external API
 *
 * @param generationId - Single generation ID to poll, or null to disable
 * @param options - Polling options
 */
export const useGenerationPolling = (generationId: string | null, options: PollingOptions = {}) => {
  const { enabled = true, interval = 10000, onStatusUpdate, onError } = options;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<VideoGeneration | null>(null);

  useEffect(() => {
    if (!enabled || !generationId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const result = await veo3IPC.pollGenerationStatusDB(generationId);

        if (result.success && result.data) {
          const generation = result.data;

          // Only notify if status changed
          if (
            !lastStatusRef.current ||
            lastStatusRef.current.status !== generation.status ||
            lastStatusRef.current.videoUrl !== generation.videoUrl ||
            lastStatusRef.current.errorMessage !== generation.errorMessage
          ) {
            lastStatusRef.current = generation;
            onStatusUpdate?.(generation);
          }
        } else {
          logger.warn(`[useGenerationPolling] Poll returned error: ${result.error}`);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[useGenerationPolling] Poll error: ${err.message}`);
        onError?.(err);
      }
    };

    // Initial poll immediately
    poll();

    // Set up interval for subsequent polls
    pollingIntervalRef.current = setInterval(poll, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, generationId, interval, onStatusUpdate, onError]);
};

/**
 * Custom hook for polling multiple video generation statuses
 *
 * @param generationIds - Array of generation IDs to poll
 * @param options - Polling options
 */
export const useMultipleGenerationPolling = (generationIds: string[], options: PollingOptions = {}) => {
  const { enabled = true, interval = 10000, onStatusUpdate, onError } = options;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusesRef = useRef<Map<string, VideoGeneration>>(new Map());

  useEffect(() => {
    if (!enabled || generationIds.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const result = await veo3IPC.pollMultipleGenerationStatusDB(generationIds);

        if (result.success && result.data) {
          const generations = Array.isArray(result.data) ? result.data : [];

          for (const generation of generations) {
            const lastStatus = lastStatusesRef.current.get(generation.id);

            // Only notify if status changed
            if (
              !lastStatus ||
              lastStatus.status !== generation.status ||
              lastStatus.videoUrl !== generation.videoUrl ||
              lastStatus.errorMessage !== generation.errorMessage
            ) {
              lastStatusesRef.current.set(generation.id, generation);
              onStatusUpdate?.(generation);
            }
          }
        } else {
          logger.warn(`[useMultipleGenerationPolling] Poll returned error: ${result.error}`);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[useMultipleGenerationPolling] Poll error: ${err.message}`);
        onError?.(err);
      }
    };

    // Initial poll immediately
    poll();

    // Set up interval for subsequent polls
    pollingIntervalRef.current = setInterval(poll, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, generationIds.join(","), interval, onStatusUpdate, onError]);
};
