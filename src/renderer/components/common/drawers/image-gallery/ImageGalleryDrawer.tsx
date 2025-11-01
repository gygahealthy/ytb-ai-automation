import { useState, useEffect, useRef } from "react";
import { Crop } from "lucide-react";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useDefaultProfileStore } from "../../../../store/default-profile.store";
import { useSecretStore, useFlowNextKey } from "../../../../store/secretStore";
import { useImageGalleryStore } from "../../../../store/image-gallery.store";
import { useAlert } from "../../../../hooks/useAlert";
import { useModal } from "../../../../hooks/useModal";
import { useImageCache } from "../../../../contexts/ImageCacheContext";
import SelectedImagePlaceholders from "./SelectedImagePlaceholders";
import ImageGalleryToolbar from "./ImageGalleryToolbar";
import StatusMessages from "./StatusMessages";
import ImageGrid from "./ImageGrid";
import GalleryFooter from "./GalleryFooter";
import ImageCropModalContent from "../../modals/ImageCropModal";
import { cropImage, blobToFile, CropArea, AspectRatio } from "../../../../utils/imageCrop";

/**
 * Image Gallery Drawer Content
 *
 * Manages VEO3 images for ingredient-based video generation.
 * Features:
 * - Load images from local database (via shared ImageCacheContext)
 * - Upload local images to Flow server
 * - Sync images from Flow server to local storage
 * - Display image thumbnails
 * - Select images for video ingredients
 * - Track pagination cursor per profile
 */
export default function ImageGalleryDrawer() {
  console.log("[ImageGalleryDrawer] Component rendering at", Date.now());

  // Use shared image cache context (avoids duplicate backend calls)
  const { images, imageSrcCache, isLoading, totalDiskSize, refreshImages } = useImageCache();

  // Track if we've already loaded for this profile to prevent re-fetching
  const hasLoadedRef = useRef(false);
  const loadedProfileIdRef = useRef<string | null>(null);
  const imagesLengthRef = useRef(0);

  // Update image length ref without causing re-renders
  useEffect(() => {
    imagesLengthRef.current = images.length;
  }, [images.length]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; skipped: number } | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ downloaded: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingSecret, setIsExtractingSecret] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5>(3);
  const [showToolbar, setShowToolbar] = useState<boolean>(false);

  const { veo3ImagesPath, tempVideoPath } = useFilePathsStore();
  const { flowProfileId } = useDefaultProfileStore();
  const flowNextKey = useFlowNextKey(flowProfileId || "");
  const extractSecrets = useSecretStore((state) => state.extractSecrets);
  const { selectedImages } = useImageGalleryStore();
  const alert = useAlert();
  const { openModal, closeModal } = useModal();

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
   * Upload local image to Flow server (API call + save to DB)
   * Opens file dialog instantly, validates afterward
   */
  const handleUploadImage = async () => {
    // Set uploading state IMMEDIATELY to show animation
    setIsUploading(true);

    try {
      // Open file dialog FIRST (instant UX)
      const result = await (window as any).electronAPI.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
        title: "Select Image to Upload",
      });

      // Unwrap the result if it's wrapped in a success object
      const dialogResult = result && typeof result === "object" && "success" in result ? (result as any).data : result;

      console.log("[ImageGalleryDrawer] Dialog result:", dialogResult);

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
        setIsUploading(false);
        return;
      }

      // Process the selected file
      const imagePath = dialogResult.filePaths[0];

      console.log("[ImageGalleryDrawer] Selected image path:", imagePath);
      console.log("[ImageGalleryDrawer] imagePath type:", typeof imagePath);
      console.log("[ImageGalleryDrawer] imagePath value:", JSON.stringify(imagePath));

      if (!imagePath) {
        throw new Error("Image path is undefined");
      }

      // Set uploading state to show loading animation
      setIsUploading(true);

      // OPEN MODAL IMMEDIATELY with loading state
      openModal({
        title: "Crop your ingredient",
        icon: <Crop className="w-6 h-6" />,
        content: (
          <ImageCropModalContent
            imagePath="" // Empty initially - will show loading state
            tempFilePath=""
            onCrop={async () => {
              /* Will be replaced when image loads */
            }}
          />
        ),
        size: "xl",
        closeOnEscape: true,
        closeOnOverlay: false,
      });

      console.log("[ImageGalleryDrawer] About to call readFile with:", imagePath);

      // Read the file buffer via IPC (async - DON'T block the modal opening)
      // This runs in background while modal shows loading spinner
      (async () => {
        try {
          const fileBufferResult = await (window as any).electronAPI.fs.readFile(imagePath);
          if (!fileBufferResult.success || !fileBufferResult.data) {
            closeModal();
            setIsUploading(false);
            throw new Error(`Failed to read file: ${fileBufferResult.error || "Unknown error"}`);
          }
          const fileBuffer = fileBufferResult.data;

          console.log("[ImageGalleryDrawer] File buffer received, size:", fileBuffer?.length || 0);

          const fileName = imagePath.split(/[/\\]/).pop() || "image.jpg";
          const mimeType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

          console.log("[ImageGalleryDrawer] About to write temp file:", { fileName, tempVideoPath });

          // Write to temp folder for processing
          const tempFileResult = await (window as any).electronAPI.fs.writeTempFile(
            fileBuffer,
            fileName,
            tempVideoPath || undefined
          );
          if (!tempFileResult.success || !tempFileResult.data) {
            closeModal();
            setIsUploading(false);
            throw new Error(`Failed to write temp file: ${tempFileResult.error || "Unknown error"}`);
          }
          const tempFilePath = tempFileResult.data;

          console.log("[ImageGalleryDrawer] Temp file created at:", tempFilePath);

          // Create File object from buffer for preview
          const file = new File([fileBuffer], fileName, { type: mimeType });
          const previewUrl = URL.createObjectURL(file);

          // Create a closure with the file, temp path, and preview URL to avoid state timing issues
          const handleCropForThisImage = async (cropArea: CropArea, aspectRatio: AspectRatio) => {
            await handleCropComplete(cropArea, aspectRatio, file, tempFilePath, previewUrl);
          };

          // UPDATE MODAL with loaded image
          openModal({
            title: "Crop your ingredient",
            icon: <Crop className="w-6 h-6" />,
            content: <ImageCropModalContent imagePath={previewUrl} tempFilePath={tempFilePath} onCrop={handleCropForThisImage} />,
            size: "xl",
            closeOnEscape: true,
            closeOnOverlay: false,
          });
        } catch (err) {
          closeModal();
          setIsUploading(false);
          setError(String(err));
          console.error("Failed to load image:", err);
        }
      })();
    } catch (err) {
      setIsUploading(false);
      setError(String(err));
      console.error("Failed to select image:", err);
    }
  };

  /**
   * Handle crop completion and upload cropped image
   */
  const handleCropComplete = async (
    cropArea: CropArea,
    aspectRatio: AspectRatio,
    file: File,
    originalTempFilePath: string,
    previewUrl: string
  ) => {
    console.log("[ImageGalleryDrawer] handleCropComplete called with:", { cropArea, aspectRatio });
    console.log("[ImageGalleryDrawer] File info:", {
      fileName: file.name,
      fileSize: file.size,
      tempFilePath: originalTempFilePath,
    });

    if (!currentProfileId || !veo3ImagesPath) {
      console.error("[ImageGalleryDrawer] Missing required data for crop");
      return;
    }

    // Close modal but keep isUploading=true while API call is in progress
    try {
      closeModal();
    } catch (err) {
      console.error("[ImageGalleryDrawer] Error closing modal:", err);
    }

    // Keep isUploading=true - will be reset after upload completes
    setError(null);

    try {
      console.log("[ImageGalleryDrawer] Starting crop process...");

      // Load the original image to get its natural dimensions
      const img = new Image();
      const imageUrl = previewUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      console.log("[ImageGalleryDrawer] Image loaded, cropping...");

      // Crop the image
      const croppedBlob = await cropImage(file, cropArea);
      console.log("[ImageGalleryDrawer] Image cropped, blob size:", croppedBlob.size);

      // Convert blob to file
      const croppedFile = blobToFile(croppedBlob, file.name);
      console.log("[ImageGalleryDrawer] Converted to file:", croppedFile.name);

      // Save cropped file to temporary location for upload
      // Use configured temp path if available, otherwise handler will use OS default
      const tempPathResult = await (window as any).electronAPI.fs.writeTempFile(
        await croppedFile.arrayBuffer(),
        file.name,
        tempVideoPath || undefined
      );

      if (!tempPathResult.success || !tempPathResult.data) {
        throw new Error(`Failed to save cropped image to temp: ${tempPathResult.error || "Unknown error"}`);
      }

      const tempPath = tempPathResult.data;
      console.log("[ImageGalleryDrawer] Cropped image saved to temp:", tempPath);

      // Convert aspect ratio to API format
      const apiAspectRatio = aspectRatio === "landscape" ? "IMAGE_ASPECT_RATIO_LANDSCAPE" : "IMAGE_ASPECT_RATIO_PORTRAIT";

      // Upload the cropped image (keep animation running)
      console.log("[ImageGalleryDrawer] Starting upload API call...");
      const uploadResult = await (window as any).electronAPI.imageVeo3.upload(
        currentProfileId,
        tempPath,
        veo3ImagesPath,
        apiAspectRatio
      );

      // Reset uploading state after API completes
      setIsUploading(false);

      if (uploadResult.success) {
        // Force refresh with loading indicator to show newly uploaded image
        console.log("[ImageGalleryDrawer] Upload successful, force refreshing images...");
        await refreshImages(true); // true = show loading state for visual feedback

        // Show success alert
        try {
          alert.show({
            title: "Upload Successful",
            message: "Image uploaded and saved successfully.",
            severity: "success",
            duration: 3000,
          });
        } catch (alertError) {
          console.warn("Failed to show success alert:", alertError);
        }
      } else {
        // Show error alert to user
        const errorMessage = uploadResult.error || "Failed to upload image";
        setError(errorMessage);
        console.error("[ImageGalleryDrawer] Upload failed:", errorMessage);
        try {
          alert.show({
            title: "Upload Failed",
            message: errorMessage,
            severity: "error",
            duration: 5000,
          });
        } catch (alertError) {
          console.warn("Failed to show error alert:", alertError);
        }
      }

      // Clean up
      URL.revokeObjectURL(imageUrl);
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setIsUploading(false); // Reset on error
      const errorMessage = String(err);
      setError(errorMessage);
      console.error("Failed to crop and upload image:", err);
      // Show error alert
      try {
        alert.show({
          title: "Upload Error",
          message: errorMessage,
          severity: "error",
          duration: 5000,
        });
      } catch (alertError) {
        console.warn("Failed to show error alert:", alertError);
      }
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
        // Clear local state
        setSyncStatus(null);
        setDownloadStatus(null);

        // Refresh images from database (also recalculates disk size in context)
        await refreshImages();

        // Show success alert
        alert.show({
          title: "Force Refresh Complete",
          message: `Deleted ${result.data.deleted} image records and ${
            result.data.filesDeleted || 0
          } local files.\n\nPlease sync to restore metadata and re-download images.`,
          severity: "success",
          duration: 5000,
        });
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
        setDownloadStatus({
          downloaded: result.data.downloaded,
          failed: result.data.failed,
        });
        // Reload images to show the downloaded ones
        await refreshImages();

        // Show success alert
        const failedCount = result.data.failed || 0;
        if (failedCount === 0) {
          alert.show({
            title: "Download Complete",
            message: `Successfully downloaded ${result.data.downloaded} image${result.data.downloaded !== 1 ? "s" : ""}.`,
            severity: "success",
            duration: 4000,
          });
        } else {
          alert.show({
            title: "Download Completed with Errors",
            message: `Downloaded ${result.data.downloaded} image${
              result.data.downloaded !== 1 ? "s" : ""
            }, but ${failedCount} failed.`,
            severity: "warning",
            duration: 5000,
          });
        }
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
  // Removed - now handled by ImageGrid component using store

  /**
   * Handle clipboard paste (Ctrl+V) to upload images from clipboard
   */
  const handlePaste = async (e: ClipboardEvent) => {
    console.log("[ImageGalleryDrawer] Paste event detected");

    // Check if clipboard contains image data
    const items = e.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;

    // Find image in clipboard items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          // Convert blob to File with proper name
          const fileName = `pasted-image-${Date.now()}.png`;
          imageFile = new File([blob], fileName, { type: blob.type });
          console.log("[ImageGalleryDrawer] Found image in clipboard:", fileName);
          break;
        }
      }
    }

    if (!imageFile) {
      console.log("[ImageGalleryDrawer] No image found in clipboard");
      return;
    }

    // Validate configuration
    if (!currentProfileId) {
      alert.show({
        title: "Configuration Required",
        message: "Please configure a Flow profile in Settings > Flow VEO3",
        severity: "warning",
        duration: 5000,
      });
      return;
    }

    if (!veo3ImagesPath) {
      alert.show({
        title: "Configuration Required",
        message: "Please configure VEO3 Images storage path in Settings > File Paths",
        severity: "warning",
        duration: 5000,
      });
      return;
    }

    if (!tempVideoPath) {
      alert.show({
        title: "Configuration Required",
        message: "Please set the Temp Video Path in Settings > File Paths to store temporary files.",
        severity: "warning",
        duration: 5000,
      });
      return;
    }

    // Ensure secret is extracted
    setIsUploading(true);
    const secretReady = await ensureSecretExtracted();
    if (!secretReady) {
      setIsUploading(false);
      return;
    }

    try {
      // Open modal with loading state immediately
      openModal({
        title: "Crop your ingredient",
        icon: <Crop className="w-6 h-6" />,
        content: (
          <ImageCropModalContent
            imagePath="" // Empty initially - will show loading state
            tempFilePath=""
            onCrop={async () => {
              /* Will be replaced when image loads */
            }}
          />
        ),
        size: "xl",
        closeOnEscape: true,
        closeOnOverlay: false,
      });

      // Process image in background
      const fileBuffer = await imageFile.arrayBuffer();
      const fileName = imageFile.name;

      console.log("[ImageGalleryDrawer] Writing pasted image to temp:", fileName);

      // Write to temp folder
      const tempFileResult = await (window as any).electronAPI.fs.writeTempFile(fileBuffer, fileName, tempVideoPath || undefined);

      if (!tempFileResult.success || !tempFileResult.data) {
        closeModal();
        setIsUploading(false);
        throw new Error(`Failed to write temp file: ${tempFileResult.error || "Unknown error"}`);
      }

      const tempFilePath = tempFileResult.data;
      console.log("[ImageGalleryDrawer] Pasted image saved to temp:", tempFilePath);

      // Create preview URL
      const previewUrl = URL.createObjectURL(imageFile);

      // Create closure for crop handler
      const handleCropForThisImage = async (cropArea: CropArea, aspectRatio: AspectRatio) => {
        await handleCropComplete(cropArea, aspectRatio, imageFile, tempFilePath, previewUrl);
      };

      // Update modal with loaded image
      openModal({
        title: "Crop your ingredient",
        icon: <Crop className="w-6 h-6" />,
        content: <ImageCropModalContent imagePath={previewUrl} tempFilePath={tempFilePath} onCrop={handleCropForThisImage} />,
        size: "xl",
        closeOnEscape: true,
        closeOnOverlay: false,
      });
    } catch (err) {
      closeModal();
      setIsUploading(false);
      const errorMessage = String(err);
      setError(errorMessage);
      console.error("Failed to process pasted image:", err);
      alert.show({
        title: "Paste Error",
        message: errorMessage,
        severity: "error",
        duration: 5000,
      });
    }
  };

  /**
   * Set up clipboard paste listener when component mounts
   */
  useEffect(() => {
    console.log("[ImageGalleryDrawer] Setting up paste event listener");
    document.addEventListener("paste", handlePaste);

    return () => {
      console.log("[ImageGalleryDrawer] Cleaning up paste event listener");
      document.removeEventListener("paste", handlePaste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfileId, veo3ImagesPath, tempVideoPath]); // Re-attach when config changes

  /**
   * Load images when drawer first opens (lazy loading)
   * Only refresh if cache is empty or profile changed
   * CRITICAL: Avoid unnecessary refreshes on remount when cache already has data
   * Uses refs to prevent re-triggering when images load
   */
  useEffect(() => {
    const currentImagesLength = imagesLengthRef.current;
    console.log(
      "[ImageGalleryDrawer] useEffect triggered, currentProfileId:",
      currentProfileId,
      "images.length:",
      currentImagesLength,
      "hasLoaded:",
      hasLoadedRef.current,
      "loadedProfileId:",
      loadedProfileIdRef.current
    );

    // No profile configured - clear state and skip
    if (!currentProfileId) {
      hasLoadedRef.current = false;
      loadedProfileIdRef.current = null;
      return;
    }

    // Check if profile changed - reset load state
    if (loadedProfileIdRef.current !== currentProfileId) {
      console.log("[ImageGalleryDrawer] Profile changed, resetting load state");
      hasLoadedRef.current = false;
      loadedProfileIdRef.current = currentProfileId;
    }

    // If we already have images cached AND we've loaded for this profile, skip
    // This prevents the 2nd+ open from re-fetching unnecessarily
    if (currentImagesLength > 0 && hasLoadedRef.current) {
      console.log("[ImageGalleryDrawer] Using cached images, skipping refresh");
      return;
    }

    // Only refresh if cache is empty or haven't loaded yet
    console.log("[ImageGalleryDrawer] No cached images or first load, fetching...");
    hasLoadedRef.current = true;
    refreshImages(false); // false = silent refresh, no loading state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfileId]); // ONLY depend on profileId, not images or refreshImages

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Optional Toolbar */}
      {showToolbar && (
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
      )}

      {/* Content Section - More compact */}
      <div className="flex-shrink-0 px-4 pb-2 border-b border-gray-200 dark:border-gray-700 space-y-2">
        {/* Selected Image Placeholders with Upload button and Settings */}
        <SelectedImagePlaceholders
          onUpload={handleUploadImage}
          isUploading={isUploading || isLoading || isExtractingSecret}
          onSync={handleSyncFromFlow}
          onDownload={handleDownloadImages}
          onForceRefresh={handleForceRefresh}
          isSyncing={isSyncing}
          isDownloading={isDownloading}
          isDisabled={
            isLoading || isSyncing || isDownloading || isExtractingSecret || isUploading || !veo3ImagesPath || !currentProfileId
          }
          imageCount={images.length}
          pendingDownloadCount={images.filter((img) => !img.localPath).length}
          gridColumns={gridColumns}
          onGridColumnsChange={setGridColumns}
          showToolbar={showToolbar}
          onToggleToolbar={setShowToolbar}
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

      {/* Image Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-300px)]">
        <ImageGrid
          images={images}
          imageSrcCache={imageSrcCache}
          isLoading={isLoading}
          gridColumns={gridColumns}
          onImageDeleted={refreshImages}
        />
      </div>

      {/* Footer - Stats - Fixed to Bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <GalleryFooter imageCount={images.length} selectedCount={selectedImages.length} totalDiskSize={totalDiskSize} />
      </div>
    </div>
  );
}
