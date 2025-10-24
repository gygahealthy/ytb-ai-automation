import React from "react";
import { RefreshCw, Wand2, Sparkles } from "lucide-react";

interface PromptsToolbarHeaderProps {
  prompts: any[];
  isGenerating: boolean;
  simpleMode: boolean;
  topic: string;
  script: string;
  onGenerate: () => void;
}

export const StepNavigationButtons: React.FC<PromptsToolbarHeaderProps> = ({
  prompts,
  isGenerating,
  simpleMode,
  topic,
  script,
  onGenerate,
}) => {
  return (
    <div className="mb-4 flex items-center gap-4 flex-shrink-0">
      {/* Generate Button - Left Side */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || (simpleMode && (!topic.trim() || !script.trim()))}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg flex items-center gap-2 font-medium transition-all shadow-md disabled:cursor-not-allowed flex-shrink-0"
      >
        {prompts.length > 0 ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate"}
          </>
        )}
      </button>

      {/* Title - Right Side */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <label className="text-sm font-semibold text-gray-900 dark:text-white">
          {prompts.length > 0 ? "AI Generated Prompts" : "Prompts Output"}
        </label>
      </div>
    </div>
  );
};
