import { useEffect, useRef } from "react";
import veo3IPC from "../ipc/veo3";
import { Logger } from "../../shared/utils/logger";

const logger = new Logger("useUpscalePolling");

export interface UpscalePollingOptions {
  enabled?: boolean;
  interval?: number;
  onStatusUpdate?: (upscaleData: any) => void;
  onError?: (error: string) => void;
  onCompleted?: (upscaleData: any) => void;
}

/**
 * Hook to poll upscale status from database
 * Polls every `interval` ms while enabled
 * Only triggers callbacks when status changes
 */
export const useUpscalePolling = (upscaleId: string | null, options: UpscalePollingOptions = {}) => {
  const { enabled = true, interval = 10000, onStatusUpdate, onError, onCompleted } = options;

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !upscaleId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const upscaleData = await veo3IPC.checkUpscaleStatus(upscaleId);

        if (!upscaleData) {
          logger.warn(`[useUpscalePolling] No upscale data found for ID: ${upscaleId}`);
          return;
        }

        // Only trigger callback if status actually changed
        if (lastStatusRef.current !== upscaleData.status) {
          logger.info(`[useUpscalePolling] 📡 Poll update - Status: ${lastStatusRef.current} → ${upscaleData.status}`);
          lastStatusRef.current = upscaleData.status;
          onStatusUpdate?.(upscaleData);

          // Check if upscale is completed
          if (upscaleData.status === "completed" || upscaleData.status === "failed") {
            logger.info(`[useUpscalePolling] Upscale ${upscaleData.status}: ${upscaleId}`);
            onCompleted?.(upscaleData);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[useUpscalePolling] Poll error: ${errorMessage}`);
        onError?.(errorMessage);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, upscaleId, interval, onStatusUpdate, onError, onCompleted]);
};

/**
 * Hook to poll multiple upscale statuses from database
 * Batches all requests into a single IPC call
 * Only triggers callbacks when status changes per upscale
 */
export const useMultipleUpscalePolling = (upscaleIds: string[], options: UpscalePollingOptions = {}) => {
  const { enabled = true, interval = 10000, onStatusUpdate, onError, onCompleted } = options;

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!enabled || upscaleIds.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        // Fetch all upscale statuses in batch
        const upscaleDataArray = await Promise.all(upscaleIds.map((id) => veo3IPC.checkUpscaleStatus(id)));

        upscaleDataArray.forEach((upscaleData: any) => {
          if (!upscaleData) return;

          const upscaleId = upscaleData.id;
          const previousStatus = lastStatusRef.current[upscaleId];

          // Only trigger callback if status changed
          if (previousStatus !== upscaleData.status) {
            logger.info(`[useMultipleUpscalePolling] 📡 Poll update - ${upscaleId}: ${previousStatus} → ${upscaleData.status}`);
            lastStatusRef.current[upscaleId] = upscaleData.status;
            onStatusUpdate?.(upscaleData);

            // Check if upscale is completed
            if (upscaleData.status === "completed" || upscaleData.status === "failed") {
              logger.info(`[useMultipleUpscalePolling] Upscale ${upscaleData.status}: ${upscaleId}`);
              onCompleted?.(upscaleData);
            }
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[useMultipleUpscalePolling] Poll error: ${errorMessage}`);
        onError?.(errorMessage);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, interval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, upscaleIds, interval, onStatusUpdate, onError, onCompleted]);
};
