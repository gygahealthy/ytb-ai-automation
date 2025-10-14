// Modern JSX transform: no React import required
import { Plus } from "lucide-react";

type Props = {
  viewMode: "table" | "grid";
  setViewMode: (m: "table" | "grid") => void;
  onAdd: () => void;
};

export default function ChannelsToolbar({ viewMode, setViewMode, onAdd }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="inline-flex items-center gap-2 bg-transparent rounded-md p-1">
        <button
          onClick={() => setViewMode("table")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "table"
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Table
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === "grid"
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          Grid
        </button>
      </div>

      <button
        onClick={onAdd}
        aria-label="Add channel"
        title="Add new channel"
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 text-white rounded-full font-medium transition-transform hover:scale-105 shadow-xl"
      >
        <span
          className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 opacity-40 blur-xl animate-pulse"
          aria-hidden="true"
        />
        <Plus className="w-6 h-6 relative z-10" />
      </button>
    </div>
  );
}
