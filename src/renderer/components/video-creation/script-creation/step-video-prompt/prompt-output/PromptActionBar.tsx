import React from "react";
import { Play, Copy, RefreshCw } from "lucide-react";

interface PromptActionBarProps {
  onCopyPrompt: () => void;
  onRegeneratePrompt: () => void;
  onMakeVideos: () => void;
  onShowFullContent: () => void;
}

export const PromptActionBar: React.FC<PromptActionBarProps> = ({ onCopyPrompt, onRegeneratePrompt, onMakeVideos }) => {
  return (
    <div className="absolute left-0 right-0 bottom-3 px-4 pb-4 pt-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-20 flex gap-2 items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopyPrompt();
        }}
        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
      >
        <Copy className="w-3 h-3" />
        Copy
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRegeneratePrompt();
        }}
        className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
      >
        <RefreshCw className="w-3 h-3" />
        Regen
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMakeVideos();
        }}
        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
      >
        <Play className="w-3 h-3" />
        Make Videos
      </button>
    </div>
  );
};
