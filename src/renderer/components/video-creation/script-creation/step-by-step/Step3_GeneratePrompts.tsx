import React from "react";
import { VideoPromptGenerator, VideoPrompt } from "../VideoPromptGenerator";
import { VideoStyle } from "../ScriptStyleSelector";
import { VisualStyle } from "../VisualStyleSelector";

interface Step3Props {
  script: string;
  topic: string;
  selectedTopic: string | null;
  videoStyle: VideoStyle;
  visualStyle: VisualStyle;
  scriptLengthPreset?: string;
  customWordCount?: number;
  onPromptsGenerated: (prompts: VideoPrompt[]) => void;
  onBackToEdit: () => void;
}

export const Step3_GeneratePrompts: React.FC<Step3Props> = ({
  script,
  topic,
  selectedTopic,
  videoStyle,
  visualStyle,
  scriptLengthPreset = "medium",
  customWordCount = 140,
  onPromptsGenerated,
  onBackToEdit,
}) => {
  return (
    <div className="h-full overflow-auto px-6 py-4">
      <div className="space-y-3 animate-fadeIn">
        {/* Prompt Generator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <VideoPromptGenerator
            script={script}
            topic={topic}
            selectedTopic={selectedTopic}
            style={videoStyle}
            videoStyle={videoStyle}
            visualStyle={visualStyle}
            scriptLengthPreset={scriptLengthPreset}
            customWordCount={customWordCount}
            onPromptsGenerated={onPromptsGenerated}
            onBackToEdit={onBackToEdit}
          />
        </div>
      </div>
    </div>
  );
};
