import { create } from "zustand";
import { VEO3Model, VEO3ModelWithSettings, PaygateTier } from "@/shared/types/veo3-models";

interface VEO3ModelsState {
  models: VEO3ModelWithSettings[];
  lastSyncedAt: string | null;
  isSyncing: boolean;

  // Actions
  setModels: (models: VEO3Model[]) => void;
  updateModelSettings: (
    key: string,
    settings: Partial<Pick<VEO3ModelWithSettings, "isDefaultForRender" | "enabledForUsage">>
  ) => void;
  setDefaultForRender: (key: string) => void;
  toggleUsage: (key: string) => void;
  setSyncing: (syncing: boolean) => void;

  // Selectors
  getFilteredModels: (paygateTier?: PaygateTier, excludeDeprecated?: boolean) => VEO3ModelWithSettings[];
  getDefaultRenderModel: () => VEO3ModelWithSettings | undefined;
  getUsageModels: () => VEO3ModelWithSettings[];
}

const STORAGE_KEY = "veo3-models-config";

export const useVEO3ModelsStore = create<VEO3ModelsState>((set, get) => ({
  models: [],
  lastSyncedAt: null,
  isSyncing: false,

  setModels: (apiModels: VEO3Model[]) => {
    const existingSettings = get().models.reduce((acc, model) => {
      acc[model.key] = {
        isDefaultForRender: model.isDefaultForRender,
        enabledForUsage: model.enabledForUsage,
      };
      return acc;
    }, {} as Record<string, { isDefaultForRender: boolean; enabledForUsage: boolean }>);

    const modelsWithSettings: VEO3ModelWithSettings[] = apiModels.map((model) => ({
      ...model,
      isDefaultForRender: existingSettings[model.key]?.isDefaultForRender ?? false,
      enabledForUsage: existingSettings[model.key]?.enabledForUsage ?? true,
    }));

    set({
      models: modelsWithSettings,
      lastSyncedAt: new Date().toISOString(),
      isSyncing: false,
    });

    // Persist to localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        models: modelsWithSettings,
        lastSyncedAt: new Date().toISOString(),
      })
    );
  },

  updateModelSettings: (
    key: string,
    settings: Partial<Pick<VEO3ModelWithSettings, "isDefaultForRender" | "enabledForUsage">>
  ) => {
    const updated = get().models.map((model) => (model.key === key ? { ...model, ...settings } : model));
    set({ models: updated });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        models: updated,
        lastSyncedAt: get().lastSyncedAt,
      })
    );
  },

  setDefaultForRender: (key: string) => {
    const updated = get().models.map((model) => ({
      ...model,
      isDefaultForRender: model.key === key,
    }));
    set({ models: updated });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        models: updated,
        lastSyncedAt: get().lastSyncedAt,
      })
    );
  },

  toggleUsage: (key: string) => {
    const updated = get().models.map((model) =>
      model.key === key ? { ...model, enabledForUsage: !model.enabledForUsage } : model
    );
    set({ models: updated });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        models: updated,
        lastSyncedAt: get().lastSyncedAt,
      })
    );
  },

  setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),

  getFilteredModels: (paygateTier?: PaygateTier, excludeDeprecated = true) => {
    let filtered = get().models;

    if (paygateTier) {
      filtered = filtered.filter((model) => model.paygateTier === paygateTier);
    }

    if (excludeDeprecated) {
      filtered = filtered.filter((model) => model.modelStatus !== "MODEL_STATUS_DEPRECATED");
    }

    return filtered;
  },

  getDefaultRenderModel: () => {
    return get().models.find((model) => model.isDefaultForRender);
  },

  getUsageModels: () => {
    return get().models.filter((model) => model.enabledForUsage);
  },
}));

// Initialize from localStorage
const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData) {
  try {
    const parsed = JSON.parse(savedData);
    useVEO3ModelsStore.setState({
      models: parsed.models || [],
      lastSyncedAt: parsed.lastSyncedAt || null,
    });
  } catch (e) {
    console.error("Failed to parse saved VEO3 models config", e);
  }
}
