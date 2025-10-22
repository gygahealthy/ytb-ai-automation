import { useMemo } from "react";
import { detectTemplateVariables } from "@/shared/utils/template-replacement.util";

interface PromptPreviewProps {
  template: string;
  variableOccurrenceConfig: Record<string, number[]> | null;
  values: Record<string, string>;
  onSendToAI: () => void;
  isSending: boolean;
}

export function PromptPreview({
  template,
  variableOccurrenceConfig,
  values,
  onSendToAI,
  isSending,
}: PromptPreviewProps) {
  // Generate preview with highlighted variables
  const previewContent = useMemo(() => {
    if (!template) return [];

    const detected = detectTemplateVariables(template);
    if (detected.length === 0) {
      return [{ type: "text" as const, content: template }];
    }

    // Group by variable name for occurrence tracking
    const occurrenceCounters: Record<string, number> = {};

    const segments: Array<{
      type: "text" | "variable";
      content: string;
      varName?: string;
      occurrenceIndex?: number;
      isReplaced?: boolean;
      replacementValue?: string;
    }> = [];

    let lastPos = 0;

    for (const variable of detected) {
      // Add text before this variable
      if (variable.position > lastPos) {
        segments.push({
          type: "text",
          content: template.substring(lastPos, variable.position),
        });
      }

      // Track occurrence index
      if (!occurrenceCounters[variable.name]) {
        occurrenceCounters[variable.name] = 0;
      }
      const occurrenceIndex = occurrenceCounters[variable.name];
      occurrenceCounters[variable.name]++;

      // Check if this occurrence should be replaced (only specific indices)
      const indicesForVar = variableOccurrenceConfig
        ? variableOccurrenceConfig[variable.name]
        : undefined;

      const shouldReplace = Array.isArray(indicesForVar)
        ? indicesForVar.includes(occurrenceIndex)
        : true; // when no config provided, allow replacement of all

      const hasValue = Boolean(
        values[variable.name] && values[variable.name].trim() !== ""
      );

      const placeholder =
        variable.syntax === "brace"
          ? `{${variable.name}}`
          : `[${variable.name}]`;

      segments.push({
        type: "variable",
        content: placeholder,
        varName: variable.name,
        occurrenceIndex,
        isReplaced: !!(shouldReplace && hasValue),
        replacementValue: hasValue ? values[variable.name] : undefined,
      });

      lastPos = variable.position + placeholder.length;
    }

    // Add remaining text
    if (lastPos < template.length) {
      segments.push({
        type: "text",
        content: template.substring(lastPos),
      });
    }

    return segments;
  }, [template, variableOccurrenceConfig, values]);

  if (!template) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Select a component prompt to preview
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Prompt Preview
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Variables highlighted in green will be replaced. Yellow variables need
          values or configuration.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
            {previewContent.map((segment, idx) => {
              if (segment.type === "text") {
                return (
                  <span key={idx} className="text-gray-900 dark:text-gray-100">
                    {segment.content}
                  </span>
                );
              }

              // Variable segment
              // Only treat as replaced when isReplaced is true (selected occurrence) and replacementValue exists
              if (segment.isReplaced && segment.replacementValue) {
                return (
                  <span
                    key={idx}
                    className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-emerald-900 dark:text-emerald-100 px-2 py-1 rounded font-semibold shadow-sm"
                    title={`${segment.varName} (occurrence ${segment.occurrenceIndex}) → ${segment.replacementValue}`}
                  >
                    {segment.replacementValue}
                  </span>
                );
              }

              // Unreplaced variable
              return (
                <span
                  key={idx}
                  className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 text-amber-900 dark:text-amber-100 px-2 py-1 rounded border border-amber-300 dark:border-amber-700"
                  title={`${segment.varName} (occurrence ${segment.occurrenceIndex}) - Not replaced or no value`}
                >
                  {segment.content}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 border border-emerald-300 dark:border-emerald-700"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Replaced Variables
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 border border-amber-300 dark:border-amber-700"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Unreplaced Variables
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-start">
        <button
          onClick={onSendToAI}
          disabled={isSending}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none text-sm"
        >
          {isSending ? (
            <>
              <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Sending...
            </>
          ) : (
            <>
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-9-2m9 2l9-2"
                />
              </svg>
              Send to AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}
