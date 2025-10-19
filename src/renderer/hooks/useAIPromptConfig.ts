import { useState, useCallback } from "react";
import type {
  ComponentPromptConfig,
  SaveConfigRequest,
} from "../../shared/types";

interface MasterPrompt {
  id: number;
  provider: string;
  promptTemplate: string;
  description?: string;
  isActive?: boolean;
}

interface Profile {
  id: string;
  name: string;
}

export interface ConfigFormState {
  selectedComponent: string;
  selectedProfileId: string;
  selectedPromptId: number | "";
  selectedModel: string;
  enabled: boolean;
  useTempChat: boolean;
  keepContext: boolean;
}

const INITIAL_STATE: ConfigFormState = {
  selectedComponent: "",
  selectedProfileId: "",
  selectedPromptId: "",
  selectedModel: "GEMINI_2_5_PRO",
  enabled: true,
  useTempChat: false,
  keepContext: false,
};

export const useAIPromptConfig = () => {
  const [configs, setConfigs] = useState<ComponentPromptConfig[]>([]);
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<ConfigFormState>(INITIAL_STATE);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [profilesResult, configsResult, promptsResult] = await Promise.all([
        window.electronAPI.profile.getAll(),
        window.electronAPI.aiPrompt.getAllConfigs(),
        window.electronAPI.masterPrompts.getAll(),
      ]);

      if (profilesResult.success) {
        setProfiles(profilesResult.data || []);
      }

      if (configsResult.success) {
        setConfigs(configsResult.data || []);
      }

      if (promptsResult.success) {
        setPrompts(promptsResult.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // For storage we will save only the component suffix (after the last '-' or '|')
  // Example: 'video-creation-AITopicSuggestions' -> 'AITopicSuggestions'
  const componentSuffix = (componentId: string) => {
    if (!componentId) return componentId;
    const idxDash = componentId.lastIndexOf("-");
    const idxPipe = componentId.lastIndexOf("|");
    const idx = Math.max(idxDash, idxPipe);
    return idx === -1 ? componentId : componentId.slice(idx + 1);
  };

  const updateFormState = useCallback((updates: Partial<ConfigFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormState = useCallback(() => {
    setFormState(INITIAL_STATE);
  }, []);

  const saveConfig = useCallback(async () => {
    if (
      !formState.selectedComponent ||
      !formState.selectedProfileId ||
      formState.selectedPromptId === ""
    ) {
      setError("Please select component, profile, and prompt");
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const request: SaveConfigRequest = {
        componentName: componentSuffix(formState.selectedComponent),
        profileId: formState.selectedProfileId,
        promptId: formState.selectedPromptId as number,
        aiModel: formState.selectedModel,
        enabled: formState.enabled,
        useTempChat: formState.useTempChat,
        keepContext: formState.keepContext,
      };

      const result = await window.electronAPI.aiPrompt.saveConfig(request);

      if (result.success) {
        const displayedName = componentSuffix(formState.selectedComponent);
        setSuccess(
          `Configuration saved for ${displayedName} (Profile: ${formState.selectedProfileId})`
        );
        await loadData();
        resetFormState();
        return true;
      } else {
        setError(result.error || "Failed to save configuration");
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }, [formState, loadData, resetFormState]);

  const deleteConfig = useCallback(
    async (componentName: string) => {
      if (!confirm(`Delete configuration for ${componentName}?`)) {
        return false;
      }

      try {
        setError(null);
        setSuccess(null);

        const suffix = componentSuffix(componentName);
        const result = await window.electronAPI.aiPrompt.deleteConfig(suffix);

        if (result.success) {
          setSuccess(`Configuration deleted for ${suffix}`);
          await loadData();
          return true;
        } else {
          setError(result.error || "Failed to delete configuration");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
        return false;
      }
    },
    [loadData]
  );

  const editConfig = useCallback((config: ComponentPromptConfig) => {
    setFormState({
      selectedComponent: config.componentName,
      selectedProfileId: config.profileId,
      selectedPromptId: config.promptId,
      selectedModel: config.aiModel || "GEMINI_2_5_PRO",
      enabled: config.enabled !== false,
      useTempChat: config.useTempChat === true,
      keepContext: config.keepContext === true,
    });
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    configs,
    prompts,
    profiles,
    loading,
    saving,
    error,
    success,
    formState,
    loadData,
    updateFormState,
    resetFormState,
    saveConfig,
    deleteConfig,
    editConfig,
    clearMessages,
  };
};
