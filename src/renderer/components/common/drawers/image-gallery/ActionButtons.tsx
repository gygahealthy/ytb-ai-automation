import { RefreshCw, Loader2, Image, Trash2 } from "lucide-react";

interface ActionButtonsProps {
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
 * Action Buttons - Sync, Download, Delete buttons
 */
export default function ActionButtons({
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
    <div className="flex gap-2">
      {/* Sync Button */}
      <button
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        onClick={onSync}
        disabled={isDisabled}
        title="Fetch all images from server and update metadata. Preserves existing downloaded files."
      >
        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        <span>Sync</span>
      </button>

      {/* Download Button */}
      <button
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        onClick={onDownload}
        disabled={isDisabled || imageCount === 0}
        title={
          imageCount === 0
            ? "No images to download. Sync metadata first."
            : "Download all images that don't have local files yet (uses worker threads)"
        }
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        <span>Download</span>
        {pendingDownloadCount > 0 && !isDownloading && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">{pendingDownloadCount}</span>
        )}
      </button>

      {/* Delete Button */}
      <button
        className="px-3 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm"
        onClick={onForceRefresh}
        disabled={isLoading || isSyncing || isDownloading || isExtractingSecret || !hasProfileId}
        title="⚠️ Delete ALL image records from database (preserves downloaded files)"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
