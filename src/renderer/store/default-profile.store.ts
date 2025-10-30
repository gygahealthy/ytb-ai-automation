import { create } from "zustand";

export interface DefaultProfileConfig {
  geminiProfileId: string | null;
  flowProfileId: string | null;
}

interface DefaultProfileState extends DefaultProfileConfig {
  setGeminiProfile: (profileId: string | null) => void;
  setFlowProfile: (profileId: string | null) => void;
  clearGeminiProfile: () => void;
  clearFlowProfile: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = "veo3-default-profiles";

export const useDefaultProfileStore = create<DefaultProfileState>((set) => ({
  geminiProfileId: null,
  flowProfileId: null,

  setGeminiProfile: (profileId) => {
    set({ geminiProfileId: profileId });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: profileId,
        flowProfileId: state.flowProfileId,
      })
    );
  },

  setFlowProfile: (profileId) => {
    set({ flowProfileId: profileId });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: state.geminiProfileId,
        flowProfileId: profileId,
      })
    );
  },

  clearGeminiProfile: () => {
    set({ geminiProfileId: null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: null,
        flowProfileId: state.flowProfileId,
      })
    );
  },

  clearFlowProfile: () => {
    set({ flowProfileId: null });
    const state = useDefaultProfileStore.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        geminiProfileId: state.geminiProfileId,
        flowProfileId: null,
      })
    );
  },

  clearAll: () => {
    set({ geminiProfileId: null, flowProfileId: null });
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
      flowProfileId: parsed.flowProfileId,
    });
  } catch (e) {
    console.error("Failed to parse saved default profiles", e);
  }
}
