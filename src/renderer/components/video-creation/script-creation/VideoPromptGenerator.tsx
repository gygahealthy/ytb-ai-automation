import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronsLeftRightIcon } from "lucide-react";
import { VideoStyle } from "./ScriptStyleSelector";
import { VisualStyle } from "./VisualStyleSelector";
import { VideoConfigurationColumn } from "./step-video-prompt/VideoConfigurationColumn";
import { PromptsOutputColumn } from "./step-video-prompt/PromptsOutputColumn";
import { useAlert } from "../../../hooks/useAlert";

const electronApi = (window as any).electronAPI;

export interface VideoPrompt {
  id: string;
  sceneNumber: number;
  text: string;
  prompt: string;
  duration: number; // in seconds
}

interface VideoPromptGeneratorProps {
  script: string;
  style: string;
  topic: string;
  selectedTopic: string | null; // ✅ Add selectedTopic prop
  videoStyle: string;
  visualStyle: string;
  scriptLengthPreset?: string;
  customWordCount?: number;
  onPromptsGenerated: (prompts: VideoPrompt[]) => void;
  onBackToEdit: () => void;

  // Simple mode props
  simpleMode?: boolean;
  onTopicChange?: (topic: string) => void;
  onVideoStyleChange?: (style: VideoStyle) => void;
  onVisualStyleChange?: (style: VisualStyle) => void;
  onScriptChange?: (script: string) => void;
  onScriptLengthChange?: (preset: string) => void;
  onCustomWordCountChange?: (count: number) => void;
}

export const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({
  script,
  topic,
  selectedTopic,
  videoStyle,
  visualStyle,
  scriptLengthPreset = "medium",
  customWordCount = 140,
  onPromptsGenerated,
  onBackToEdit,
  simpleMode = false,
  onTopicChange,
  onVideoStyleChange,
  onVisualStyleChange,
  onScriptChange,
  onScriptLengthChange,
  onCustomWordCountChange,
}) => {
  const { show: showAlert } = useAlert();
  const [prompts, setPrompts] = useState<VideoPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Resizable columns state - increased default widths
  const [leftColumnWidth, setLeftColumnWidth] = useState(45); // percentage
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse drag for resizing
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const container = document.getElementById("two-column-container");
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit width between 25% and 75%
    if (newWidth >= 25 && newWidth <= 75) {
      setLeftColumnWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // Generate video prompts from script
  const handleGeneratePrompts = async () => {
    if (!script.trim()) {
      showAlert({
        message: "Please generate or edit a script first",
        severity: "warning",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // First, get the config for VideoConfigurationColumn to retrieve the profile
      const configResponse = await electronApi.aiPromptConf.getConfig("VideoConfigurationColumn");
      if (!configResponse?.success || !configResponse.data) {
        throw new Error(configResponse?.error || "No configuration found for VideoConfigurationColumn component");
      }

      const componentConfig = configResponse.data;
      const profileId = componentConfig.profileId || "default";

      // Call AI service with real parameters using the profile from config
      const response = await electronApi.aiPromptConf.callAI({
        componentName: "VideoConfigurationColumn",
        profileId: profileId,
        data: {
          scene_script: script,
          visual_style: visualStyle,
        },
        stream: false,
      });

      if (response?.success) {
        // Parse the response to extract prompts
        // Expected: array of prompts or formatted text that can be parsed
        let promptsData: VideoPrompt[] = [];

        if (Array.isArray(response.data)) {
          // If response is already an array of prompts
          promptsData = response.data.map((item: any, index: number) => ({
            id: String(index + 1),
            sceneNumber: index + 1,
            text: item.text || `Scene ${index + 1}`,
            prompt: item.prompt || item.description || "",
            duration: item.duration || 8,
          }));
        } else if (typeof response.data === "string") {
          // If response is text, parse it into prompts (split by scenes)
          const scenes = response.data.split(/\n\n(?=Scene|\d+\.)/);
          promptsData = scenes.map((scene: string, index: number) => ({
            id: String(index + 1),
            sceneNumber: index + 1,
            text: `Scene ${index + 1}`,
            prompt: scene.trim(),
            duration: 8,
          }));
        } else if (response.data?.prompts) {
          promptsData = response.data.prompts.map((item: any, index: number) => ({
            id: String(index + 1),
            sceneNumber: index + 1,
            text: item.text || `Scene ${index + 1}`,
            prompt: item.prompt || item.description || "",
            duration: item.duration || 8,
          }));
        }

        if (promptsData.length === 0) {
          promptsData = [
            {
              id: "1",
              sceneNumber: 1,
              text: "Generated Prompt",
              prompt: typeof response.data === "string" ? response.data : JSON.stringify(response.data),
              duration: 8,
            },
          ];
        }

        setPrompts(promptsData);
        onPromptsGenerated(promptsData);
        showAlert({
          title: "Success",
          message: `Generated ${promptsData.length} video prompts!`,
          severity: "success",
        });
      } else {
        const errorMessage = response?.error || "Failed to generate prompts";
        showAlert({
          title: "Prompt Generation Failed",
          message: errorMessage,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error generating prompts:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      showAlert({
        title: "Error",
        message: `Failed to generate prompts: ${errorMsg}`,
        severity: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePrompt = (promptId: string) => {
    // TODO: Implement regeneration for specific prompt via IPC
    showAlert({
      message: `Regenerating prompt ${promptId}...`,
      severity: "info",
    });
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showAlert({
      message: "Prompt copied to clipboard!",
      severity: "success",
    });
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* Two Column Layout - Configuration (Left) | Output (Right) with Resizable Divider */}
      <div
        id="two-column-container"
        className="relative flex gap-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-1 w-full"
      >
        {/* LEFT COLUMN - Video Configuration Form */}
        <div className="overflow-y-auto p-6 h-full" style={{ width: `${leftColumnWidth}%` }}>
          <VideoConfigurationColumn
            topic={topic}
            selectedTopic={selectedTopic} // ✅ Pass selectedTopic prop
            videoStyle={videoStyle}
            visualStyle={visualStyle}
            scriptLengthPreset={scriptLengthPreset}
            customWordCount={customWordCount}
            script={script}
            prompts={prompts}
            simpleMode={true}
            onTopicChange={onTopicChange}
            onVideoStyleChange={onVideoStyleChange}
            onVisualStyleChange={onVisualStyleChange}
            onScriptLengthChange={onScriptLengthChange}
            onCustomWordCountChange={onCustomWordCountChange}
            onScriptChange={onScriptChange}
          />
        </div>

        {/* RESIZABLE DIVIDER */}
        <div
          className="relative w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 group h-full"
          onMouseDown={handleMouseDown}
        >
          {/* Vertical drag line */}
          <div className="absolute inset-0 w-full"></div>

          {/* Circular button with chevron icon in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500 group-hover:border-blue-500 dark:group-hover:border-blue-400 shadow-md flex items-center justify-center transition-all group-hover:scale-110">
              <ChevronsLeftRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - AI Generated Prompts Output */}
        <div className="p-6 h-full" style={{ width: `${100 - leftColumnWidth}%` }}>
          <PromptsOutputColumn
            prompts={prompts}
            isGenerating={isGenerating}
            simpleMode={simpleMode}
            topic={topic}
            script={script}
            onGenerate={handleGeneratePrompts}
            onRegeneratePrompt={handleRegeneratePrompt}
            onCopyPrompt={handleCopyPrompt}
          />
        </div>
      </div>

      {/* Floating circular back button - visible when not in simpleMode */}
      {!simpleMode && (
        <button
          onClick={onBackToEdit}
          title="Back to Edit"
          className="fixed top-20 right-24 z-20 w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
