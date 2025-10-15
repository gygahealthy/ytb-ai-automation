import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronsLeftRightIcon } from "lucide-react";
import { VideoStyle } from "./ScriptStyleSelector";
import { VisualStyle } from "./VisualStyleSelector";
import { VideoConfigurationColumn } from "./VideoConfigurationColumn";
import { PromptsOutputColumn } from "./PromptsOutputColumn";

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
  style,
  topic,
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
    const newWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

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
    setIsGenerating(true);

    // TODO: Replace with actual IPC call to backend AI service
    setTimeout(() => {
      // Mock generation - split script into 8-second video prompts
      const mockPrompts: VideoPrompt[] = [
        {
          id: "1",
          sceneNumber: 1,
          text: "Introduction and hook",
          prompt: `A ${style} style opening scene with dynamic text overlay. Bright, engaging visuals that grab attention immediately. Professional cinematography with smooth camera movements.`,
          duration: 8,
        },
        {
          id: "2",
          sceneNumber: 2,
          text: "Main point explanation",
          prompt: `${style} style educational content with clear visual metaphors. Clean composition, good lighting, professional color grading. Visual elements that support the narrative.`,
          duration: 8,
        },
        {
          id: "3",
          sceneNumber: 3,
          text: "Supporting details",
          prompt: `${style} style b-roll footage showing relevant examples. High quality stock footage with natural lighting. Smooth transitions between clips.`,
          duration: 8,
        },
        {
          id: "4",
          sceneNumber: 4,
          text: "Key benefits",
          prompt: `${style} style product showcase or demonstration. Professional lighting, clean background. Focus on details and quality.`,
          duration: 8,
        },
        {
          id: "5",
          sceneNumber: 5,
          text: "Social proof",
          prompt: `${style} style testimonial or success story visuals. Authentic, relatable scenes. Warm color tones, emotional connection.`,
          duration: 8,
        },
        {
          id: "6",
          sceneNumber: 6,
          text: "Additional context",
          prompt: `${style} style supporting footage with informative overlays. Professional composition, balanced framing. Clear visual hierarchy.`,
          duration: 8,
        },
        {
          id: "7",
          sceneNumber: 7,
          text: "Call to action setup",
          prompt: `${style} style transition to conclusion. Building momentum, increasing energy. Dynamic camera movements, engaging visuals.`,
          duration: 8,
        },
        {
          id: "8",
          sceneNumber: 8,
          text: "Final call to action",
          prompt: `${style} style closing scene with strong call to action. Bold text, clear message. Professional end screen with branding elements.`,
          duration: 8,
        },
      ];

      setPrompts(mockPrompts);
      onPromptsGenerated(mockPrompts);
      setIsGenerating(false);
    }, 100);
  };

  const handleRegeneratePrompt = (promptId: string) => {
    // TODO: Implement regeneration for specific prompt via IPC
    alert(`Regenerating prompt ${promptId}...`);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // TODO: replace with real toast
    alert("Prompt copied to clipboard!");
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* Two Column Layout - Configuration (Left) | Output (Right) with Resizable Divider */}
      <div
        id="two-column-container"
        className="relative flex gap-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-1 w-full"
      >
        {/* LEFT COLUMN - Video Configuration Form */}
        <div
          className="overflow-y-auto p-6 h-full"
          style={{ width: `${leftColumnWidth}%` }}
        >
          <VideoConfigurationColumn
            topic={topic}
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
        <div
          className="p-6 h-full"
          style={{ width: `${100 - leftColumnWidth}%` }}
        >
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
