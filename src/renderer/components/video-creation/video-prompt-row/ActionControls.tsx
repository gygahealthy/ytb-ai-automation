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
    <div className="flex-shrink-0 flex flex-col gap-2 items-center justify-center py-2 px-1 rounded-lg">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onTogglePreview(promptId)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-shadow focus:outline-none focus:ring-2 ${
            showPreview
              ? "bg-primary-600 text-white shadow-md hover:shadow-lg"
              : "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={showPreview ? "Hide preview" : "Show preview"}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onShowInfo(promptId)}
          disabled={!job}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-shadow focus:outline-none ${
            job
              ? "bg-white/90 text-blue-600 dark:bg-gray-900/60 hover:shadow-md"
              : "bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
          }`}
          title={job ? "View job details" : "No video created yet"}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={() => onCreate(promptId, promptText)}
          disabled={!isValid}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-shadow focus:outline-none ${
            isValid
              ? "bg-gradient-to-r from-primary-500 to-primary-600 shadow-md hover:shadow-lg"
              : "bg-gray-300 dark:bg-gray-700 opacity-40 cursor-not-allowed"
          }`}
          title="Create video from this prompt"
        >
          <Play className="w-4 h-4" />
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(promptId)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
            title="Delete this prompt"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
