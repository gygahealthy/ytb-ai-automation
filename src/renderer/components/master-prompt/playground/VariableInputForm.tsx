import { useState } from "react";

interface VariableInputFormProps {
  variableOccurrenceConfig: Record<string, number[]> | null;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
}

export function VariableInputForm({
  variableOccurrenceConfig,
  values,
  onValueChange,
}: VariableInputFormProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  if (
    !variableOccurrenceConfig ||
    Object.keys(variableOccurrenceConfig).length === 0
  ) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800">
        <svg
          className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          No variables configured.
          <br />
          Select a component prompt with variables.
        </div>
      </div>
    );
  }

  const variables = Object.keys(variableOccurrenceConfig);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Variable Values
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Enter values to preview replacements in real-time
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-5">
          {variables.map((varKey) => (
            <div
              key={varKey}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {varKey}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Replacements at:{" "}
                    <span className="font-mono">
                      {variableOccurrenceConfig[varKey].join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 relative group">
                <input
                  type="text"
                  value={values[varKey] || ""}
                  onChange={(e) => onValueChange(varKey, e.target.value)}
                  onMouseEnter={() => setHoveredKey(varKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                  placeholder={`Enter replacement value...`}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 text-sm font-mono transition-all duration-150"
                />
                {hoveredKey === varKey && (
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(varKey, "");
                      setHoveredKey(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Clear value"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
