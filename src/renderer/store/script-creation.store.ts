import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VideoStyle } from "../components/video-creation/script-creation/ScriptStyleSelector";
import { VisualStyle } from "../components/video-creation/script-creation/VisualStyleSelector";
import { VideoPrompt } from "../components/video-creation/script-creation/VideoPromptGenerator";

export type ViewMode = "step-by-step" | "simple";

interface ScriptCreationState {
  // User inputs
  topic: string;
  selectedTopic: string | null;
  selectedTopicId: string | null;
  topicSuggestions: string[];
  numberOfTopics: number;
  videoStyle: VideoStyle;
  visualStyle: VisualStyle;
  editedScript: string;
  videoPrompts: VideoPrompt[];
  scriptLengthPreset: string;
  customWordCount: number;

  // UI state (not persisted)
  currentStep: 1 | 2 | 3;
  viewMode: ViewMode;
  isGenerating: boolean;
  isGeneratingTopics: boolean;

  // Actions
  setTopic: (topic: string) => void;
  setSelectedTopic: (topic: string | null) => void;
  setSelectedTopicId: (id: string | null) => void;
  setTopicSuggestions: (suggestions: string[]) => void;
  addTopicSuggestion: (suggestion: string) => void;
  clearTopicSuggestions: () => void;
  setNumberOfTopics: (count: number) => void;
  setVideoStyle: (style: VideoStyle) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setEditedScript: (script: string) => void;
  setVideoPrompts: (prompts: VideoPrompt[]) => void;
  addVideoPrompt: (prompt: VideoPrompt) => void;
  updateVideoPrompt: (index: number, prompt: VideoPrompt) => void;
  removeVideoPrompt: (index: number) => void;
  setScriptLengthPreset: (preset: string) => void;
  setCustomWordCount: (count: number) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsGeneratingTopics: (isGenerating: boolean) => void;

  // Utility
  resetAll: () => void;
  resetTopicState: () => void;
  resetScriptState: () => void;
  resetPromptsState: () => void;
}

const initialState = {
  topic: "",
  selectedTopic: null as string | null,
  selectedTopicId: null as string | null,
  topicSuggestions: [] as string[],
  numberOfTopics: 8,
  videoStyle: "explainer" as VideoStyle,
  visualStyle: "2d-cartoon" as VisualStyle,
  editedScript: "",
  videoPrompts: [] as VideoPrompt[],
  scriptLengthPreset: "medium",
  customWordCount: 140,
  currentStep: 1 as 1 | 2 | 3,
  viewMode: "step-by-step" as ViewMode,
  isGenerating: false,
  isGeneratingTopics: false,
};

export const useScriptCreationStore = create<ScriptCreationState>()(
  persist(
    (set) => ({
      ...initialState,

      // Actions
      setTopic: (topic) => set({ topic }),
      setSelectedTopic: (selectedTopic) => set({ selectedTopic }),
      setSelectedTopicId: (selectedTopicId) => set({ selectedTopicId }),
      setTopicSuggestions: (topicSuggestions) => set({ topicSuggestions }),
      addTopicSuggestion: (suggestion) => set((state) => ({ topicSuggestions: [...state.topicSuggestions, suggestion] })),
      clearTopicSuggestions: () => set({ topicSuggestions: [] }),
      setNumberOfTopics: (numberOfTopics) => set({ numberOfTopics }),
      setVideoStyle: (videoStyle) => set({ videoStyle }),
      setVisualStyle: (visualStyle) => set({ visualStyle }),
      setEditedScript: (editedScript) => set({ editedScript }),
      setVideoPrompts: (videoPrompts) => set({ videoPrompts }),
      addVideoPrompt: (prompt) => set((state) => ({ videoPrompts: [...state.videoPrompts, prompt] })),
      updateVideoPrompt: (index, prompt) =>
        set((state) => ({
          videoPrompts: state.videoPrompts.map((p, i) => (i === index ? prompt : p)),
        })),
      removeVideoPrompt: (index) =>
        set((state) => ({
          videoPrompts: state.videoPrompts.filter((_, i) => i !== index),
        })),
      setScriptLengthPreset: (scriptLengthPreset) => set({ scriptLengthPreset }),
      setCustomWordCount: (customWordCount) => set({ customWordCount }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setViewMode: (viewMode) => set({ viewMode }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsGeneratingTopics: (isGeneratingTopics) => set({ isGeneratingTopics }),

      // Utility functions
      resetAll: () => set(initialState),
      resetTopicState: () =>
        set({
          topic: initialState.topic,
          selectedTopic: initialState.selectedTopic,
          selectedTopicId: initialState.selectedTopicId,
          topicSuggestions: initialState.topicSuggestions,
        }),
      resetScriptState: () =>
        set({
          editedScript: initialState.editedScript,
          videoStyle: initialState.videoStyle,
          visualStyle: initialState.visualStyle,
          scriptLengthPreset: initialState.scriptLengthPreset,
          customWordCount: initialState.customWordCount,
        }),
      resetPromptsState: () => set({ videoPrompts: initialState.videoPrompts }),
    }),
    {
      name: "veo3-script-creation",
      // Only persist user data, not transient UI state
      partialize: (state) => ({
        topic: state.topic,
        selectedTopic: state.selectedTopic,
        selectedTopicId: state.selectedTopicId,
        topicSuggestions: state.topicSuggestions,
        numberOfTopics: state.numberOfTopics,
        videoStyle: state.videoStyle,
        visualStyle: state.visualStyle,
        editedScript: state.editedScript,
        videoPrompts: state.videoPrompts,
        scriptLengthPreset: state.scriptLengthPreset,
        customWordCount: state.customWordCount,
        // Don't persist UI state like currentStep, viewMode, isGenerating, etc.
      }),
    }
  )
);
