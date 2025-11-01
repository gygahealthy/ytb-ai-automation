/**
 * Image Selection Modal Content
 *
 * Per-prompt image selection modal with same layout/features as ImageGalleryDrawer.
 * Features:
 * - Load images from local database (via shared ImageCacheContext)
 * - Upload local images to Flow server
 * - Sync images from Flow server to local storage
 * - Display image thumbnails
 * - Select images (max 3) for specific video prompt
 * - Track pagination cursor per profile
 */
import React, { useState, useEffect } from "react";
import ImageGrid from "../drawers/image-gallery/ImageGrid";
import ImageGalleryToolbar from "../drawers/image-gallery/ImageGalleryToolbar";
import SelectedImagePlaceholders from "../drawers/image-gallery/SelectedImagePlaceholders";
import StatusMessages from "../drawers/image-gallery/StatusMessages";
import GalleryFooter from "../drawers/image-gallery/GalleryFooter";
import { useDefaultProfileStore } from "../../../store/default-profile.store";
import { useVideoCreationStore } from "../../../store/video-creation.store";
import { useImageCache } from "../../../contexts/ImageCacheContext";
import { useFilePathsStore } from "../../../store/file-paths.store";
import { useSecretStore, useFlowNextKey } from "../../../store/secretStore";
import { useAlert } from "../../../hooks/useAlert";
import { useModal } from "../../../hooks/useModal";
import type { SelectedImageInfo } from "../../../types/video-creation.types";

interface ImageSelectionModalContentProps {
  promptId: string;
}

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

export const ImageSelectionModal: React.FC<ImageSelectionModalContentProps> = ({ promptId }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; skipped: number } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ downloaded: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingSecret, setIsExtractingSecret] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5>(3);
  const [showToolbar, setShowToolbar] = useState<boolean>(true);

  const { veo3ImagesPath, tempVideoPath } = useFilePathsStore();
  const { flowProfileId } = useDefaultProfileStore();
  const flowNextKey = useFlowNextKey(flowProfileId || "");
  const extractSecrets = useSecretStore((state) => state.extractSecrets);
  const { prompts, togglePromptImageSelection } = useVideoCreationStore();
  const alert = useAlert();
  const { openModal } = useModal();

  // Use shared image cache context (avoids duplicate backend calls)
  const { images, imageSrcCache, isLoading, totalDiskSize, refreshImages } = useImageCache();

  // Get this prompt's selected images
  const currentPrompt = prompts.find((p) => p.id === promptId);
  const promptSelectedImages = currentPrompt?.selectedImages || [];

  const [customSelectedImages, setCustomSelectedImages] = useState<SelectedImageInfo[]>(promptSelectedImages);

  useEffect(() => {
    setCustomSelectedImages(promptSelectedImages);
  }, [promptSelectedImages]);

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
        setError("Failed to extract API secret. Please check browser profile configuration.");
        return false;
      }
      return true;
    } finally {
      setIsExtractingSecret(false);
    }
  };

  /**
   * Upload local image to Flow server (API call + save to DB)
   * Opens file dialog instantly, validates afterward
   */
  const handleUploadImage = async () => {
    try {
      // Open file dialog FIRST (instant UX)
      const result = await (window as any).electronAPI.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
        title: "Select Image to Upload",
      });

      // Unwrap the result if it's wrapped in a success object
      const dialogResult = result && typeof result === "object" && "success" in result ? (result as any).data : result;

      console.log("[ImageSelectionModal] Dialog result:", dialogResult);

      // User cancelled - no validation needed
      if (!dialogResult || dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        return;
      }

      // NOW validate configuration (after user selected file)
      if (!currentProfileId) {
        setError("Please configure a Flow profile in Settings > Flow VEO3 before uploading images");
        alert.show({
          title: "Configuration Required",
          message: "Please configure a Flow profile in Settings > Flow VEO3",
          severity: "warning",
          duration: 5000,
        });
        return;
      }

      if (!veo3ImagesPath) {
        setError("Please configure VEO3 Images storage path in Settings > File Paths");
        alert.show({
          title: "Configuration Required",
          message: "Please configure VEO3 Images storage path in Settings > File Paths",
          severity: "warning",
          duration: 5000,
        });
        return;
      }

      if (!tempVideoPath) {
        setError("Please configure Temp Video Path in Settings > File Paths before uploading images");
        alert.show({
          title: "Configuration Required",
          message: "Please set the Temp Video Path in Settings > File Paths to store temporary files.",
          severity: "warning",
          duration: 5000,
        });
        return;
      }

      // Ensure secret is extracted before uploading
      const secretReady = await ensureSecretExtracted();
      if (!secretReady) {
        return;
      }

      // Process the selected file
      const filePath = dialogResult.filePaths[0];
      console.log("[ImageSelectionModal] Selected file:", filePath);

      // Read the file and create a blob
      const fileResult = await (window as any).electronAPI.fs.readFile(filePath);
      if (!fileResult.success || !fileResult.data) {
        setError("Failed to read selected image");
        return;
      }

      const buffer = fileResult.data;
      const blob = new Blob([buffer]);
      const file = new File([blob], filePath.split(/[\\/]/).pop() || "image.jpg", { type: "image/jpeg" });

      // Save to temporary location
      const tempPathResult = await (window as any).electronAPI.fs.writeTempFile(buffer, file.name, tempVideoPath || undefined);

      if (!tempPathResult.success || !tempPathResult.data) {
        setError("Failed to save temporary file");
        return;
      }

      const tempPath = tempPathResult.data;
      console.log("[ImageSelectionModal] Temp file saved:", tempPath);

      // Show crop modal
      const previewUrl = URL.createObjectURL(blob);
      openModal({
        title: "Crop Image",
        content: (
          <div className="min-w-[600px]">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select aspect ratio and crop area for your image</div>
            {/* Crop modal content would go here - reuse from ImageGalleryDrawer */}
          </div>
        ),
      });

      // For now, directly upload without crop (implement crop modal later if needed)
      const uploadResult = await (window as any).electronAPI.imageVeo3.upload(
        currentProfileId,
        tempPath,
        veo3ImagesPath,
        "IMAGE_ASPECT_RATIO_LANDSCAPE" // Default to landscape
      );

      if (uploadResult.success) {
        setError(null);
        alert.show({
          title: "Upload Successful",
          message: `Image uploaded successfully: ${uploadResult.data.name}`,
          severity: "success",
          duration: 3000,
        });
        // Refresh images
        await refreshImages();
      } else {
        setError(uploadResult.error || "Failed to upload image");
      }

      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setError(String(err));
      console.error("Failed to select image:", err);
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
        await refreshImages();
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

    setIsSyncing(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI.imageVeo3.forceRefresh(currentProfileId);

      if (result.success && result.data) {
        alert.show({
          title: "Force Refresh Complete",
          message: `Deleted ${result.data.deletedCount} records and ${result.data.filesDeleted} files. Syncing fresh data...`,
          severity: "info",
          duration: 5000,
        });

        // Auto-sync after force refresh
        await handleSyncFromFlow();
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
      alert.show({
        title: "No Images to Download",
        message: "All images are already downloaded.",
        severity: "info",
        duration: 3000,
      });
      return;
    }

    setIsDownloading(true);
    setError(null);
    setDownloadStatus(null);

    try {
      const imageNames = imagesToDownload.map((img) => img.name);
      const result = await (window as any).electronAPI.imageVeo3.downloadBatch(currentProfileId, imageNames, veo3ImagesPath);

      if (result.success && result.data) {
        setDownloadStatus(result.data);
        alert.show({
          title: "Download Complete",
          message: `Downloaded ${result.data.downloaded} images, ${result.data.failed} failed.`,
          severity: result.data.failed > 0 ? "warning" : "success",
          duration: 5000,
        });
        await refreshImages();
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
   * Toggle image selection for this prompt
   */
  const handleImageToggle = (image: LocalImage) => {
    const imageInfo: SelectedImageInfo = {
      id: image.id,
      name: image.name,
      mediaKey: image.mediaKey,
      localPath: image.localPath || "",
      fifeUrl: image.fifeUrl,
      aspectRatio: image.aspectRatio,
      profileId: image.profileId,
    };
    togglePromptImageSelection(promptId, imageInfo);
  };

  /**
   * Remove image from this prompt's selection
   */
  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = customSelectedImages.find((img) => img.id === imageId);
    if (imageToRemove) {
      togglePromptImageSelection(promptId, imageToRemove);
    }
  };

  /**
   * Clear all selected images for this prompt
   */
  const handleClearAllImages = () => {
    // Remove all selected images one by one
    customSelectedImages.forEach((img) => {
      togglePromptImageSelection(promptId, img);
    });
  };

  // No need to load images on mount - ImageCacheContext handles it

  return (
    <div className="relative h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Optional Toolbar - Sticky at top */}
      {showToolbar && (
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <ImageGalleryToolbar
            onSync={handleSyncFromFlow}
            onDownload={handleDownloadImages}
            onForceRefresh={handleForceRefresh}
            isSyncing={isSyncing}
            isDownloading={isDownloading}
            isDisabled={isLoading || isSyncing || isDownloading || isExtractingSecret || !veo3ImagesPath || !currentProfileId}
            imageCount={images.length}
            pendingDownloadCount={images.filter((img) => !img.localPath).length}
          />
        </div>
      )}

      {/* Content Section - Sticky below toolbar - More compact */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 space-y-1.5 shadow-sm">
        {/* Selected Image Placeholders with Actions - Compact version */}
        <SelectedImagePlaceholders
          onUpload={handleUploadImage}
          isUploading={isLoading || isExtractingSecret}
          onSync={handleSyncFromFlow}
          onDownload={handleDownloadImages}
          onForceRefresh={handleForceRefresh}
          isSyncing={isSyncing}
          isDownloading={isDownloading}
          isDisabled={isLoading || isSyncing || isDownloading || isExtractingSecret || !veo3ImagesPath || !currentProfileId}
          imageCount={images.length}
          pendingDownloadCount={images.filter((img) => !img.localPath).length}
          gridColumns={gridColumns}
          onGridColumnsChange={setGridColumns}
          showToolbar={showToolbar}
          onToggleToolbar={setShowToolbar}
          customSelectedImages={customSelectedImages}
          onRemoveCustomImage={handleRemoveImage}
          onClearCustomImages={handleClearAllImages}
          compact={true}
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

      {/* Image Grid - Scrollable Area - Takes all remaining space */}
      <div className="flex-1 overflow-y-auto p-2">
        <ImageGrid
          images={images}
          imageSrcCache={imageSrcCache}
          isLoading={isLoading}
          gridColumns={gridColumns}
          onImageDeleted={refreshImages}
          customSelectedImages={customSelectedImages}
          onCustomImageToggle={handleImageToggle}
        />
      </div>

      {/* Footer - Stats - Sticky at bottom */}
      <div className="sticky bottom-0 z-10 px-2 py-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <GalleryFooter imageCount={images.length} selectedCount={customSelectedImages.length} totalDiskSize={totalDiskSize} />
      </div>
    </div>
  );
};
