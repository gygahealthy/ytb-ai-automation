import { create } from "zustand";
import { VEO3Model, VEO3ModelWithSettings, PaygateTier } from "@/shared/types/veo3-models";

interface VEO3ModelsState {
  models: VEO3ModelWithSettings[];
  lastSyncedAt: string | null;
  isSyncing: boolean;
  maxEnabledModels: number; // Max models that can be enabled for usage

  // Actions
  setModels: (models: VEO3Model[]) => void;
  updateModelSettings: (
    key: string,
    settings: Partial<Pick<VEO3ModelWithSettings, "isDefaultForRender" | "enabledForUsage">>
  ) => void;
  setDefaultForRender: (key: string) => void;
  toggleUsage: (key: string) => void;
  setSyncing: (syncing: boolean) => void;
  setMaxEnabledModels: (max: number) => void;

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
  maxEnabledModels: 3, // Max 3 models can be enabled for usage (FIFO)

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
    const models = get().models;
    const targetModel = models.find((m) => m.key === key);
    if (!targetModel) return;

    // If disabling, just toggle it
    if (targetModel.enabledForUsage) {
      const updated = models.map((model) => (model.key === key ? { ...model, enabledForUsage: false } : model));
      set({ models: updated });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          models: updated,
          lastSyncedAt: get().lastSyncedAt,
        })
      );
      return;
    }

    // If enabling, check if we've reached the max limit
    const enabledModels = models.filter((m) => m.enabledForUsage);

    if (enabledModels.length >= get().maxEnabledModels) {
      // FIFO: Disable the first enabled model
      const firstEnabled = enabledModels[0];
      const updated = models.map((model) => {
        if (model.key === firstEnabled.key) {
          return { ...model, enabledForUsage: false };
        }
        if (model.key === key) {
          return { ...model, enabledForUsage: true };
        }
        return model;
      });
      set({ models: updated });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          models: updated,
          lastSyncedAt: get().lastSyncedAt,
        })
      );
    } else {
      // Still under the limit, just enable it
      const updated = models.map((model) => (model.key === key ? { ...model, enabledForUsage: true } : model));
      set({ models: updated });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          models: updated,
          lastSyncedAt: get().lastSyncedAt,
        })
      );
    }
  },

  setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),

  setMaxEnabledModels: (max: number) => {
    const validMax = Math.max(1, Math.min(max, 10)); // Clamp between 1 and 10
    set({ maxEnabledModels: validMax });

    // If current enabled models exceed new max, disable the oldest ones
    const enabledModels = get().models.filter((m) => m.enabledForUsage);
    if (enabledModels.length > validMax) {
      const toDisable = enabledModels.slice(0, enabledModels.length - validMax);
      const updated = get().models.map((model) => {
        if (toDisable.some((m) => m.key === model.key)) {
          return { ...model, enabledForUsage: false };
        }
        return model;
      });
      set({ models: updated });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          models: updated,
          lastSyncedAt: get().lastSyncedAt,
        })
      );
    }

    // Persist the max value
    localStorage.setItem(`${STORAGE_KEY}-max`, validMax.toString());
  },

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
const savedMax = localStorage.getItem(`${STORAGE_KEY}-max`);

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

if (savedMax) {
  try {
    const maxValue = parseInt(savedMax, 10);
    if (!isNaN(maxValue) && maxValue >= 1 && maxValue <= 10) {
      useVEO3ModelsStore.setState({ maxEnabledModels: maxValue });
    }
  } catch (e) {
    console.error("Failed to parse saved max enabled models", e);
  }
}
