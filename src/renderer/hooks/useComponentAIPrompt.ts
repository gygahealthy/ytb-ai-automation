import { useCallback, useEffect } from "react";
import { useComponentAIPromptContext } from "../contexts/ComponentAIPromptContext";

// Consumer hook: pass componentName and get helper functions
export function useComponentAIPrompt(componentName: string) {
  const ctx = useComponentAIPromptContext();
  const { fetchConfig, getCachedConfig, sendPromptFor } = ctx;

  // ensure config on mount
  useEffect(() => {
    const cached = getCachedConfig(componentName);
    if (!cached || cached.config === undefined) {
      fetchConfig(componentName).catch(() => {});
    }
  }, [componentName, fetchConfig, getCachedConfig]);

  const cached = getCachedConfig(componentName);

  const sendPrompt = useCallback(
    async (
      data: Record<string, any>,
      options?: { stream?: boolean; requestId?: string; model?: string }
    ) => {
      return sendPromptFor(componentName, data, options);
    },
    [componentName, sendPromptFor]
  );

  return {
    loading: !!cached?.loading,
    error: cached?.error || null,
    config: cached?.config || null,
    refresh: () => fetchConfig(componentName),
    sendPrompt,
    ensure: () => fetchConfig(componentName),
  };
}

export default useComponentAIPrompt;
