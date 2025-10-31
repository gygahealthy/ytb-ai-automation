import { create } from "zustand";

export interface DefaultProfileConfig {
  geminiProfileId: string | null;
  geminiProjectId: string | null;
  flowProfileId: string | null;
  flowProjectId: string | null;
}

interface DefaultProfileState extends DefaultProfileConfig {
  setGeminiProfile: (profileId: string | null, projectId?: string | null) => void;
  setFlowProfile: (profileId: string | null, projectId?: string | null) => void;
  clearGeminiProfile: () => void;
  clearFlowProfile: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = "veo3-default-profiles";

export const useDefaultProfileStore = create<DefaultProfileState>((set) => ({
  geminiProfileId: null,
  geminiProjectId: null,
  flowProfileId: null,
  flowProjectId: null,

  setGeminiProfile: (profileId, projectId) => {
    set({ geminiProfileId: profileId, geminiProjectId: projectId ?? null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: profileId,
        geminiProjectId: projectId ?? null,
        flowProfileId: state.flowProfileId,
        flowProjectId: state.flowProjectId,
      })
    );
  },

  setFlowProfile: (profileId, projectId) => {
    set({ flowProfileId: profileId, flowProjectId: projectId ?? null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: state.geminiProfileId,
        geminiProjectId: state.geminiProjectId,
        flowProfileId: profileId,
        flowProjectId: projectId ?? null,
      })
    );
  },

  clearGeminiProfile: () => {
    set({ geminiProfileId: null, geminiProjectId: null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: null,
        geminiProjectId: null,
        flowProfileId: state.flowProfileId,
        flowProjectId: state.flowProjectId,
      })
    );
  },

  clearFlowProfile: () => {
    set({ flowProfileId: null, flowProjectId: null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: state.geminiProfileId,
        geminiProjectId: state.geminiProjectId,
        flowProfileId: null,
        flowProjectId: null,
      })
    );
  },

  clearAll: () => {
    set({ geminiProfileId: null, geminiProjectId: null, flowProfileId: null, flowProjectId: null });
    localStorage.removeItem(STORAGE_KEY);
  },
}));

// Initialize from localStorage
const savedDefaults = localStorage.getItem(STORAGE_KEY);
if (savedDefaults) {
  try {
    const parsed = JSON.parse(savedDefaults) as DefaultProfileConfig;
    useDefaultProfileStore.setState({
      geminiProfileId: parsed.geminiProfileId,
      geminiProjectId: parsed.geminiProjectId || null,
      flowProfileId: parsed.flowProfileId,
      flowProjectId: parsed.flowProjectId || null,
    });
  } catch (e) {
    console.error("Failed to parse saved default profiles", e);
  }
}
