import { Archive, Eye, EyeOff, Info, Play } from "lucide-react";

export default function ActionControls({
  showPreview,
  onTogglePreview,
  job,
  onShowInfo,
  onCreate,
  onDelete,
  canDelete,
  isValid,
  promptId,
  promptText,
}: {
  showPreview: boolean;
  onTogglePreview: (id: string) => void;
  job?: any;
  onShowInfo: (id: string) => void;
  onCreate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  isValid: boolean;
  promptId: string;
  promptText: string;
}) {
  return (
    <div className="flex-shrink-0 flex flex-col gap-1 items-center justify-center py-2 px-1 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col gap-1 pb-1 mb-1 border-b border-gray-300 dark:border-gray-600">
        <button
          onClick={() => onTogglePreview(promptId)}
          className={`p-2 rounded-md transition-all shadow-sm ${
            showPreview
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
          }`}
          title={showPreview ? "Hide preview" : "Show preview"}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onShowInfo(promptId)}
          disabled={!job}
          className={`p-2 rounded-md transition-all shadow-sm ${
            job
              ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600"
              : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
          }`}
          title={job ? "View job details" : "No video created yet"}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={() => onCreate(promptId, promptText)}
          disabled={!isValid}
          className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
          title="Create video from this prompt"
        >
          <Play className="w-4 h-4" />
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(promptId)}
            className="p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all shadow-sm border border-gray-200 dark:border-gray-600"
            title="Delete this prompt"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
