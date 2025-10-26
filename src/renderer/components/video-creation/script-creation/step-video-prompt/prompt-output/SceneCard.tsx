import React from "react";

interface SceneCardProps {
  sceneData: any;
  sceneIndex: number;
  onShowDetails: (data: any, index: number) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ sceneData, sceneIndex, onShowDetails }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-3 hover:border-purple-400 dark:hover:border-purple-500 transition-colors shadow-sm hover:shadow-md flex flex-col min-h-[280px] relative w-full">
      {/* Scene number badge */}
      <div
        className="cursor-pointer absolute -top-2 -left-2 w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10"
        onClick={(e) => {
          e.stopPropagation();
          onShowDetails(sceneData, sceneIndex);
        }}
      >
        {sceneIndex + 1}
      </div>
      {typeof sceneData === "object" && sceneData !== null ? (
        <div className="space-y-2 flex-1 pr-2 mt-2">
          {Object.entries(sceneData).map(([key, value]) => (
            <div key={key} className="w-full">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1 truncate">
                {key.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-gray-900 dark:text-white break-words line-clamp-4">
                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-900 dark:text-white flex-1 break-words pr-2 mt-2">{String(sceneData)}</div>
      )}
    </div>
  );
};
