import React from "react";
import { Sparkles } from "lucide-react";
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
    <div className="h-full overflow-auto px-6 py-8">
      <div className="space-y-6 animate-fadeIn">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Visual Prompts</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate visual prompts for each scene in your script. These prompts will guide the video generation process to create
            visuals that match your story.
          </p>
        </div>

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
