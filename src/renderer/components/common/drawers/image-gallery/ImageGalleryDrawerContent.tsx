import { useState, useEffect } from "react";
import { Image, Upload, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useDefaultProfileStore } from "../../../../store/default-profile.store";
import { useSecretStore, useFlowNextKey } from "../../../../store/secretStore";

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
export default function ImageGalleryDrawerContent() {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingSecret, setIsExtractingSecret] = useState(false);

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
        // Preload image data URLs for images with localPath
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
   * Sync images from Flow server (API call + save to DB)
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
      const result = await (window as any).electronAPI.imageVeo3.syncFromFlow(
        currentProfileId,
        veo3ImagesPath,
        5 // Sync up to 5 pages (90 images)
      );

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

  /**
   * Calculate total size of local images
   */
  const calculateTotalSize = (): string => {
    // TODO: Implement actual file size calculation
    return "0 MB";
  };

  // Load images on mount
  useEffect(() => {
    loadLocalImages();
  }, [currentProfileId]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
            onClick={handleUploadImage}
            disabled={isLoading || isSyncing || isExtractingSecret || !veo3ImagesPath || !currentProfileId}
            title={
              !currentProfileId
                ? "Configure Flow profile in Settings first"
                : !veo3ImagesPath
                ? "Configure storage path in Settings first"
                : isExtractingSecret
                ? "Extracting API secret..."
                : "Upload local image to Flow"
            }
          >
            {isLoading || isExtractingSecret ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isExtractingSecret ? "Extracting Secret..." : "Upload Image"}</span>
          </button>
          <button
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            onClick={handleSyncFromFlow}
            disabled={isLoading || isSyncing || isExtractingSecret || !veo3ImagesPath || !currentProfileId}
            title={
              !currentProfileId
                ? "Configure Flow profile in Settings first"
                : !veo3ImagesPath
                ? "Configure storage path in Settings first"
                : isExtractingSecret
                ? "Extracting API secret..."
                : "Sync images from Flow server"
            }
          >
            {isSyncing || isExtractingSecret ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Synced {syncStatus.synced} new images, skipped {syncStatus.skipped} existing
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Profile Warning */}
        {!currentProfileId && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
            ⚠️ Profile has no cookies. Please configure a Flow profile in Settings &gt; Flow VEO3 and ensure it has active
            cookies.
          </div>
        )}

        {/* Storage Path Warning */}
        {!veo3ImagesPath && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ Please configure VEO3 Images storage path in Settings &gt; File Paths &amp; Naming
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading && images.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No images uploaded yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Upload images or sync from Flow to use as ingredients for video generation
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImages.has(image.id)
                    ? "border-purple-500 shadow-lg"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => toggleImageSelection(image.id)}
              >
                {/* Image Thumbnail */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
                  {image.localPath && imageSrcCache[image.id] ? (
                    <img
                      src={imageSrcCache[image.id]}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('Failed to load image:', image.localPath);
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.image-error-placeholder')) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'image-error-placeholder w-full h-full flex flex-col items-center justify-center gap-1';
                          placeholder.innerHTML = '<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="text-xs text-red-400">Failed to load</span>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  ) : image.localPath ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Image className="w-8 h-8 text-gray-400" />
                      <span className="text-xs text-gray-400">Not downloaded</span>
                    </div>
                  )}
                  
                  {/* Selection Indicator - Overlay */}
                  {selectedImages.has(image.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Stats */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {images.length} image{images.length !== 1 ? "s" : ""}
            {selectedImages.size > 0 && ` (${selectedImages.size} selected)`}
          </span>
          <span>{calculateTotalSize()} used</span>
        </div>
      </div>
    </div>
  );
}
