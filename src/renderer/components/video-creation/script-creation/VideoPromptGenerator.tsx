import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronsLeftRightIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VideoStyle } from "./ScriptStyleSelector";
import { VisualStyle } from "./VisualStyleSelector";
import { VideoConfigurationColumn } from "./step-video-prompt/VideoConfigurationColumn";
import { PromptsOutputColumn } from "./step-video-prompt/PromptsOutputColumn";
import { useAlert } from "../../../hooks/useAlert";
import { useScriptCreationStore } from "../../../store/script-creation.store";
import { useVideoCreationStore } from "../../../store/video-creation.store";
import { parseAIResponseJSON } from "@/shared/utils/ai-response.util";

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
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<VideoPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get Zustand store actions
  const { videoPrompts, setVideoPrompts } = useScriptCreationStore();
  const { loadFromJson } = useVideoCreationStore();

  // Initialize local state from store if available
  useEffect(() => {
    if (videoPrompts.length > 0 && prompts.length === 0) {
      setPrompts(videoPrompts);
    }
  }, [videoPrompts]);

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

  // Helper to clean prompt text (remove markdown code fences)
  const cleanPromptText = (promptText: string): string => {
    let cleaned = promptText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    return cleaned.trim();
  };

  // Navigate to SingleVideoCreationPage with prompts
  const handleMakeVideos = () => {
    if (prompts.length === 0) {
      showAlert({
        message: "Please generate prompts first",
        severity: "warning",
      });
      return;
    }

    // Parse each prompt's JSON and extract all scene items as separate prompts
    // This matches AddJsonModal's behavior of creating an array of strings
    const allScenePrompts: string[] = [];

    for (const prompt of prompts) {
      const cleanedText = cleanPromptText(prompt.prompt);

      try {
        const parsed = JSON.parse(cleanedText);

        // If it's an array of scenes, add each scene's text as a separate prompt
        if (Array.isArray(parsed)) {
          for (const scene of parsed) {
            if (typeof scene === "string") {
              allScenePrompts.push(scene);
            } else if (typeof scene === "object" && scene !== null) {
              // If it's an object, stringify it and add as a prompt
              allScenePrompts.push(JSON.stringify(scene, null, 2));
            }
          }
        } else if (typeof parsed === "string") {
          allScenePrompts.push(parsed);
        } else if (typeof parsed === "object") {
          allScenePrompts.push(JSON.stringify(parsed, null, 2));
        }
      } catch {
        // If not valid JSON, just add the cleaned text as-is
        allScenePrompts.push(cleanedText);
      }
    }

    // Convert to JSON string matching AddJsonModal's array format
    const jsonString = JSON.stringify(allScenePrompts, null, 2);

    // Load into video creation store
    const success = loadFromJson(jsonString, "replace");

    if (success) {
      showAlert({
        title: "Success",
        message: `${allScenePrompts.length} scene prompts imported to video creation page`,
        severity: "success",
      });
      // Navigate to single video creation page
      navigate("/video-creation/single");
    } else {
      showAlert({
        title: "Error",
        message: "Failed to import prompts",
        severity: "error",
      });
    }
  };

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
      // Call AI service using the new array-based pattern
      // The service will fetch the config internally using componentName
      const response = await electronApi.aiPromptConf.callAI({
        componentName: "ScriptCreatePage",
        dataArray: [script, visualStyle],
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
          // Try to parse the string as JSON first
          const parsedJSON = parseAIResponseJSON(response.data);
          if (parsedJSON && Array.isArray(parsedJSON)) {
            // Successfully parsed JSON array - create a SEPARATE prompt card for EACH scene
            promptsData = parsedJSON.map((sceneItem: any, index: number) => ({
              id: String(index + 1),
              sceneNumber: index + 1,
              text: `Scene ${index + 1}`,
              prompt: typeof sceneItem === "string" ? sceneItem : JSON.stringify(sceneItem), // Store individual scene as its own prompt
              duration: 8,
            }));
          } else {
            // Fallback: split by scenes
            const scenes = response.data.split(/\n\n(?=Scene|\d+\.)/);
            promptsData = scenes.map((scene: string, index: number) => ({
              id: String(index + 1),
              sceneNumber: index + 1,
              text: `Scene ${index + 1}`,
              prompt: scene.trim(),
              duration: 8,
            }));
          }
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
          // Last resort: try to parse the entire response as JSON
          const lastAttempt = parseAIResponseJSON(JSON.stringify(response.data));
          if (lastAttempt && Array.isArray(lastAttempt)) {
            promptsData = lastAttempt.map((item: any, index: number) => ({
              id: String(index + 1),
              sceneNumber: index + 1,
              text: item.text || item.title || `Scene ${index + 1}`,
              prompt: JSON.stringify(item),
              duration: item.duration || 8,
            }));
          } else {
            // Absolute fallback
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
        }

        setPrompts(promptsData);
        setVideoPrompts(promptsData); // ✅ Save to Zustand store for persistence
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
      {/* Header Section */}
      <div className="pb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generate Visual Prompts</h3>
        </div>
      </div>

      {/* Two Column Layout - Configuration (Left) | Output (Right) with Resizable Divider */}
      <div
        id="two-column-container"
        className="relative flex gap-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-1 w-full"
      >
        {/* LEFT COLUMN - Video Configuration Form */}
        <div className="h-full overflow-hidden flex flex-col" style={{ width: `${leftColumnWidth}%` }}>
          <div className="p-6 h-full overflow-auto">
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
        <div className="h-full overflow-hidden flex flex-col" style={{ width: `${100 - leftColumnWidth}%` }}>
          <div className="p-6 h-full overflow-hidden flex flex-col">
            <PromptsOutputColumn
              prompts={prompts}
              isGenerating={isGenerating}
              simpleMode={simpleMode}
              topic={topic}
              script={script}
              onGenerate={handleGeneratePrompts}
              onRegeneratePrompt={handleRegeneratePrompt}
              onCopyPrompt={handleCopyPrompt}
              onMakeVideos={handleMakeVideos}
            />
          </div>
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
