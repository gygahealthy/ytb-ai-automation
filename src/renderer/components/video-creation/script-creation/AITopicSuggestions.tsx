import React from "react";
import { Sparkles, Check } from "lucide-react";

interface AITopicSuggestionsProps {
  suggestions: string[];
  selectedTopicId?: string | null;
  onSelectTopic: (topic: string, id: string) => void;
  onClearSuggestions?: () => void;
}

export const AITopicSuggestions: React.FC<AITopicSuggestionsProps> = ({
  suggestions,
  selectedTopicId,
  onSelectTopic,
  // onClearSuggestions,
}) => {
  // Filter out empty or invalid suggestions
  const validSuggestions = suggestions.filter((s) => s && typeof s === "string" && s.trim().length > 0);

  if (validSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="h-64 overflow-y-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI-Generated Topic Suggestions</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {validSuggestions.map((suggestion, index) => {
          const topicId = `topic-${index}`;
          const isSelected = selectedTopicId === topicId;
          return (
            <button
              key={index}
              onClick={() => onSelectTopic(suggestion, topicId)}
              className={`px-3 py-3 rounded-lg text-left text-sm transition-all line-clamp-3 border-2 flex items-start justify-between gap-2 ${
                isSelected
                  ? "bg-purple-200 dark:bg-purple-800/40 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-100"
                  : "bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:border-purple-400 dark:hover:border-purple-500"
              }`}
            >
              <span className="flex-1">{suggestion}</span>
              {isSelected && <Check className="w-5 h-5 flex-shrink-0 text-purple-600 dark:text-purple-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
