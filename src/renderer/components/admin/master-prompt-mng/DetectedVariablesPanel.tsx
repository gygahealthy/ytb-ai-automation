import React from "react";

type DetectedVariable = {
  name: string;
  occurrences: number[];
};

type Props = {
  variables: DetectedVariable[];
  onJumpToVariable: (position: number) => void;
};

const DetectedVariablesPanel: React.FC<Props> = ({
  variables,
  onJumpToVariable,
}) => {
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
          Click numbers to jump to occurrence
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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
            {variables.map((v) => (
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
                    {v.occurrences.map((pos, idx) => (
                      <button
                        key={`${v.name}-${idx}`}
                        onClick={() => onJumpToVariable(pos)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm hover:shadow"
                        title={`Jump to occurrence ${idx + 1} (char ${pos})`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DetectedVariablesPanel;
