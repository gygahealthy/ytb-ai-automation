import { CheckCircle, Loader2, XCircle, Clock } from "lucide-react";
import { VideoGeneration } from "src/shared/types/video-creation.types";

export default function StatusBadge({ status }: { status: VideoGeneration["status"] }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full dark:bg-gray-900/30 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    default:
      return null;
  }
}
