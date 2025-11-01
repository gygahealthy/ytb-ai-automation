import { User, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VideoCreationModeTabs from "./VideoCreationModeTabs";
import type { VideoCreationMode } from "./VideoCreationModeTabs";

interface SingleVideoPageHeaderProps {
  creationMode: VideoCreationMode;
  onModeChange: (mode: VideoCreationMode) => void;
  selectedProfileId?: string;
  hasDefaultProfile: boolean;
  onOpenProfileDrawer: () => void;
  onOpenImageGallery?: () => void;
  creationMode_ingredients?: boolean;
}

export default function SingleVideoPageHeader({
  creationMode,
  onModeChange,
  selectedProfileId,
  hasDefaultProfile,
  onOpenProfileDrawer,
  onOpenImageGallery,
}: SingleVideoPageHeaderProps) {
  const navigate = useNavigate();

  // Handle mode change - navigate to studio if video-studio mode is selected
  const handleModeChange = (mode: VideoCreationMode) => {
    if (mode === "video-studio") {
      navigate("/video-creation/studio");
    } else {
      onModeChange(mode);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Single Video Creation</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create videos using single or multiple prompts</p>
        </div>

        {/* Mode tabs - centered */}
        <div className="flex-1 flex justify-center">
          <VideoCreationModeTabs currentMode={creationMode} onModeChange={handleModeChange} />
        </div>

        <div className="flex items-center gap-3">
          {/* Image Gallery button - only show in ingredients mode */}
          {creationMode === "ingredients" && onOpenImageGallery && (
            <button
              onClick={onOpenImageGallery}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              title="Open Image Gallery (Ctrl+M)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 7a3 3 0 106 0 3 3 0 00-6 0z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}

          <button
            onClick={onOpenProfileDrawer}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
              selectedProfileId || hasDefaultProfile
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
            title="Select profile & project (Ctrl+F)"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Video Studio Button - Gradient with animation */}
          <button
            onClick={() => navigate("/video-creation/studio")}
            className="relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-2xl hover:from-cyan-300 hover:via-blue-400 hover:to-purple-500 transform hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 dark:focus-visible:ring-cyan-600 group"
            title="Open Video Studio"
          >
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
            <Film className="w-4 h-4 opacity-95 relative z-10" />
            <span className="text-sm relative z-10">Video Studio</span>

            {/* Animated shimmer effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 animate-shimmer" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
