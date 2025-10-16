import React from "react";
import { Lightbulb } from "lucide-react";

interface HintForTopicPromptProps {
  onSelectTopic?: (topic: string, id: string) => void;
}

const quickSelectTopics = [
  "How to Create Engaging Short-Form Video Content for Social Media",
  "Complete Guide to Starting and Growing Your YouTube Channel",
  "Best Digital Marketing Strategies for Small Business Success",
  "Top 10 Productivity Tools and Apps for Remote Workers",
];

export const HintForTopicPrompt: React.FC<HintForTopicPromptProps> = ({
  onSelectTopic,
}) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4 space-y-3">
      {/* Tip Text */}
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-blue-600 dark:text-blue-400">Tip:</strong> Be
          specific with your topic for better results. Include the main subject
          and target audience if relevant.
        </p>
      </div>

      {/* Quick Select Examples */}
      <div className="space-y-2">
        {/* <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Quick Examples
          </p>
        </div> */}
        <div className="grid grid-cols-4 gap-2">
          {quickSelectTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => onSelectTopic?.(topic, `hint-${index}`)}
              className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-400 dark:hover:border-blue-500 transition-all truncate"
              title={topic}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
