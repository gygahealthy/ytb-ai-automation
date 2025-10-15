import React from "react";
import { Wand2, Sparkles } from "lucide-react";

interface TopicInputProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  onSuggestTopics: () => void;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  onTopicChange,
  onSuggestTopics,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-500" />
        What is your video's topic?
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g., Benefits of meditation, iPhone 15 Review, Top 10 Travel Destinations"
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={onSuggestTopics}
          className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          title="Get AI topic suggestions"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Suggest</span>
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Enter a short description or topic idea. AI will generate a complete
        script for you.
      </p>
    </div>
  );
};
