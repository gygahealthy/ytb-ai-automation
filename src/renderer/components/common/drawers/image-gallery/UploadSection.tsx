import { Upload, Loader2 } from "lucide-react";

interface UploadSectionProps {
  onUpload: () => void;
  isLoading: boolean;
  isSyncing: boolean;
  isDownloading: boolean;
  isExtractingSecret: boolean;
  hasStoragePath: boolean;
  hasProfileId: boolean;
}

/**
 * Upload Section - Upload area button
 * Opens dialog instantly, validates configuration afterward
 */
export default function UploadSection({
  onUpload,
  isLoading,
  isSyncing,
  isDownloading,
  isExtractingSecret,
  hasStoragePath,
  hasProfileId,
}: UploadSectionProps) {
  // Only disable during active operations, not for missing config
  const isDisabled = isLoading || isSyncing || isDownloading || isExtractingSecret;

  const getTitle = (): string => {
    if (!hasProfileId) return "Will prompt to configure Flow profile after selecting image";
    if (!hasStoragePath) return "Will prompt to configure storage path after selecting image";
    if (isExtractingSecret) return "Extracting API secret...";
    return "Upload local image to Flow server";
  };

  return (
    <button
      className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600"
      onClick={onUpload}
      disabled={isDisabled}
      title={getTitle()}
    >
      {isLoading || isExtractingSecret ? (
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      ) : (
        <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition-colors" />
      )}
      <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
        {isExtractingSecret ? "Extracting Secret..." : "Upload Image"}
      </span>
    </button>
  );
}
