/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useRef, useCallback } from "react";

interface VideoCacheContextType {
  videoDataUrlCache: Record<string, string>; // filePath -> dataUrl/fileUrl
  isLoadingVideo: Record<string, boolean>; // filePath -> loading state
  loadVideoDataUrl: (videoPath: string | null) => Promise<string | null>;
  clearVideoCache: (videoPath?: string) => void;
}

interface VideoFileReadResult {
  success: boolean;
  data?: {
    dataUrl: string;
    mimeType: string;
    fileSize: number;
  };
  error?: string;
}

const VideoCacheContext = createContext<VideoCacheContextType | undefined>(undefined);

/**
 * Video Cache Provider
 *
 * Provides centralized video file loading and caching for video previews.
 * Uses persistent refs to avoid cache invalidation on re-renders.
 *
 * Features:
 * - Persistent cache across navigation (using useRef)
 * - Non-blocking file reads via worker threads
 * - Progressive loading and caching
 * - Automatic file:// protocol for large files
 * - Base64 data URLs for small files
 *
 * Usage: Use this context in VideoPromptRow, VideoHistoryCard, and PreviewPanel
 * to avoid duplicate file reads and blocking operations.
 */
export const VideoCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use refs instead of state to persist cache across re-renders and navigation
  const cacheRef = useRef<Record<string, string>>({});
  const loadingRef = useRef<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, Promise<string | null> | undefined>>({});

  /**
   * Load video file and convert to data URL or file:// protocol
   * Returns cached result if already loaded
   *
   * CRITICAL: Only accepts local file paths (file:// or absolute paths).
   * Rejects HTTP/HTTPS URLs immediately to prevent worker thread errors.
   */
  const loadVideoDataUrl = useCallback(async (videoPath: string | null): Promise<string | null> => {
    if (!videoPath) return null;

    // CRITICAL: Reject HTTP/HTTPS URLs - only local files can be read by worker
    if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
      console.warn("[VideoCacheContext] ⚠️ Rejecting HTTP/HTTPS URL (not cacheable), use remote URL directly:", videoPath);
      return null;
    }

    // Normalize path for consistent caching (forward slashes, lowercase drive letter)
    const normalizedPath = videoPath.replace(/\\/g, "/").toLowerCase();

    // Return cached result if available (check both original and normalized)
    if (cacheRef.current[videoPath]) {
      console.log("[VideoCacheContext] 💾 Cache hit (exact match):", videoPath);
      return cacheRef.current[videoPath];
    }
    if (cacheRef.current[normalizedPath]) {
      console.log("[VideoCacheContext] 💾 Cache hit (normalized match):", normalizedPath);
      return cacheRef.current[normalizedPath];
    }

    // Return pending promise if already loading (deduplication) - check both keys
    const existingPromise = pendingRef.current[videoPath] || pendingRef.current[normalizedPath];
    if (existingPromise) {
      console.log("[VideoCacheContext] ⏳ Returning pending load for video:", videoPath);
      return existingPromise;
    }

    // Start loading - use normalized path as primary key
    loadingRef.current[normalizedPath] = true;

    const loadPromise = (async () => {
      try {
        console.log("[VideoCacheContext] Loading video file:", videoPath);
        const api = window as unknown as {
          electronAPI: { veo3: { readVideoFile: (path: string) => Promise<VideoFileReadResult> } };
        };

        // Add timeout protection (30 seconds max for video loading)
        const timeoutPromise = new Promise<VideoFileReadResult>((_, reject) => {
          setTimeout(() => reject(new Error("Video load timeout (30s)")), 30000);
        });

        const result = await Promise.race([api.electronAPI.veo3.readVideoFile(videoPath), timeoutPromise]);

        if (result.success && result.data?.dataUrl) {
          const dataUrl = result.data.dataUrl;
          // Cache with both original and normalized paths for maximum hit rate
          cacheRef.current[videoPath] = dataUrl;
          cacheRef.current[normalizedPath] = dataUrl;
          console.log("[VideoCacheContext] ✓ Successfully loaded and cached video:", videoPath);
          console.log("[VideoCacheContext] 📌 Cache keys:", [videoPath, normalizedPath]);
          return dataUrl;
        } else {
          console.error("[VideoCacheContext] ✗ Failed to load video:", videoPath, result.error);
          return null;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[VideoCacheContext] ✗ Error loading video:", videoPath, message);
        return null;
      } finally {
        // Clean up loading state and pending promise (both keys)
        delete loadingRef.current[videoPath];
        delete loadingRef.current[normalizedPath];
        delete pendingRef.current[videoPath];
        delete pendingRef.current[normalizedPath];
      }
    })();

    // Store pending promise for deduplication (use normalized path as primary key)
    pendingRef.current[normalizedPath] = loadPromise;
    pendingRef.current[videoPath] = loadPromise; // Store original too for backwards compat
    return loadPromise;
  }, []);

  /**
   * Clear cache for specific video or all videos
   */
  const clearVideoCache = useCallback((videoPath?: string) => {
    if (videoPath) {
      delete cacheRef.current[videoPath];
      delete loadingRef.current[videoPath];
      delete pendingRef.current[videoPath];
      console.log("[VideoCacheContext] Cleared cache for video:", videoPath);
    } else {
      cacheRef.current = {};
      loadingRef.current = {};
      pendingRef.current = {};
      console.log("[VideoCacheContext] Cleared all video cache");
    }
  }, []);

  // Create stable value object that always points to current refs
  // This ensures consumers always get the latest cache state
  const valueRef = useRef<VideoCacheContextType>({
    get videoDataUrlCache() {
      return cacheRef.current;
    },
    get isLoadingVideo() {
      return loadingRef.current;
    },
    loadVideoDataUrl,
    clearVideoCache,
  });

  // Update callbacks in ref (they're stable due to useCallback)
  valueRef.current.loadVideoDataUrl = loadVideoDataUrl;
  valueRef.current.clearVideoCache = clearVideoCache;

  return <VideoCacheContext.Provider value={valueRef.current}>{children}</VideoCacheContext.Provider>;
};

/**
 * Hook to access shared video cache
 */
export const useVideoCache = (): VideoCacheContextType => {
  const context = useContext(VideoCacheContext);
  if (!context) {
    throw new Error("useVideoCache must be used within VideoCacheProvider");
  }
  return context;
};
