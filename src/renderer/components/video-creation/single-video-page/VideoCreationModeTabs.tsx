import { FileText, Image, Film } from "lucide-react";

export type VideoCreationMode = "text-to-video" | "ingredients" | "video-studio";

interface VideoCreationModeTabsProps {
  currentMode: VideoCreationMode;
  onModeChange: (mode: VideoCreationMode) => void;
}

/**
 * Mode tabs for switching between text-to-video, ingredients, and video studio creation
 */
export default function VideoCreationModeTabs({ currentMode, onModeChange }: VideoCreationModeTabsProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
      <button
        onClick={() => onModeChange("text-to-video")}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          currentMode === "text-to-video"
            ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm">Text to Video</span>
      </button>
      <button
        onClick={() => onModeChange("ingredients")}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          currentMode === "ingredients"
            ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <Image className="w-4 h-4" />
        <span className="text-sm">Ingredients</span>
      </button>
      <button
        onClick={() => onModeChange("video-studio")}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          currentMode === "video-studio"
            ? "bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
      >
        <Film className="w-4 h-4" />
        <span className="text-sm">Video Studio</span>
      </button>
    </div>
  );
}
