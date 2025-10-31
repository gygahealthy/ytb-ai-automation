import { RefreshCw, Download, RotateCcw } from "lucide-react";

interface ImageGalleryToolbarProps {
  onSync: () => void;
  onDownload: () => void;
  onForceRefresh: () => void;
  isSyncing: boolean;
  isDownloading: boolean;
  isDisabled: boolean;
  imageCount: number;
  pendingDownloadCount: number;
}

/**
 * Image Gallery Toolbar (Optional)
 * Compact horizontal toolbar with quick actions
 */
export default function ImageGalleryToolbar({
  onSync,
  onDownload,
  onForceRefresh,
  isSyncing,
  isDownloading,
  isDisabled,
  imageCount,
  pendingDownloadCount,
}: ImageGalleryToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Quick Actions:</span>

      {/* Sync Button */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        onClick={onSync}
        disabled={isDisabled || isSyncing}
        title="Sync from server"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        <span>Sync</span>
      </button>

      {/* Download Button */}
      <button
        className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        onClick={onDownload}
        disabled={isDisabled || isDownloading || imageCount === 0}
        title="Download images"
      >
        <Download className={`w-3.5 h-3.5 ${isDownloading ? "animate-bounce" : ""}`} />
        <span>Download</span>
        {pendingDownloadCount > 0 && !isDownloading && (
          <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full min-w-[16px] text-center">
            {pendingDownloadCount}
          </span>
        )}
      </button>

      {/* Force Refresh Button */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        onClick={onForceRefresh}
        disabled={isDisabled}
        title="Force refresh - clear all records"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>
  );
}
