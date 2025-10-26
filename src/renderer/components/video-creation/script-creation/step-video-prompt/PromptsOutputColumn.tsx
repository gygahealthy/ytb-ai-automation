import React, { useState } from "react";
import { Play, Copy, RefreshCw, ChevronDown, ChevronUp, Wand2, Info } from "lucide-react";
import { VideoPrompt } from "../VideoPromptGenerator";
import { StepNavigationButtons } from "../StepNavigationButtons";
import { useModal } from "../../../../hooks/useModal";

interface PromptsOutputColumnProps {
  prompts: VideoPrompt[];
  isGenerating: boolean;
  simpleMode: boolean;
  topic: string;
  script: string;
  onGenerate: () => void;
  onRegeneratePrompt: (promptId: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onMakeVideos: () => void;
}

export const PromptsOutputColumn: React.FC<PromptsOutputColumnProps> = ({
  prompts,
  isGenerating,
  simpleMode,
  topic,
  script,
  onGenerate,
  onRegeneratePrompt,
  onCopyPrompt,
  onMakeVideos,
}) => {
  const { openModal } = useModal();

  // Track all expanded prompts using a Set
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(new Set());

  // Auto-expand all prompts when they are loaded
  React.useEffect(() => {
    if (prompts.length > 0) {
      setExpandedPromptIds(new Set(prompts.map((p) => p.id)));
    }
  }, [prompts.length]);

  const toggleExpanded = (promptId: string) => {
    setExpandedPromptIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  // Helper to parse JSON from prompt string
  const parsePromptJSON = (promptText: string): any | null => {
    try {
      // Remove markdown code fence markers if present
      let cleanText = promptText.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      // Try to parse the entire text as JSON
      const parsed = JSON.parse(cleanText);
      return parsed;
    } catch {
      // Try to extract JSON from text
      const jsonMatch = promptText.match(/\[\s*\{[\s\S]*\}\s*\]/m);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  // Helper to clean prompt for copying (remove markdown code fences)
  const cleanPromptForCopy = (promptText: string): string => {
    let cleaned = promptText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    return cleaned.trim();
  };

  // Show full content in modal
  const showFullContent = (prompt: VideoPrompt) => {
    const parsedJSON = parsePromptJSON(prompt.prompt);

    openModal({
      title: `${prompt.text} - Full Details`,
      size: "xl",
      content: (
        <div className="max-h-[70vh] overflow-y-auto">
          {parsedJSON ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">PROMPT DETAILS</div>
              {renderJSONContent(parsedJSON)}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">FULL PROMPT</div>
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{prompt.prompt}</pre>
            </div>
          )}
        </div>
      ),
    });
  };

  // Show single card content in modal
  const showCardContent = (cardData: any, cardIndex: number) => {
    openModal({
      title: `Scene ${cardIndex + 1} - Details`,
      size: "lg",
      content: (
        <div className="space-y-4">
          {typeof cardData === "object" && cardData !== null ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-4 space-y-3">
              {Object.entries(cardData).map(([key, value]) => (
                <div key={key} className="w-full">
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase mb-2">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white break-words bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-900 dark:text-white break-words bg-gray-50 dark:bg-gray-900 p-4 rounded">
              {String(cardData)}
            </div>
          )}
        </div>
      ),
    });
  };

  // Render JSON content as cards
  const renderJSONContent = (data: any): React.ReactNode => {
    if (Array.isArray(data)) {
      return (
        <div className="grid grid-cols-3 gap-3 w-full auto-rows-fr">
          {data.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-3 hover:border-purple-400 dark:hover:border-purple-500 transition-colors shadow-sm hover:shadow-md h-full flex flex-col max-h-[200px] relative"
            >
              {typeof item === "object" && item !== null ? (
                <div className="space-y-2 flex-1 overflow-hidden">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="w-full">
                      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1 truncate">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-gray-900 dark:text-white line-clamp-3">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-900 dark:text-white flex-1 line-clamp-6">{String(item)}</div>
              )}

              {/* Info icon for individual card */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showCardContent(item, index);
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
                title="View card details"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      );
    } else if (typeof data === "object" && data !== null) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-3 w-full shadow-sm">
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="w-full">
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-sm text-gray-900 dark:text-white break-words">
                  {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <StepNavigationButtons
        prompts={prompts}
        isGenerating={isGenerating}
        simpleMode={simpleMode}
        topic={topic}
        script={script}
        onGenerate={onGenerate}
      />

      {/* Content Area */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="text-center py-20">
            <Wand2 className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Generated prompts will appear here</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">Fill in the configuration and click "Generate"</p>
          </div>
        ) : (
          prompts.map((prompt) => {
            const isExpanded = expandedPromptIds.has(prompt.id);
            return (
              <div
                key={prompt.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                {/* Prompt Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleExpanded(prompt.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{prompt.text}</div>
                      {!isExpanded && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{prompt.prompt}</div>
                      )}
                    </div>
                    <button className="ml-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  // Make this container a fixed-height area (75vh) so we can
                  // pin the action buttons to the bottom while the inner content scrolls.
                  // Use flex-col so the inner scroll area can grow and scroll correctly.
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-full relative h-[75vh] flex flex-col">
                    <div className="px-4 pt-4 pb-24 overflow-y-auto flex-1">
                      {(() => {
                        const parsedJSON = parsePromptJSON(prompt.prompt);
                        if (parsedJSON) {
                          return (
                            <div className="mb-3 w-full">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                PROMPT DETAILS (Click Info for full view)
                              </div>
                              {renderJSONContent(parsedJSON)}
                            </div>
                          );
                        }
                        return (
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3 w-full max-h-[200px] overflow-hidden">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">FULL PROMPT</div>
                            <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap line-clamp-6">
                              {prompt.prompt}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Actions */}
                    {/* Action bar pinned to bottom of the 75vh card. Content will scroll under it. */}
                    <div className="absolute left-0 right-0 bottom-0 px-4 pb-4 pt-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-20 flex gap-2 items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyPrompt(cleanPromptForCopy(prompt.prompt));
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegeneratePrompt(prompt.id);
                        }}
                        className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regen
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMakeVideos();
                        }}
                        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-xs font-medium"
                      >
                        <Play className="w-3 h-3" />
                        Make Videos
                      </button>

                      {/* Info button at bottom right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showFullContent(prompt);
                        }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-30"
                        title="View full details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
