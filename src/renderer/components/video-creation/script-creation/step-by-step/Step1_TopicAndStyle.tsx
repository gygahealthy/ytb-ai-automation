import React from "react";
import { TopicIdeaInput } from "../TopicIdeaInput";
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
    <div className="h-full overflow-auto px-6 py-8 relative">
      <div className="space-y-6 animate-fadeIn">
        <TopicIdeaInput
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
      </div>
    </div>
  );
};
