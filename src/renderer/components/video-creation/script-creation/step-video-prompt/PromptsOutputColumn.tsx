import React from "react";
import { Wand2 } from "lucide-react";
import { VideoPrompt } from "../VideoPromptGenerator";
import { StepNavigationButtons } from "../StepNavigationButtons";
import { useModal } from "../../../../hooks/useModal";
import { parseAIResponseJSON } from "@/shared/utils/ai-response.util";
import { PromptContentContainer } from "./prompt-output";

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

  // Show full content in modal
  const showFullContent = (prompt: { id: string; text: string; prompt: string }) => {
    const parsePromptJSON = (promptText: string): any | null => parseAIResponseJSON(promptText);
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
        <div className="grid grid-cols-3 gap-4 w-full auto-rows-max">
          {data.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-3 w-full shadow-sm"
            >
              <div className="space-y-2">
                {typeof item === "object" && item !== null ? (
                  Object.entries(item).map(([key, value]) => (
                    <div key={key} className="w-full">
                      <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-gray-900 dark:text-white break-words">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-900 dark:text-white">{String(item)}</div>
                )}
              </div>
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
    <div className="flex flex-col h-full overflow-hidden">
      <StepNavigationButtons
        prompts={prompts}
        isGenerating={isGenerating}
        simpleMode={simpleMode}
        topic={topic}
        script={script}
        onGenerate={onGenerate}
      />

      {/* Content Area with Loading Overlay */}
      <div className="relative flex-1 overflow-hidden min-w-0">
        {/* Main Content */}
        <div className={`h-full w-full overflow-hidden ${isGenerating ? "opacity-50 pointer-events-none" : ""}`}>
          {prompts.length === 0 ? (
            <div className="text-center py-20">
              <Wand2 className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Generated prompts will appear here</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">Fill in the configuration and click "Generate"</p>
            </div>
          ) : (
            <PromptContentContainer
              prompts={prompts}
              onShowDetails={showCardContent}
              onCopyPrompt={(_, prompt) => onCopyPrompt(prompt)}
              onRegeneratePrompt={onRegeneratePrompt}
              onMakeVideos={onMakeVideos}
              onShowFullContent={showFullContent}
            />
          )}
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Generating Prompts...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait while we generate your video prompts</p>
              </div>
              <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
