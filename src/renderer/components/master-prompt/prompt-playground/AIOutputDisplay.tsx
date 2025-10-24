interface AIOutputDisplayProps {
  output: string | null;
  isLoading: boolean;
  error: string | null;
}

import { useMemo, useState } from "react";

export function AIOutputDisplay({
  output,
  isLoading,
  error,
}: AIOutputDisplayProps) {
  const [cardView, setCardView] = useState(true);

  const parsed = useMemo(() => {
    if (!output) return null;

    const tryParse = (text: string | null) => {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    };

    // 1) If output contains a markdown code fence with JSON, extract and parse it
    const fenceMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      const candidate = fenceMatch[1].trim();
      const p = tryParse(candidate);
      if (p !== null) return p;
    }

    // 2) Try parsing the whole output directly
    const direct = tryParse(output.trim());
    if (direct !== null) return direct;

    // 3) Try to locate the first JSON array/object substring and parse it
    const c = output.trim();
    const firstArr = c.indexOf("[");
    const lastArr = c.lastIndexOf("]");
    if (firstArr !== -1 && lastArr > firstArr) {
      const sub = c.substring(firstArr, lastArr + 1);
      const p = tryParse(sub);
      if (p !== null) return p;
    }

    const firstObj = c.indexOf("{");
    const lastObj = c.lastIndexOf("}");
    if (firstObj !== -1 && lastObj > firstObj) {
      const sub = c.substring(firstObj, lastObj + 1);
      const p = tryParse(sub);
      if (p !== null) return p;
    }

    return null;
  }, [output]);

  const isArray = Array.isArray(parsed);

  return (
    <div className="h-full flex flex-col border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              AI Response
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Output from the AI model after processing the prompt
            </p>
          </div>
          {isArray && (
            <button
              onClick={() => setCardView((s) => !s)}
              title={cardView ? "Show raw JSON" : "Show card view"}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="hidden sm:inline">
                {cardView ? "Card View" : "Raw JSON"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-300 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-300 mb-4"></div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Processing your prompt...
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Waiting for AI response
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <div className="font-semibold text-red-800 dark:text-red-400 text-sm">
                  Error occurred
                </div>
                <div className="text-red-700 dark:text-red-300 whitespace-pre-wrap text-xs mt-2 font-mono bg-red-100/50 dark:bg-red-900/30 p-3 rounded">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && !output && (
          <div className="flex flex-col items-center justify-center h-full">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                No response yet
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Send a prompt to see the AI response here
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && output && (
          <div>
            {isArray && cardView ? (
              <div className="grid grid-cols-1 gap-4">
                {parsed.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                  >
                    {typeof item === "string" ? (
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {item}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <div className="text-xs text-gray-500">{k}</div>
                            <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                              {JSON.stringify(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono">
                  {output}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
