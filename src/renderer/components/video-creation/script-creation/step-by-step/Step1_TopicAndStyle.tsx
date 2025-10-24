import React from "react";
import { TopicInput } from "../TopicInput";
import { ScriptStyleSelector } from "../ScriptStyleSelector";
import { VideoStyle } from "../ScriptStyleSelector";

interface Step1Props {
  topic: string;
  onTopicChange: (topic: string) => void;
  numberOfTopics: number;
  onNumberOfTopicsChange: (count: number) => void;
  onGenerateTopics: () => void;
  suggestions: string[];
  selectedTopicId: string | null;
  onSelectSuggestion: (suggestion: string, id: string) => void;
  onSelectHintTopic: (topic: string, id: string) => void;
  onClearSuggestions: () => void;
  isGenerating: boolean;
  videoStyle: VideoStyle;
  onVideoStyleChange: (style: VideoStyle) => void;
  scriptLengthPreset: string;
  onScriptLengthChange: (preset: string) => void;
  customWordCount: number;
  onCustomWordCountChange: (count: number) => void;
}

export const Step1_TopicAndStyle: React.FC<Step1Props> = ({
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
  isGenerating,
  videoStyle,
  onVideoStyleChange,
  scriptLengthPreset,
  onScriptLengthChange,
  customWordCount,
  onCustomWordCountChange,
}) => {
  return (
    <div className="h-full overflow-auto px-6 py-8">
      <div className="space-y-6 animate-fadeIn">
        <TopicInput
          topic={topic}
          onTopicChange={onTopicChange}
          numberOfTopics={numberOfTopics}
          onNumberOfTopicsChange={onNumberOfTopicsChange}
          onGenerateTopics={onGenerateTopics}
          suggestions={suggestions}
          selectedTopicId={selectedTopicId}
          onSelectSuggestion={onSelectSuggestion}
          onSelectHintTopic={onSelectHintTopic}
          onClearSuggestions={onClearSuggestions}
          isGenerating={isGenerating}
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <ScriptStyleSelector
            selectedStyle={videoStyle}
            onStyleChange={onVideoStyleChange}
            scriptLengthPreset={scriptLengthPreset}
            onScriptLengthChange={onScriptLengthChange}
            customWordCount={customWordCount}
            onCustomWordCountChange={onCustomWordCountChange}
          />
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>1.</strong> Enter your video topic or idea (just a few words is enough)
            </p>
            <p>
              <strong>2.</strong> Choose a tone/style that matches your content
            </p>
            <p>
              <strong>3.</strong> AI generates a complete script divided into scenes
            </p>
            <p>
              <strong>4.</strong> Edit the script and choose visual style for the video
            </p>
            <p>
              <strong>5.</strong> Generate 8-second video prompts optimized for your chosen styles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
