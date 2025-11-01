import React, { createContext, useContext, useState, useCallback } from "react";
import { useDefaultProfileStore } from "../store/default-profile.store";

interface LocalImage {
  id: string;
  profileId: string;
  name: string;
  aspectRatio?: string;
  workflowId: string;
  mediaKey: string;
  localPath?: string;
  fifeUrl?: string;
  createdAt: string;
}

interface ImageCacheContextType {
  images: LocalImage[];
  imageSrcCache: Record<string, string>;
  isLoading: boolean;
  totalDiskSize: number;
  refreshImages: (showLoading?: boolean) => Promise<void>;
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined);

/**
 * Shared Image Cache Provider
 *
 * Provides centralized image loading and caching for the current profile.
 * This context is used by both ImageGalleryDrawer and ImageSelectionModal
 * to avoid duplicate backend calls and file reads.
 *
 * Pattern reference: ImageGalleryDrawer.tsx loadLocalImages()
 * Updated: Fixed null iteration error
 */
export const ImageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalDiskSize, setTotalDiskSize] = useState<number>(0);
  const [cachedProfileId, setCachedProfileId] = useState<string | null>(null);

  const { flowProfileId } = useDefaultProfileStore();

  // Use ref to track latest images without causing re-renders
  const imagesRef = React.useRef<LocalImage[]>([]);
  React.useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  /**
   * Load image file and convert to data URL (stable reference)
   */
  const loadImageDataUrl = async (filePath: string): Promise<string | null> => {
    try {
      console.log("[ImageCacheContext] Loading image from path:", filePath);
      const result = await (window as any).electronAPI.fs.readImageFile(filePath);
      console.log("[ImageCacheContext] Load result:", {
        success: result.success,
        hasDataUrl: !!result.data?.dataUrl,
        error: result.error,
      });
      if (result.success && result.data?.dataUrl) {
        return result.data.dataUrl;
      }
      console.error("[ImageCacheContext] Failed to read image file:", result.error, "path:", filePath);
      return null;
    } catch (error) {
      console.error("[ImageCacheContext] Error loading image data URL:", error, "path:", filePath);
      return null;
    }
  };

  /**
   * Load images from local database (non-blocking, progressive loading)
   * UI shows immediately with metadata, images load in background
   * @param showLoading - Whether to set isLoading state (default: false for silent refresh)
   */
  const refreshImages = useCallback(
    async (showLoading: boolean = false) => {
      console.log("[ImageCacheContext] refreshImages called at", Date.now(), "showLoading:", showLoading);

      if (!flowProfileId) {
        setImages([]);
        setImageSrcCache({});
        setTotalDiskSize(0);
        setCachedProfileId(null);
        return;
      }

      // Skip refresh if we already have data for this profile and not explicitly requested
      if (!showLoading && cachedProfileId === flowProfileId && imagesRef.current.length > 0) {
        console.log("[ImageCacheContext] Using cached data for profile:", flowProfileId);
        return;
      }

      // Only set loading if explicitly requested (e.g., initial load, force refresh)
      // Silent refresh by default to prevent UI flicker
      if (showLoading) {
        setIsLoading(true);
        console.log("[ImageCacheContext] setIsLoading(true) at", Date.now());
      }

      try {
        const startTime = Date.now();
        const result = await (window as any).electronAPI.imageVeo3.getLocalImages(flowProfileId);
        console.log("[ImageCacheContext] DB query took", Date.now() - startTime, "ms");

        if (result.success && result.data && Array.isArray(result.data)) {
          console.log("[ImageCacheContext] Successfully loaded images:", result.data.length, "at", Date.now());
          // CRITICAL: Set images + stop loading IMMEDIATELY so drawer can open
          setImages(result.data);
          setCachedProfileId(flowProfileId); // Mark this profile as cached
          if (showLoading) {
            setIsLoading(false);
            console.log("[ImageCacheContext] setIsLoading(false) + setImages done at", Date.now());
          }

          // BACKGROUND TASKS - Fire and forget, don't block UI
          // Wrap in setTimeout to ensure they don't block rendering
          setTimeout(() => {
            // 1. Calculate total disk size in background
            const filePaths = result.data.map((img: LocalImage) => img.localPath).filter((path: any): path is string => !!path);
            if (filePaths.length > 0) {
              (window as any).electronAPI.fs
                .calculateTotalSize(filePaths)
                .then((sizeResult: any) => {
                  if (sizeResult.success && sizeResult.data) {
                    setTotalDiskSize(sizeResult.data.totalSize);
                  }
                })
                .catch((err: any) => {
                  console.error("Failed to calculate total disk size:", err);
                });
            } else {
              setTotalDiskSize(0);
            }

            // 2. Load image thumbnails progressively in background
            const pendingImages = result.data.filter((img: LocalImage) => img.localPath);
            console.log("[ImageCacheContext] Starting progressive image load:", pendingImages.length, "images");

            // Load each image independently - they update cache as soon as ready
            let loadedCount = 0;
            pendingImages.forEach((image: LocalImage) => {
              // Each image loads independently (async without await - fire and forget)
              loadImageDataUrl(image.localPath!)
                .then((dataUrl) => {
                  if (dataUrl) {
                    // Update cache immediately for this image (progressive loading)
                    setImageSrcCache((prev) => ({ ...prev, [image.id]: dataUrl }));
                    loadedCount++;

                    // Log progress every 10 images
                    if (loadedCount % 10 === 0 || loadedCount === pendingImages.length) {
                      console.log(`[ImageCacheContext] Loaded ${loadedCount}/${pendingImages.length} images`);
                    }
                  } else {
                    console.warn("[ImageCacheContext] Failed to load image dataUrl:", image.id);
                  }
                })
                .catch((err) => {
                  console.error(`[ImageCacheContext] Failed to load image ${image.id}:`, err);
                });
            });
          }, 0); // Defer to next tick - ensures drawer renders first
        } else {
          // Handle case where result is not successful or data is invalid
          console.error("[ImageCacheContext] Invalid response or data:", result);
          setImages([]);
          setTotalDiskSize(0);
          setCachedProfileId(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[ImageCacheContext] Failed to load local images:", err);
        setImages([]);
        setTotalDiskSize(0);
        setCachedProfileId(null);
        setIsLoading(false);
      }
    },
    [flowProfileId, cachedProfileId]
  ); // Stable dependencies - no images.length to avoid re-creation

  /**
   * Auto-load images when default profile changes
   * Silent initialization - loads in background without blocking UI
   */
  React.useEffect(() => {
    if (flowProfileId && flowProfileId !== cachedProfileId) {
      console.log("[ImageCacheContext] Auto-loading images for profile:", flowProfileId);
      // Silent load (showLoading=false) - cache images in background without UI spinner
      refreshImages(false);
    }
  }, [flowProfileId, cachedProfileId, refreshImages]);

  /**
   * Listen for image upload success events from backend
   * Auto-refresh cache when new image is uploaded
   */
  React.useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.on) {
      console.warn("[ImageCacheContext] electronAPI.on not available for event listeners");
      return;
    }

    const handleUploadSuccess = (data: { profileId: string; imageId: string; imageName: string }) => {
      console.log("[ImageCacheContext] Upload success event received:", data);
      // Only refresh if upload was for current profile
      if (data.profileId === flowProfileId) {
        console.log("[ImageCacheContext] Refreshing images after upload...");
        refreshImages(true); // Force refresh with loading indicator
      }
    };

    const unsubscribe = electronAPI.on("image-veo3:upload:success", handleUploadSuccess);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [flowProfileId, refreshImages]);

  const value: ImageCacheContextType = {
    images,
    imageSrcCache,
    isLoading,
    totalDiskSize,
    refreshImages,
  };

  return <ImageCacheContext.Provider value={value}>{children}</ImageCacheContext.Provider>;
};

/**
 * Hook to access shared image cache
 */
export const useImageCache = (): ImageCacheContextType => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error("useImageCache must be used within ImageCacheProvider");
  }
  return context;
};
