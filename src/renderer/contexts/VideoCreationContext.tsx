import React, { createContext, useContext, useState, ReactNode } from "react";
import { VideoStyle } from "../components/video-creation/script-creation/ScriptStyleSelector";
import { VisualStyle } from "../components/video-creation/script-creation/VisualStyleSelector";
import { VideoPrompt } from "../components/video-creation/script-creation/VideoPromptGenerator";

export type ViewMode = "step-by-step" | "simple";

interface VideoCreationState {
  // User inputs
  topic: string;
  selectedTopic: string | null; // ✅ Store the actual selected topic text
  selectedTopicId: string | null;
  videoStyle: VideoStyle;
  visualStyle: VisualStyle;
  editedScript: string;
  videoPrompts: VideoPrompt[];
  scriptLengthPreset: string;
  customWordCount: number;

  // UI state
  currentStep: 1 | 2 | 3;
  viewMode: ViewMode;
  isGenerating: boolean;

  // Actions
  setTopic: (topic: string) => void;
  setSelectedTopic: (topic: string | null) => void;
  setSelectedTopicId: (id: string | null) => void;
  setVideoStyle: (style: VideoStyle) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setEditedScript: (script: string) => void;
  setVideoPrompts: (prompts: VideoPrompt[]) => void;
  setScriptLengthPreset: (preset: string) => void;
  setCustomWordCount: (count: number) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsGenerating: (isGenerating: boolean) => void;

  // Utility
  resetState: () => void;
}

const VideoCreationContext = createContext<VideoCreationState | undefined>(
  undefined
);

const initialState = {
  topic: "",
  selectedTopic: null as string | null,
  selectedTopicId: null as string | null,
  videoStyle: "explainer" as VideoStyle,
  visualStyle: "2d-cartoon" as VisualStyle,
  editedScript: "",
  videoPrompts: [] as VideoPrompt[],
  scriptLengthPreset: "medium",
  customWordCount: 140,
  currentStep: 1 as 1 | 2 | 3,
  viewMode: "step-by-step" as ViewMode,
  isGenerating: false,
};

export const VideoCreationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [topic, setTopic] = useState(initialState.topic);
  const [selectedTopic, setSelectedTopic] = useState(
    initialState.selectedTopic
  );
  const [selectedTopicId, setSelectedTopicId] = useState(
    initialState.selectedTopicId
  );
  const [videoStyle, setVideoStyle] = useState(initialState.videoStyle);
  const [visualStyle, setVisualStyle] = useState(initialState.visualStyle);
  const [editedScript, setEditedScript] = useState(initialState.editedScript);
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>(
    initialState.videoPrompts
  );
  const [scriptLengthPreset, setScriptLengthPreset] = useState(
    initialState.scriptLengthPreset
  );
  const [customWordCount, setCustomWordCount] = useState(
    initialState.customWordCount
  );
  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [viewMode, setViewMode] = useState(initialState.viewMode);
  const [isGenerating, setIsGenerating] = useState(initialState.isGenerating);

  const resetState = () => {
    setTopic(initialState.topic);
    setSelectedTopic(initialState.selectedTopic);
    setSelectedTopicId(initialState.selectedTopicId);
    setVideoStyle(initialState.videoStyle);
    setVisualStyle(initialState.visualStyle);
    setEditedScript(initialState.editedScript);
    setVideoPrompts(initialState.videoPrompts);
    setScriptLengthPreset(initialState.scriptLengthPreset);
    setCustomWordCount(initialState.customWordCount);
    setCurrentStep(initialState.currentStep);
    setViewMode(initialState.viewMode);
    setIsGenerating(initialState.isGenerating);
  };

  const value: VideoCreationState = {
    topic,
    selectedTopic,
    selectedTopicId,
    videoStyle,
    visualStyle,
    editedScript,
    videoPrompts,
    scriptLengthPreset,
    customWordCount,
    currentStep,
    viewMode,
    isGenerating,
    setTopic,
    setSelectedTopic,
    setSelectedTopicId,
    setVideoStyle,
    setVisualStyle,
    setEditedScript,
    setVideoPrompts,
    setScriptLengthPreset,
    setCustomWordCount,
    setCurrentStep,
    setViewMode,
    setIsGenerating,
    resetState,
  };

  return (
    <VideoCreationContext.Provider value={value}>
      {children}
    </VideoCreationContext.Provider>
  );
};

export const useVideoCreation = () => {
  const context = useContext(VideoCreationContext);
  if (context === undefined) {
    throw new Error(
      "useVideoCreation must be used within a VideoCreationProvider"
    );
  }
  return context;
};
