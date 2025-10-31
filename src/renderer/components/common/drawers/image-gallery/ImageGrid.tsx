import { Image, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { useImageGalleryStore } from "@/renderer/store/image-gallery.store";
import { useAlert } from "@/renderer/hooks/useAlert";
import type { SelectedImageInfo } from "@/shared/types/video-creation.types";

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

interface ImageGridProps {
  images: LocalImage[];
  imageSrcCache: Record<string, string>;
  isLoading: boolean;
  gridColumns: 2 | 3 | 4 | 5;
  onImageDeleted?: () => void;
  // Optional custom selection override (for per-prompt selection)
  customSelectedImages?: SelectedImageInfo[];
  onCustomImageToggle?: (image: LocalImage) => void;
}

/**
 * Image Grid - Display image thumbnails with selection (max 3, FIFO)
 * Supports both global selection (default) and custom per-prompt selection
 */
export default function ImageGrid({
  images,
  imageSrcCache,
  isLoading,
  gridColumns,
  onImageDeleted,
  customSelectedImages,
  onCustomImageToggle,
}: ImageGridProps) {
  const { selectedImages: globalSelectedImages, toggleImageSelection } = useImageGalleryStore();
  const { show: showAlert } = useAlert();

  // Use custom selection if provided, otherwise use global
  const selectedImages = customSelectedImages !== undefined ? customSelectedImages : globalSelectedImages;
  const useCustomSelection = customSelectedImages !== undefined && onCustomImageToggle !== undefined;

  const handleToggleSelection = (image: LocalImage) => {
    if (useCustomSelection && onCustomImageToggle) {
      onCustomImageToggle(image);
    } else {
      toggleImageSelection({
        id: image.id,
        name: image.name,
        mediaKey: image.mediaKey,
        localPath: image.localPath,
        fifeUrl: image.fifeUrl,
        aspectRatio: image.aspectRatio,
        profileId: image.profileId,
      });
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent, image: LocalImage) => {
    e.stopPropagation(); // Prevent toggling selection

    // Show confirmation dialog
    showAlert({
      title: "Delete Image",
      message: `Are you sure you want to delete "${image.name}"? This will remove it from both the server and local database.`,
      severity: "warning",
      duration: null, // Manual dismiss
    });

    // Use a custom confirmation approach since useAlert doesn't support callbacks
    // We'll use a native confirm for now (can be replaced with a proper modal later)
    const confirmed = window.confirm(
      `Delete image "${image.name}"?\n\nThis will remove it from both the server and local database.`
    );

    if (!confirmed) return;

    try {
      const result = await (window as any).electronAPI.imageVeo3.deleteImage(image.id, image.profileId);

      if (result.success) {
        showAlert({
          title: "Success",
          message: "Image deleted successfully",
          severity: "success",
        });

        // Call callback to refresh the image list
        if (onImageDeleted) {
          onImageDeleted();
        }
      } else {
        showAlert({
          title: "Delete Failed",
          message: result.error || "Failed to delete image",
          severity: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: `Failed to delete image: ${String(error)}`,
        severity: "error",
      });
    }
  };

  const isImageSelected = (imageId: string) => {
    return selectedImages.some((img) => img.id === imageId);
  };
  if (isLoading && images.length === 0) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">No images uploaded yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Upload images or sync from Flow to use as ingredients for video generation
        </p>
      </div>
    );
  }

  const gridClass =
    gridColumns === 2 ? "grid-cols-2" : gridColumns === 3 ? "grid-cols-3" : gridColumns === 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {images.map((image) => (
        <div
          key={image.id}
          className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 ${
            isImageSelected(image.id)
              ? "border-purple-500 shadow-lg scale-[1.02]"
              : "border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:scale-[1.02]"
          }`}
          onClick={() => handleToggleSelection(image)}
        >
          {/* Delete Button - Top Right Corner (half outside, half inside) */}
          <div
            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10 shadow-lg hover:scale-110 active:scale-95"
            onClick={(e) => handleDeleteImage(e, image)}
            title="Delete image"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </div>

          {/* Image Thumbnail */}
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
            {image.localPath && imageSrcCache[image.id] ? (
              <img
                src={imageSrcCache[image.id]}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error("Failed to load image:", image.localPath);
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector(".image-error-placeholder")) {
                    const placeholder = document.createElement("div");
                    placeholder.className =
                      "image-error-placeholder w-full h-full flex flex-col items-center justify-center gap-1";
                    placeholder.innerHTML =
                      '<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="text-xs text-red-400">Failed to load</span>';
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

            {/* Selection Indicator - Bottom Left */}
            {isImageSelected(image.id) && (
              <div className="absolute bottom-2 left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
