import { Settings, RefreshCw, Download, RotateCcw, Grid3x3, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ImageGallerySettingsProps {
  onSync: () => void;
  onDownload: () => void;
  onForceRefresh: () => void;
  isSyncing: boolean;
  isDownloading: boolean;
  isDisabled: boolean;
  imageCount: number;
  pendingDownloadCount: number;
  gridColumns: 2 | 3 | 4 | 5;
  onGridColumnsChange: (cols: 2 | 3 | 4 | 5) => void;
  showToolbar: boolean;
  onToggleToolbar: (show: boolean) => void;
}

/**
 * Image Gallery Settings Dropdown
 * Contains Sync, Download, Force Refresh, Grid selector, and Toolbar toggle
 */
export default function ImageGallerySettings({
  onSync,
  onDownload,
  onForceRefresh,
  isSyncing,
  isDownloading,
  isDisabled,
  imageCount,
  pendingDownloadCount,
  gridColumns,
  onGridColumnsChange,
  showToolbar,
  onToggleToolbar,
}: ImageGallerySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Image Gallery Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          {/* Sync */}
          <button
            onClick={() => handleAction(onSync)}
            disabled={isDisabled || isSyncing}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-blue-500 ${isSyncing ? "animate-spin" : ""}`} />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Sync from Server</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Fetch latest metadata</div>
            </div>
          </button>

          {/* Download */}
          <button
            onClick={() => handleAction(onDownload)}
            disabled={isDisabled || isDownloading || imageCount === 0}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
          >
            <Download className="w-4 h-4 text-green-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Download Images
                {pendingDownloadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">{pendingDownloadCount}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Download pending images</div>
            </div>
          </button>

          {/* Separator */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Grid Size Selector */}
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

          {/* Separator */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Show/Hide Toolbar */}
          <button
            onClick={() => {
              onToggleToolbar(!showToolbar);
              setIsOpen(false);
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

          {/* Separator */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Force Refresh */}
          <button
            onClick={() => handleAction(onForceRefresh)}
            disabled={isDisabled}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-red-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">Force Refresh</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Clear all records</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
