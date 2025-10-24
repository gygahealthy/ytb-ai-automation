import React from "react";
import { Edit3 } from "lucide-react";
import { VisualStyleSelector } from "../VisualStyleSelector";
import { VisualStyle } from "../VisualStyleSelector";

interface Step2Props {
  editedScript: string;
  onScriptChange: (script: string) => void;
  visualStyle: VisualStyle;
  onVisualStyleChange: (style: VisualStyle) => void;
}

export const Step2_EditScriptAndVisualStyle: React.FC<Step2Props> = ({
  editedScript,
  onScriptChange,
  visualStyle,
  onVisualStyleChange,
}) => {
  return (
    <div className="h-full overflow-auto px-6 py-8">
      <div className="space-y-6 animate-fadeIn">
        {/* Script Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review & Edit Script</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Review the generated script and make any edits if necessary. The script is divided into 8 scenes for optimal video
            creation.
          </p>
          <textarea
            value={editedScript}
            onChange={(e) => onScriptChange(e.target.value)}
            className="w-full h-96 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Your generated script will appear here..."
          />
        </div>

        {/* Visual Style Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Visual/Artistic Style</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Select the artistic style that will be used to generate the visual prompts for your video. This determines the look
            and feel of your final video.
          </p>
          <VisualStyleSelector selectedStyle={visualStyle} onStyleChange={onVisualStyleChange} />
        </div>
      </div>
    </div>
  );
};
