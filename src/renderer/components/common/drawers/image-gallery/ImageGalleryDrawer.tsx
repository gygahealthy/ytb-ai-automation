import { useState, useEffect } from "react";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useDefaultProfileStore } from "../../../../store/default-profile.store";
import { useSecretStore, useFlowNextKey } from "../../../../store/secretStore";
import ImageGalleryHeader from "./ImageGalleryHeader";
import UploadSection from "./UploadSection";
import ActionButtons from "./ActionButtons";
import StatusMessages from "./StatusMessages";
import ImageGrid from "./ImageGrid";
import GalleryFooter from "./GalleryFooter";

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

/**
 * Image Gallery Drawer Content
 *
 * Manages VEO3 images for ingredient-based video generation.
 * Features:
 * - Load images from local database (no API calls)
 * - Upload local images to Flow server
 * - Sync images from Flow server to local storage
 * - Display image thumbnails
 * - Select images for video ingredients
 * - Track pagination cursor per profile
 */
export default function ImageGalleryDrawer() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; skipped: number } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ downloaded: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingSecret, setIsExtractingSecret] = useState(false);
  const [totalDiskSize, setTotalDiskSize] = useState<number>(0);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5>(3);

  const { veo3ImagesPath } = useFilePathsStore();
  const { flowProfileId } = useDefaultProfileStore();
  const flowNextKey = useFlowNextKey(flowProfileId || "");
  const extractSecrets = useSecretStore((state) => state.extractSecrets);

  // Get current Flow profile ID from settings
  const currentProfileId = flowProfileId;

  /**
   * Ensure FLOW_NEXT_KEY secret is available (extract if needed)
   */
  const ensureSecretExtracted = async (): Promise<boolean> => {
    if (!currentProfileId) return false;

    // Already have the secret
    if (flowNextKey) {
      return true;
    }

    // Attempt to extract
    setIsExtractingSecret(true);
    try {
      const success = await extractSecrets(currentProfileId);
      if (!success) {
        setError("Failed to extract API secret. Please ensure profile has active cookies.");
        return false;
      }
      return true;
    } finally {
      setIsExtractingSecret(false);
    }
  };

  /**
   * Load image file and convert to data URL
   */
  const loadImageDataUrl = async (filePath: string): Promise<string | null> => {
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
  };

  /**
   * Load images from local database (DB only - no API calls)
   */
  const loadLocalImages = async () => {
    if (!currentProfileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI.imageVeo3.getLocalImages(currentProfileId);

      if (result.success && result.data) {
        setImages(result.data);

        // Preload image data URLs and calculate total size
        const cache: Record<string, string> = {};
        let totalSize = 0;

        for (const image of result.data) {
          if (image.localPath && !imageSrcCache[image.id]) {
            const dataUrl = await loadImageDataUrl(image.localPath);
            if (dataUrl) {
              cache[image.id] = dataUrl;
            }

            // Get file size
            try {
              const sizeResult = await (window as any).electronAPI.imageVeo3.getFileSize(image.localPath);
              if (sizeResult.success && sizeResult.data?.size) {
                totalSize += sizeResult.data.size;
              }
            } catch (err) {
              console.error("Failed to get file size for:", image.localPath, err);
            }
          }
        }

        setTotalDiskSize(totalSize);

        if (Object.keys(cache).length > 0) {
          setImageSrcCache((prev) => ({ ...prev, ...cache }));
        }
      } else {
        setError(result.error || "Failed to load images");
      }
    } catch (err) {
      setError(String(err));
      console.error("Failed to load local images:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upload local image to Flow server (API call + save to DB)
   */
  const handleUploadImage = async () => {
    if (!currentProfileId) {
      setError("Please configure a Flow profile in Settings > Flow VEO3 before uploading images");
      return;
    }

    if (!veo3ImagesPath) {
      setError("Please configure VEO3 Images storage path in Settings > File Paths");
      return;
    }

    // Ensure secret is extracted before uploading
    const secretReady = await ensureSecretExtracted();
    if (!secretReady) {
      return;
    }

    try {
      // Open file dialog to select image
      const result = await (window as any).electronAPI.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
        title: "Select Image to Upload",
      });

      const dialogResult = result && typeof result === "object" && "success" in result ? (result as any).data : result;

      if (dialogResult && !dialogResult.canceled && dialogResult.filePaths && dialogResult.filePaths.length > 0) {
        const imagePath = dialogResult.filePaths[0];

        setIsLoading(true);
        setError(null);

        const uploadResult = await (window as any).electronAPI.imageVeo3.upload(
          currentProfileId,
          imagePath,
          veo3ImagesPath,
          "IMAGE_ASPECT_RATIO_LANDSCAPE" // TODO: Auto-detect or let user choose
        );

        if (uploadResult.success) {
          // Reload images to show the newly uploaded one
          await loadLocalImages();
        } else {
          setError(uploadResult.error || "Failed to upload image");
        }
      }
    } catch (err) {
      setError(String(err));
      console.error("Failed to upload image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sync images from Flow server (updates/inserts new images, preserves existing)
   */
  const handleSyncFromFlow = async () => {
    if (!currentProfileId) {
      setError("Please configure a Flow profile in Settings > Flow VEO3 before syncing images");
      return;
    }

    if (!veo3ImagesPath) {
      setError("Please configure VEO3 Images storage path in Settings > File Paths");
      return;
    }

    // Ensure secret is extracted before syncing
    const secretReady = await ensureSecretExtracted();
    if (!secretReady) {
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSyncStatus(null);

    try {
      const result = await (window as any).electronAPI.invoke("image-veo3:sync-metadata", {
        profileId: currentProfileId,
      });

      if (result.success && result.data) {
        setSyncStatus(result.data);
        // Reload images to show the synced ones
        await loadLocalImages();
      } else {
        setError(result.error || "Failed to sync images");
      }
    } catch (err) {
      setError(String(err));
      console.error("Failed to sync images from Flow:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Force refresh: Delete ALL image records for this profile
   */
  const handleForceRefresh = async () => {
    if (!currentProfileId) {
      setError("Please configure a Flow profile in Settings > Flow VEO3");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ Force Refresh will DELETE ALL image records for this profile from database.\n\n" +
        "Downloaded image files on disk will be preserved, but you'll need to sync again to see them.\n\n" +
        "Continue?"
    );
    if (!confirmed) {
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI.imageVeo3.forceRefresh(currentProfileId);

      if (result.success && result.data) {
        alert(`Deleted ${result.data.deleted} image records. Please sync to restore metadata.`);
        // Clear local state
        setImages([]);
        setSyncStatus(null);
        setDownloadStatus(null);
      } else {
        setError(result.error || "Failed to force refresh");
      }
    } catch (err) {
      setError(String(err));
      console.error("Failed to force refresh:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Download all images that don't have localPath yet
   */
  const handleDownloadImages = async () => {
    if (!currentProfileId) {
      setError("Please configure a Flow profile in Settings > Flow VEO3 before downloading images");
      return;
    }

    if (!veo3ImagesPath) {
      setError("Please configure VEO3 Images storage path in Settings > File Paths");
      return;
    }

    // Ensure secret is extracted before downloading
    const secretReady = await ensureSecretExtracted();
    if (!secretReady) {
      return;
    }

    // Get images that need downloading
    const imagesToDownload = images.filter((img) => !img.localPath);
    if (imagesToDownload.length === 0) {
      setError("All images are already downloaded");
      return;
    }

    const confirmed = window.confirm(`Download ${imagesToDownload.length} images? This may take several minutes.`);
    if (!confirmed) {
      return;
    }

    setIsDownloading(true);
    setError(null);
    setDownloadStatus(null);

    try {
      const imageNames = imagesToDownload.map((img) => img.name);
      const result = await (window as any).electronAPI.imageVeo3.downloadBatch(currentProfileId, imageNames, veo3ImagesPath);

      if (result.success && result.data) {
        setDownloadStatus({
          downloaded: result.data.downloaded,
          failed: result.data.failed,
        });
        // Reload images to show the downloaded ones
        await loadLocalImages();
      } else {
        setError(result.error || "Failed to download images");
      }
    } catch (err) {
      setError(String(err));
      console.error("Failed to download images:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Toggle image selection
   */
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Load images on mount
  useEffect(() => {
    loadLocalImages();
  }, [currentProfileId]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Action Buttons - Compact Modern Design */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 space-y-3 max-h-[40vh] overflow-y-auto">
        {/* Grid Column Selector */}
        <ImageGalleryHeader gridColumns={gridColumns} onGridColumnsChange={setGridColumns} />

        {/* Upload Area */}
        <UploadSection
          onUpload={handleUploadImage}
          isLoading={isLoading}
          isSyncing={isSyncing}
          isDownloading={isDownloading}
          isExtractingSecret={isExtractingSecret}
          hasStoragePath={!!veo3ImagesPath}
          hasProfileId={!!currentProfileId}
        />

        {/* Action Buttons Row */}
        <ActionButtons
          onSync={handleSyncFromFlow}
          onDownload={handleDownloadImages}
          onForceRefresh={handleForceRefresh}
          isLoading={isLoading}
          isSyncing={isSyncing}
          isDownloading={isDownloading}
          isExtractingSecret={isExtractingSecret}
          hasStoragePath={!!veo3ImagesPath}
          hasProfileId={!!currentProfileId}
          imageCount={images.length}
          pendingDownloadCount={images.filter((img) => !img.localPath).length}
        />

        {/* Status Messages */}
        <StatusMessages
          syncStatus={syncStatus}
          downloadStatus={downloadStatus}
          error={error}
          hasProfileId={!!currentProfileId}
          hasStoragePath={!!veo3ImagesPath}
        />
      </div>

      {/* Image Grid - Scrollable Area with Fixed Height */}
      <div className="flex-shrink-0 h-[calc(100vh-300px)] overflow-y-auto p-4">
        <ImageGrid
          images={images}
          imageSrcCache={imageSrcCache}
          selectedImages={selectedImages}
          onToggleSelection={toggleImageSelection}
          isLoading={isLoading}
          gridColumns={gridColumns}
        />
      </div>

      {/* Footer - Stats - Fixed to Bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <GalleryFooter imageCount={images.length} selectedCount={selectedImages.size} totalDiskSize={totalDiskSize} />
      </div>
    </div>
  );
}
