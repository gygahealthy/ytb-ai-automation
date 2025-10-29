import { VideoGeneration } from "src/shared/types/video-creation.types";
import { useFilePathsStore } from "../../../../store/file-paths.store";
import { useToast } from "../../../../hooks/useToast";
import { DownloadVideoVeo3 as CommonDownloadVideo } from "../../../common/download";

/**
 * Adapter component that wraps the reusable DownloadVideo component
 * with domain-specific logic (file path store, toast notifications).
 *
 * This component handles:
 * - Reading downloadPath from useFilePathsStore
 * - Generating filename from generation metadata with naming conventions
 * - Auto-dating, indexing, and epoch timestamps based on settings
 * - Showing toast notifications for success/error
 */
export default function DownloadVideo({ generation }: { generation: VideoGeneration }) {
  const { singleVideoPath } = useFilePathsStore();
  const toast = useToast();

  if (!generation.videoUrl) return null;

  // Note: VideoGeneration doesn't have promptId mapping
  // Index will be applied by backend based on settings if needed
  const videoIndex = undefined;

  return (
    <div className="p-1">
      <CommonDownloadVideo
        videoUrl={generation.videoUrl}
        filename={`video-${generation.sceneId || generation.id}`}
        downloadPath={singleVideoPath}
        videoIndex={videoIndex}
        onSuccess={() => {
          toast.success(`✓ Video downloaded successfully!`, "Download Complete", 3000);
        }}
        onError={(err: string | Error) => {
          const message = err instanceof Error ? err.message : String(err);
          toast.error(message, "Download Failed", 5000);
        }}
        iconSize={20}
        showSpinner
      />
    </div>
  );
}
