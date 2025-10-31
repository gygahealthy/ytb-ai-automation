import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  refreshImages: () => Promise<void>;
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
 */
export const ImageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { flowProfileId } = useDefaultProfileStore();

  /**
   * Load image file and convert to data URL (same pattern as ImageGalleryDrawer)
   */
  const loadImageDataUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const result = await (window as any).electronAPI.imageVeo3.readImageFile(filePath);
      if (result.success && result.data?.dataUrl) {
        return result.data.dataUrl;
      }
      console.error("Failed to read image file:", result.error);
      return null;
    } catch (error) {
      console.error("Error loading image data URL:", error);
      return null;
    }
  }, []);

  /**
   * Load images from local database (same pattern as ImageGalleryDrawer)
   */
  const refreshImages = useCallback(async () => {
    if (!flowProfileId) {
      setImages([]);
      setImageSrcCache({});
      return;
    }

    setIsLoading(true);

    try {
      const result = await (window as any).electronAPI.imageVeo3.getLocalImages(flowProfileId);

      if (result.success && result.data) {
        setImages(result.data);

        // Preload image data URLs
        const cache: Record<string, string> = {};
        for (const image of result.data) {
          if (image.localPath && !imageSrcCache[image.id]) {
            const dataUrl = await loadImageDataUrl(image.localPath);
            if (dataUrl) {
              cache[image.id] = dataUrl;
            }
          }
        }

        if (Object.keys(cache).length > 0) {
          setImageSrcCache((prev) => ({ ...prev, ...cache }));
        }
      }
    } catch (err) {
      console.error("Failed to load local images:", err);
    } finally {
      setIsLoading(false);
    }
  }, [flowProfileId, imageSrcCache, loadImageDataUrl]);

  // Load images on mount and when profile changes
  useEffect(() => {
    refreshImages();
  }, [flowProfileId]); // Only depend on flowProfileId to avoid infinite loop

  const value: ImageCacheContextType = {
    images,
    imageSrcCache,
    isLoading,
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
