import React from "react";
import { Wand2, Sparkles } from "lucide-react";
import { HintForTopicPrompt } from "./HintForTopicPrompt";
import { AITopicSuggestions } from "./AITopicSuggestions";

interface TopicInputProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  numberOfTopics: number;
  onNumberOfTopicsChange: (count: number) => void;
  onGenerateTopics: () => void;
  suggestions: string[];
  selectedTopicId?: string | null;
  onSelectSuggestion: (topic: string, id: string) => void;
  onSelectHintTopic?: (topic: string, id: string) => void;
  onClearSuggestions: () => void;
  isGenerating?: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  onTopicChange,
  numberOfTopics,
  onNumberOfTopicsChange,
  onGenerateTopics,
  suggestions,
  selectedTopicId,
  onSelectSuggestion,
  onSelectHintTopic,
  onClearSuggestions,
  isGenerating = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" />
        What is your video's topic?
      </label>

      {/* Input Row: Topic Input + Number of Topics + Generate Button */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g., Benefits of meditation, iPhone 15 Review, Top 10 Travel Destinations"
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={numberOfTopics}
            onChange={(e) =>
              onNumberOfTopicsChange(
                Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
              )
            }
            min="1"
            max="20"
            className="w-16 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Number of topics to generate"
          />
          <button
            onClick={onGenerateTopics}
            disabled={isGenerating || !topic.trim()}
            className="px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            title="Generate AI topic suggestions"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
      </div>

      {/* Hint Section */}
      <HintForTopicPrompt onSelectTopic={onSelectHintTopic} />

      {/* AI Topic Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <AITopicSuggestions
            suggestions={suggestions}
            selectedTopicId={selectedTopicId}
            onSelectTopic={onSelectSuggestion}
            onClearSuggestions={onClearSuggestions}
          />
        </div>
      )}
    </div>
  );
};
