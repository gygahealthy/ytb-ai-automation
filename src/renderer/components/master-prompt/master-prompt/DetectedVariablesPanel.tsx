import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

type DetectedVariable = {
  name: string;
  occurrences: number[];
};

type Props = {
  variables: DetectedVariable[];
  onJumpToVariable: (position: number) => void;
  selectedOccurrences?: Record<string, number[]>; // Maps variable name to array of selected occurrence indices
  onSelectionChange?: (varName: string, selectedIndices: number[]) => void;
};

const DetectedVariablesPanel: React.FC<Props> = ({
  variables,
  onJumpToVariable,
  selectedOccurrences = {},
  onSelectionChange,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleOccurrence = (varName: string, occurrenceIndex: number) => {
    if (!onSelectionChange) return;

    const currentSelected = selectedOccurrences[varName] || [];
    const newSelected = currentSelected.includes(occurrenceIndex)
      ? currentSelected.filter((idx) => idx !== occurrenceIndex)
      : [...currentSelected, occurrenceIndex].sort((a, b) => a - b);

    onSelectionChange(varName, newSelected);
  };

  const removeSelection = (varName: string, occurrenceIndex: number) => {
    if (!onSelectionChange) return;
    const currentSelected = selectedOccurrences[varName] || [];
    const newSelected = currentSelected.filter(
      (idx) => idx !== occurrenceIndex
    );
    onSelectionChange(varName, newSelected);
  };

  // Calculate total selected items
  const totalSelected = Object.values(selectedOccurrences).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Get first occurrence position for a variable
  const getFirstOccurrenceForVariable = (varName: string): number | null => {
    const variable = variables.find((v) => v.name === varName);
    return variable && variable.occurrences.length > 0
      ? variable.occurrences[0]
      : null;
  };

  const handleJumpToVariable = (varName: string) => {
    const position = getFirstOccurrenceForVariable(varName);
    if (position !== null) {
      onJumpToVariable(position);
    }
  };

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Detected Variables
          </h4>
          <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            {variables.length}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Click + to select occurrence
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Variables List */}
        <div className="flex-1 overflow-y-auto">
          {variables.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-400 dark:text-slate-500 text-sm">
                No variables detected
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Use{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                  [VAR_NAME]
                </code>{" "}
                or{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                  {"{VAR_NAME}"}
                </code>{" "}
                syntax
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {variables.map((v) => {
                const selected = selectedOccurrences[v.name] || [];
                return (
                  <div
                    key={v.name}
                    className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-mono text-sm font-bold text-indigo-900 dark:text-indigo-100 break-all">
                          {v.name}
                        </div>
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium whitespace-nowrap">
                          {v.occurrences.length}×
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {v.occurrences.map((pos, idx) => {
                          const isSelected = selected.includes(idx);
                          const itemKey = `${v.name}-${idx}`;
                          const isHovered = hoveredItem === itemKey;

                          return (
                            <div
                              key={itemKey}
                              className="relative"
                              onMouseEnter={() => setHoveredItem(itemKey)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              {/* Main button */}
                              <button
                                onClick={() => onJumpToVariable(pos)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md text-white text-xs font-semibold transition-all shadow-sm hover:shadow ${
                                  isSelected
                                    ? "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500"
                                    : "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                                }`}
                                title={`${
                                  isSelected ? "Selected" : "Click"
                                } - occurrence ${idx + 1} (char ${pos})`}
                              >
                                {idx + 1}
                              </button>

                              {/* Action button on hover */}
                              {isHovered && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      removeSelection(v.name, idx);
                                    } else {
                                      toggleOccurrence(v.name, idx);
                                    }
                                  }}
                                  className={`absolute -top-2 -right-2 flex items-center justify-center rounded-full w-5 h-5 transition-all shadow-md ${
                                    isSelected
                                      ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                                      : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500"
                                  }`}
                                  title={
                                    isSelected
                                      ? `Remove occurrence ${idx + 1}`
                                      : `Add occurrence ${idx + 1}`
                                  }
                                >
                                  {isSelected ? (
                                    <Minus className="w-3 h-3 text-white" />
                                  ) : (
                                    <Plus className="w-3 h-3 text-white" />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Show selected count */}
                      {selected.length > 0 && (
                        <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                          {selected.length} selected
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Configuration Summary */}
        {totalSelected > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Selected Occurrences ({totalSelected})
            </h5>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {Object.entries(selectedOccurrences).map(([varName, indices]) => {
                if (indices.length === 0) return null;
                return (
                  <div
                    key={varName}
                    className="bg-white dark:bg-slate-700 rounded p-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleJumpToVariable(varName)}
                        className="font-mono font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex-1 text-left"
                        title={`Click to jump to ${varName}`}
                      >
                        {varName}
                      </button>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {indices.map((idx) => (
                          <button
                            key={`${varName}-${idx}`}
                            onClick={() => removeSelection(varName, idx)}
                            className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium"
                            title={`Click to remove occurrence ${idx + 1}`}
                          >
                            #{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DetectedVariablesPanel;
