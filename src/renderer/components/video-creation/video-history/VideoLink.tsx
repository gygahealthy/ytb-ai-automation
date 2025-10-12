import { ExternalLink } from "lucide-react";
import { VideoGeneration } from "src/shared/types/video-creation.types";

export default function VideoLink({ generation }: { generation: VideoGeneration }) {
  if (!generation.videoUrl) return null;
  return (
    <div className="p-1">
      <a href={generation.videoUrl} target="_blank" rel="noopener noreferrer" className="text-green-700 dark:text-green-400 hover:underline inline-flex items-center">
        <ExternalLink className="w-5 h-5" />
      </a>
    </div>
  );
}
