import React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { Layers, List } from "lucide-react";

interface ScriptCreatePageToolbarProps {
  viewMode: "step-by-step" | "simple";
  onViewModeChange: (mode: "step-by-step" | "simple") => void;
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  hasTopicOrScript?: boolean;
  hasScript?: boolean;
}

export const ScriptCreatePageToolbar: React.FC<ScriptCreatePageToolbarProps> = ({
  viewMode,
  onViewModeChange,
  currentStep,
  onStepChange,
  hasTopicOrScript = false,
  hasScript = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Story Generator</h1>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("step-by-step")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "step-by-step"
                    ? "bg-white dark:bg-gray-800 text-blue-500 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                Step-by-Step
              </button>
              <button
                onClick={() => onViewModeChange("simple")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "simple"
                    ? "bg-white dark:bg-gray-800 text-blue-500 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
                Simple
              </button>
            </div>

            {/* Step Navigation - Only show in step-by-step mode */}
            {viewMode === "step-by-step" && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onStepChange(1)}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 transition-all ${currentStep >= 1 ? "text-blue-500" : "text-gray-400"} ${
                    currentStep === 1 ? "cursor-default" : "cursor-pointer hover:opacity-80"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-sm font-medium">Topic & Style</span>
                </button>
                <button
                  onClick={() => hasTopicOrScript && currentStep !== 2 && onStepChange(2)}
                  disabled={!hasTopicOrScript || currentStep === 2}
                  className={`transition-all ${
                    hasTopicOrScript && currentStep !== 2 ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"
                  }`}
                  title={hasTopicOrScript ? "Go to Edit Script" : "Generate a script first"}
                >
                  <ChevronRight className={`w-4 h-4 ${hasTopicOrScript ? "text-blue-500" : "text-gray-400"}`} />
                </button>
                <button
                  onClick={() => hasTopicOrScript && onStepChange(2)}
                  disabled={!hasTopicOrScript}
                  className={`flex items-center gap-2 transition-all ${currentStep >= 2 ? "text-blue-500" : "text-gray-400"} ${
                    !hasTopicOrScript
                      ? "cursor-not-allowed"
                      : currentStep === 2
                      ? "cursor-default"
                      : "cursor-pointer hover:opacity-80"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium">Edit Script & Visual Style</span>
                </button>
                <button
                  onClick={() => hasScript && currentStep !== 3 && onStepChange(3)}
                  disabled={!hasScript || currentStep === 3}
                  className={`transition-all ${
                    hasScript && currentStep !== 3 ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"
                  }`}
                  title={hasScript ? "Go to Generate Prompts" : "Generate a script first"}
                >
                  <ChevronRight className={`w-4 h-4 ${hasScript ? "text-blue-500" : "text-gray-400"}`} />
                </button>
                <button
                  onClick={() => hasScript && onStepChange(3)}
                  disabled={!hasScript}
                  className={`flex items-center gap-2 transition-all ${currentStep >= 3 ? "text-blue-500" : "text-gray-400"} ${
                    !hasScript ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 3 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-sm font-medium">Generate Prompts</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
