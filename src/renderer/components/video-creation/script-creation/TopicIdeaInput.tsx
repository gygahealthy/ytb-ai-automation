import React from "react";
import { Lightbulb, Sparkles } from "lucide-react";
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

const quickSelectTopics = [
  "How to Create Engaging Short-Form Video Content for Social Media",
  "Complete Guide to Starting and Growing Your YouTube Channel",
  "Best Digital Marketing Strategies for Small Business Success",
  "Top 10 Productivity Tools and Apps for Remote Workers",
];

export const TopicIdeaInput: React.FC<TopicInputProps> = ({
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
        What is your video's topic IDEA?
      </label>

      {/* Input Row: Generate Button (left) + Topic Input + Number of Topics */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onGenerateTopics}
          disabled={isGenerating || !topic.trim()}
          className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-md"
          title="Generate AI topic hints"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Hint</span>
        </button>
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
            onChange={(e) => onNumberOfTopicsChange(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
            min="1"
            max="20"
            className="w-16 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Number of topics to generate"
          />
        </div>
      </div>

      {/* Hint Section - Inline */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4 space-y-3">
        {/* Tip Text */}
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-blue-600 dark:text-blue-400">Tip:</strong> Be specific with your topic for better results.
            Include the main subject and target audience if relevant.
          </p>
        </div>

        {/* Quick Select Examples */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {quickSelectTopics.map((quickTopic, index) => (
              <button
                key={index}
                onClick={() => onSelectHintTopic?.(quickTopic, `hint-${index}`)}
                className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-500 transition-all truncate"
                title={quickTopic}
              >
                {quickTopic}
              </button>
            ))}
          </div>
        </div>
      </div>

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
