import {
  X,
  Image as ImageIcon,
  XCircle,
  Upload,
  Settings,
  RefreshCw,
  Download,
  RotateCcw,
  Grid3x3,
  Eye,
  EyeOff,
} from "lucide-react";
import { useImageGalleryStore } from "@/renderer/store/image-gallery.store";
import { useEffect, useState, useRef } from "react";

interface SelectedImagePlaceholdersProps {
  onUpload?: () => void;
  isUploading?: boolean;
  // Settings props
  onSync?: () => void;
  onDownload?: () => void;
  onForceRefresh?: () => void;
  isSyncing?: boolean;
  isDownloading?: boolean;
  isDisabled?: boolean;
  imageCount?: number;
  pendingDownloadCount?: number;
  gridColumns?: 2 | 3 | 4 | 5;
  onGridColumnsChange?: (cols: 2 | 3 | 4 | 5) => void;
  showToolbar?: boolean;
  onToggleToolbar?: (show: boolean) => void;
}

/**
 * Selected Image Placeholders - Display 3 slots for selected images with upload button and clear all
 */
export default function SelectedImagePlaceholders({
  onUpload,
  isUploading,
  onSync,
  onDownload,
  onForceRefresh,
  isSyncing = false,
  isDownloading = false,
  isDisabled = false,
  imageCount = 0,
  pendingDownloadCount = 0,
  gridColumns = 3,
  onGridColumnsChange,
  showToolbar = true,
  onToggleToolbar,
}: SelectedImagePlaceholdersProps) {
  const { selectedImages, removeSelectedImage, clearSelectedImages, maxSelectedImages } = useImageGalleryStore();
  const [imageSrcCache, setImageSrcCache] = useState<Record<string, string>>({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleSettingsAction = (action: () => void) => {
    action();
    setIsSettingsOpen(false);
  };

  // Create array of 3 slots
  const slots = Array.from({ length: maxSelectedImages }, (_, i) => selectedImages[i] || null);

  const hasSelectedImages = selectedImages.length > 0;

  return (
    <div>
      {/* Header with Clear All and Settings buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Images ({selectedImages.length}/{maxSelectedImages})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasSelectedImages && (
            <button
              onClick={clearSelectedImages}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
              title="Clear all selections"
            >
              <XCircle className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
          {/* Settings Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center justify-center w-16 h-16 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
              title="Settings"
            >
              <Settings
                className={`w-8 h-8 transition-transform duration-300 ${isSettingsOpen ? "rotate-90" : "hover:rotate-45"}`}
              />
            </button>

            {/* Settings Dropdown Menu */}
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                {/* Sync */}
                {onSync && (
                  <button
                    onClick={() => handleSettingsAction(onSync)}
                    disabled={isDisabled || isSyncing}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-blue-500 ${isSyncing ? "animate-spin" : ""}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Sync from Server</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Fetch latest metadata</div>
                    </div>
                  </button>
                )}

                {/* Download */}
                {onDownload && (
                  <button
                    onClick={() => handleSettingsAction(onDownload)}
                    disabled={isDisabled || isDownloading || imageCount === 0}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                  >
                    <Download className="w-4 h-4 text-green-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Download Images
                        {pendingDownloadCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                            {pendingDownloadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Download pending images</div>
                    </div>
                  </button>
                )}

                {/* Separator */}
                {(onSync || onDownload) && (onGridColumnsChange || onToggleToolbar) && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                )}

                {/* Grid Size Selector */}
                {onGridColumnsChange && (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-3 mb-2">
                      <Grid3x3 className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Grid Size</span>
                    </div>
                    <div className="flex gap-2 ml-7">
                      {([2, 3, 4, 5] as const).map((cols) => (
                        <button
                          key={cols}
                          onClick={() => onGridColumnsChange(cols)}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${
                            gridColumns === cols
                              ? "bg-purple-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {cols}×1
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator */}
                {onToggleToolbar && onGridColumnsChange && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                )}

                {/* Show/Hide Toolbar */}
                {onToggleToolbar && (
                  <button
                    onClick={() => {
                      onToggleToolbar(!showToolbar);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                  >
                    {showToolbar ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
                      </div>
                    </div>
                  </button>
                )}

                {/* Separator */}
                {onForceRefresh && (onSync || onDownload || onGridColumnsChange || onToggleToolbar) && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                )}

                {/* Force Refresh */}
                {onForceRefresh && (
                  <button
                    onClick={() => handleSettingsAction(onForceRefresh)}
                    disabled={isDisabled}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-red-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">Force Refresh</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Clear all records and files</div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 Image Slots - Larger */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {slots.map((image, index) => (
          <div key={index} className="relative">
            {/* Inner container with border and rounded corners */}
            <div
              className={`relative aspect-video rounded-lg border-2 transition-all overflow-hidden ${
                image
                  ? "border-purple-500 bg-gray-100 dark:bg-gray-700"
                  : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
              }`}
            >
              {image ? (
                <>
                  {/* Image Preview */}
                  <div className="w-full h-full overflow-hidden">
                    {image.localPath && imageSrcCache[image.id] ? (
                      <img src={imageSrcCache[image.id]} alt={image.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Slot Number Badge */}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-purple-500 text-white text-sm font-semibold rounded">
                    {index + 1}
                  </div>
                </>
              ) : (
                // Empty slot
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Slot {index + 1}</span>
                </div>
              )}
            </div>

            {/* Remove Button - Outside the inner container to avoid clipping */}
            {image && (
              <button
                onClick={() => removeSelectedImage(image.id)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                title="Remove from selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upload Area - Compact with dotted border at bottom */}
      {onUpload && (
        <button
          onClick={onUpload}
          disabled={isUploading}
          className="w-full py-1 border-2 border-dashed border-purple-400 dark:border-purple-500 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex flex-col items-center justify-center gap-1.5"
          title="Upload new image"
        >
          <Upload className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            {isUploading ? "Uploading..." : "Upload Image"}
          </span>
        </button>
      )}
    </div>
  );
}
