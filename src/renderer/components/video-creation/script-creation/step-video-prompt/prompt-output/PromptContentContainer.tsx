import React from "react";
import { SceneCard } from "./SceneCard";
import { PromptActionBar } from "./PromptActionBar";
import { parseAIResponseJSON } from "@/shared/utils/ai-response.util";

interface PromptItem {
  id: string;
  text: string;
  prompt: string;
}

interface ScenesGridProps {
  scenes: any[];
  onShowDetails: (data: any, index: number) => void;
}

const ScenesGrid: React.FC<ScenesGridProps> = ({ scenes, onShowDetails }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-4 w-full auto-rows-max">
        {scenes.map((scene, index) => (
          <SceneCard key={index} sceneData={scene} sceneIndex={index} onShowDetails={onShowDetails} />
        ))}
      </div>
    </div>
  );
};

interface PromptContentContainerProps {
  prompts: PromptItem[];
  onShowDetails: (data: any, index: number) => void;
  onCopyPrompt: (promptId: string, prompt: string) => void;
  onRegeneratePrompt: (promptId: string) => void;
  onMakeVideos: () => void;
  onShowFullContent: (prompt: PromptItem) => void;
}

export const PromptContentContainer: React.FC<PromptContentContainerProps> = ({
  prompts,
  onShowDetails,
  onCopyPrompt,
  onRegeneratePrompt,
  onMakeVideos,
  onShowFullContent,
}) => {
  const parsePromptJSON = (promptText: string): any | null => parseAIResponseJSON(promptText);

  const cleanPromptForCopy = (promptText: string): string => {
    let cleaned = promptText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    return cleaned.trim();
  };

  // Collect all scenes from all prompts into one array
  const allScenes: any[] = [];
  prompts.forEach((prompt) => {
    const parsedJSON = parsePromptJSON(prompt.prompt);
    if (parsedJSON) {
      if (Array.isArray(parsedJSON)) {
        allScenes.push(...parsedJSON);
      } else {
        allScenes.push(parsedJSON);
      }
    }
  });

  return (
    <div className="h-full max-h-[80vh] flex flex-col relative">
      {/* Scrollable Content Area */}
      <div className="px-4 pt-2 pb-20 overflow-y-auto flex-1 w-full">
        <div className="mb-3 w-full">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Scene Details ({allScenes.length} {allScenes.length === 1 ? "scene" : "scenes"})
          </div>
          <ScenesGrid scenes={allScenes} onShowDetails={onShowDetails} />
        </div>
      </div>

      {/* Fixed Action Bar at Bottom */}
      <PromptActionBar
        onCopyPrompt={() => {
          // Copy all prompts combined
          const combined = prompts.map((p) => cleanPromptForCopy(p.prompt)).join("\n\n");
          onCopyPrompt(prompts[0]?.id || "", combined);
        }}
        onRegeneratePrompt={() => {
          // Regenerate first prompt (or all?)
          if (prompts.length > 0) onRegeneratePrompt(prompts[0].id);
        }}
        onMakeVideos={onMakeVideos}
        onShowFullContent={() => {
          // Show first prompt full content (or create combined view?)
          if (prompts.length > 0) onShowFullContent(prompts[0]);
        }}
      />
    </div>
  );
};
