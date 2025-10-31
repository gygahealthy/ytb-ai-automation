import { RefreshCw, Loader2, Download, RotateCcw, Upload } from "lucide-react";

interface ActionButtonsProps {
  onUpload: () => void;
  onSync: () => void;
  onDownload: () => void;
  onForceRefresh: () => void;
  isLoading: boolean;
  isSyncing: boolean;
  isDownloading: boolean;
  isExtractingSecret: boolean;
  hasStoragePath: boolean;
  hasProfileId: boolean;
  imageCount: number;
  pendingDownloadCount: number;
}

/**
 * Action Buttons - Upload, Sync, Download, Delete buttons
 */
export default function ActionButtons({
  onUpload,
  onSync,
  onDownload,
  onForceRefresh,
  isLoading,
  isSyncing,
  isDownloading,
  isExtractingSecret,
  hasStoragePath,
  hasProfileId,
  imageCount,
  pendingDownloadCount,
}: ActionButtonsProps) {
  const isDisabled = isLoading || isSyncing || isDownloading || isExtractingSecret || !hasStoragePath || !hasProfileId;

  return (
    <div className="flex items-center gap-2">
      {/* Upload Button */}
      <button
        className="relative p-2 border-2 border-purple-500 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        onClick={onUpload}
        disabled={isDisabled}
        title="Upload local image to Flow server"
      >
        {isLoading || isExtractingSecret ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
      </button>

      {/* Sync Button */}
      <button
        className="relative p-2 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        onClick={onSync}
        disabled={isDisabled}
        title="Fetch all images from server and update metadata. Preserves existing downloaded files."
      >
        {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
      </button>

      {/* Download Button */}
      <button
        className="relative p-2 border-2 border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        onClick={onDownload}
        disabled={isDisabled || imageCount === 0}
        title={
          imageCount === 0
            ? "No images to download. Sync metadata first."
            : "Download all images that don't have local files yet (uses worker threads)"
        }
      >
        {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        {pendingDownloadCount > 0 && !isDownloading && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full min-w-[20px] text-center">
            {pendingDownloadCount}
          </span>
        )}
      </button>

      {/* Force Refresh Button (Factory Reset) */}
      <button
        className="relative p-2 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        onClick={onForceRefresh}
        disabled={isLoading || isSyncing || isDownloading || isExtractingSecret || !hasProfileId}
        title="⚠️ Force refresh: Delete ALL image records from database (preserves downloaded files)"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
}
