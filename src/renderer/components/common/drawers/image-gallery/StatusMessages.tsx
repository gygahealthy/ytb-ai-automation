import { CheckCircle2 } from "lucide-react";

interface StatusMessagesProps {
  syncStatus: { synced: number; skipped: number } | null;
  downloadStatus: { downloaded: number; failed: number } | null;
  error: string | null;
  hasProfileId: boolean;
  hasStoragePath: boolean;
}

/**
 * Status Messages - Sync status, download status, errors, and warnings
 */
export default function StatusMessages({ syncStatus, downloadStatus, error, hasProfileId, hasStoragePath }: StatusMessagesProps) {
  return (
    <>
      {/* Sync Status */}
      {syncStatus && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            Synced {syncStatus.synced} new images, updated {syncStatus.skipped} existing
          </span>
        </div>
      )}

      {/* Download Status */}
      {downloadStatus && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            Downloaded {downloadStatus.downloaded} images
            {downloadStatus.failed > 0 && `, ${downloadStatus.failed} failed`}
          </span>
        </div>
      )}

      {/* Error Display */}
      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>}

      {/* Profile Warning */}
      {!hasProfileId && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
          ⚠️ Please configure a Flow profile in Settings &gt; Flow VEO3 and ensure it has active cookies.
        </div>
      )}

      {/* Storage Path Warning */}
      {!hasStoragePath && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ Please configure VEO3 Images storage path in Settings &gt; File Paths &amp; Naming
        </div>
      )}
    </>
  );
}
