import { X, Image as ImageIcon } from "lucide-react";
import { useImageGalleryStore } from "@/renderer/store/image-gallery.store";
import { useEffect, useState } from "react";

/**
 * Selected Image Placeholders - Display 3 slots for selected images
 */
export default function SelectedImagePlaceholders() {
  const { selectedImages, removeSelectedImage, maxSelectedImages } = useImageGalleryStore();
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});

  // Load image data URLs for selected images
  useEffect(() => {
    const loadImages = async () => {
      for (const img of selectedImages) {
        if (img.localPath && !imageSrcCache[img.id]) {
          try {
            const result = await (window as any).electronAPI.imageVeo3.readImageFile(img.localPath);
            if (result.success && result.data?.dataUrl) {
              setImageSrcCache((prev) => ({ ...prev, [img.id]: result.data.dataUrl }));
            }
          } catch (error) {
            console.error("Error loading image:", error);
          }
        }
      }
    };

    loadImages();
  }, [selectedImages]);

  // Create array of 3 slots
  const slots = Array.from({ length: maxSelectedImages }, (_, i) => selectedImages[i] || null);

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((image, index) => (
        <div
          key={index}
          className={`relative aspect-video rounded-lg border-2 transition-all ${
            image
              ? "border-purple-500 bg-gray-100 dark:bg-gray-700"
              : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
          }`}
        >
          {image ? (
            <>
              {/* Image Preview */}
              <div className="w-full h-full overflow-hidden rounded-lg">
                {image.localPath && imageSrcCache[image.id] ? (
                  <img src={imageSrcCache[image.id]} alt={image.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeSelectedImage(image.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                title="Remove from selection"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Slot Number Badge */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-semibold rounded">
                {index + 1}
              </div>
            </>
          ) : (
            // Empty slot
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Slot {index + 1}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
