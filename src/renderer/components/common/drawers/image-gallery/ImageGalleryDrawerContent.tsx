import { useState, useEffect } from "react";
import { Image, Upload, FolderOpen, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useDefaultProfileStore } from "../../../../store/default-profile.store";

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
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ synced: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { veo3ImagesPath } = useFilePathsStore();
  const { flowProfileId } = useDefaultProfileStore();

  // Get current Flow profile ID from settings
  const currentProfileId = flowProfileId;

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
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Image className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Image Gallery</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage images for ingredient-based video generation</p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
            onClick={handleUploadImage}
            disabled={isLoading || isSyncing || !veo3ImagesPath || !currentProfileId}
            title={
              !currentProfileId
                ? "Configure Flow profile in Settings first"
                : !veo3ImagesPath
                ? "Configure storage path in Settings first"
                : "Upload local image to Flow"
            }
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Image</span>
          </button>
          <button
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            onClick={handleSyncFromFlow}
            disabled={isLoading || isSyncing || !veo3ImagesPath || !currentProfileId}
            title={
              !currentProfileId
                ? "Configure Flow profile in Settings first"
                : !veo3ImagesPath
                ? "Configure storage path in Settings first"
                : "Sync images from Flow server"
            }
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            onClick={loadLocalImages}
            disabled={isLoading || isSyncing || !currentProfileId}
            title={!currentProfileId ? "Configure Flow profile in Settings first" : "Refresh local images"}
          >
            <FolderOpen className="w-4 h-4" />
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
          <div className="grid grid-cols-2 gap-3">
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
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {image.localPath ? (
                    <img
                      src={`file://${image.localPath}`}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedImages.has(image.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Image Info */}
                <div className="p-2 bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={image.name}>
                    {image.aspectRatio?.replace("IMAGE_ASPECT_RATIO_", "") || "N/A"}
                  </p>
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
