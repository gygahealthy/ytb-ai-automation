import { useEffect, useState } from "react";
import { ComponentAIPromptConfig } from "@/renderer/contexts/ComponentAIPromptContext";

const electronApi = (window as any).electronAPI;

interface ComponentPromptSelectorProps {
  onSelect: (config: ComponentAIPromptConfig | null) => void;
  selectedConfig: ComponentAIPromptConfig | null;
}

export function ComponentPromptSelector({ onSelect, selectedConfig }: ComponentPromptSelectorProps) {
  const [configs, setConfigs] = useState<ComponentAIPromptConfig[]>([]);
  const [promptNames, setPromptNames] = useState<Record<number, string>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await electronApi.aiPromptConf.getAllConfigs();
      if (res?.success && res.data) {
        setConfigs(res.data);

        // fetch prompt names and profile names for each config
        try {
          const names: Record<number, string> = {};
          const profiles: Record<string, string> = {};
          const profileIds = [...new Set(res.data.map((c: any) => c.profileId))];

          // Fetch all prompts in parallel
          await Promise.all(
            res.data.map(async (c: any) => {
              try {
                const p = await electronApi.masterPrompts.getById(c.promptId);
                if (p?.success && p.data) names[c.promptId] = p.data.name || p.data.title || `Prompt ${c.promptId}`;
              } catch (e) {
                // ignore
              }
            })
          );

          // Fetch all profiles in parallel
          await Promise.all(
            profileIds.map(async (profileId: unknown) => {
              if (!profileId) return;
              try {
                const p = await electronApi.profile.getById(profileId as string);
                if (p?.success && p.data) {
                  profiles[profileId as string] = p.data.name || (profileId as string);
                }
              } catch (e) {
                // ignore profile fetch errors
              }
            })
          );

          setPromptNames(names);
          setProfileNames(profiles);
        } catch (e) {
          // ignore fetch errors
        }
      } else {
        setError(res?.error || "Failed to load component configs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    // ensure the container can fill available height and allow its child with `overflow-y-auto` to scroll
    <div className="h-full min-h-0 flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Component Prompts</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Select a component to load its master prompt</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading configurations...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-sm font-medium text-red-800 dark:text-red-400">Error loading configs</div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</div>
          </div>
        )}

        {!loading && !error && configs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="text-sm text-gray-500 dark:text-gray-400">No component prompts configured yet</div>
          </div>
        )}

        {!loading && !error && configs.length > 0 && (
          <div className="space-y-2">
            {configs.map((config) => (
              <button
                key={config.id}
                onClick={() => onSelect(config)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
                  selectedConfig?.id === config.id
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600 shadow-md"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650 hover:shadow-sm"
                }`}
              >
                <div
                  className={`font-semibold text-sm ${
                    selectedConfig?.id === config.id ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {config.componentName}
                </div>
                <div className={`flex items-center justify-between mt-2`}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div className="inline-block text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {promptNames[config.promptId] || `Prompt ${config.promptId}`}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Model: {config.aiModel || "Default"}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Profile</div>
                    <div className="text-xs font-medium bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded mt-1">
                      {profileNames[config.profileId] || config.profileId || "default"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
