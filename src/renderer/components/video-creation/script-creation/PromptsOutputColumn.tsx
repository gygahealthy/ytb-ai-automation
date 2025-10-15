import React, { useState } from "react";
import {
  Play,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Wand2,
  Sparkles,
} from "lucide-react";
import { VideoPrompt } from "./VideoPromptGenerator";

interface PromptsOutputColumnProps {
  prompts: VideoPrompt[];
  isGenerating: boolean;
  simpleMode: boolean;
  topic: string;
  script: string;
  onGenerate: () => void;
  onRegeneratePrompt: (promptId: string) => void;
  onCopyPrompt: (prompt: string) => void;
}

export const PromptsOutputColumn: React.FC<PromptsOutputColumnProps> = ({
  prompts,
  isGenerating,
  simpleMode,
  topic,
  script,
  onGenerate,
  onRegeneratePrompt,
  onCopyPrompt,
}) => {
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);

  const toggleExpanded = (promptId: string) => {
    setExpandedPromptId(expandedPromptId === promptId ? null : promptId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Generate Button */}
      <div className="mb-4 flex items-center gap-4 flex-shrink-0">
        {/* Generate Button - Left Side */}
        <button
          onClick={onGenerate}
          disabled={
            isGenerating || (simpleMode && (!topic.trim() || !script.trim()))
          }
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

      {/* Content Area */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="text-center py-20">
            <Wand2 className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Generated prompts will appear here
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              Fill in the configuration and click "Generate"
            </p>
          </div>
        ) : (
          prompts.map((prompt) => {
            const isExpanded = expandedPromptId === prompt.id;
            return (
              <div
                key={prompt.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                {/* Prompt Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleExpanded(prompt.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          Scene {prompt.sceneNumber}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {prompt.duration}s
                        </span>
                      </div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {prompt.text}
                      </div>
                      {!isExpanded && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {prompt.prompt}
                        </div>
                      )}
                    </div>
                    <button className="ml-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 bg-white dark:bg-gray-800">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        FULL PROMPT
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {prompt.prompt}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyPrompt(prompt.prompt);
                        }}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegeneratePrompt(prompt.id);
                        }}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regen
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
                      >
                        <Play className="w-3 h-3" />
                        Gen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
