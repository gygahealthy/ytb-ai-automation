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
    <div className="h-full flex flex-col px-6 py-6 gap-4">
      {/* Script Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review & Edit Script</h2>
          </div>
        </div>
        <textarea
          value={editedScript}
          onChange={(e) => onScriptChange(e.target.value)}
          className="w-full h-96 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Your generated script will appear here..."
        />
      </div>

      {/* Visual Style Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex-shrink-0">Choose Visual/Artistic Style</h2>
        <div className="flex-1 overflow-hidden">
          <VisualStyleSelector selectedStyle={visualStyle} onStyleChange={onVisualStyleChange} />
        </div>
      </div>
    </div>
  );
};
