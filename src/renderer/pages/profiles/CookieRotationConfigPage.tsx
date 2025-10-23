import { Zap, RotateCcw, Save, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import CookieRotationConfigList from "../../components/profiles/rotation/CookieRotationConfigList";
import type { CookieRotationConfig } from "../../components/common/sidebar/cookie-rotation/types";

interface ProfileWithCookieConfig {
  profileId: string;
  profileName?: string;
  cookies: Array<{
    cookieId: string;
    service: string;
    url: string;
    status: string;
    lastRotatedAt?: string;
    config: CookieRotationConfig;
  }>;
}

export default function CookieRotationConfigPage() {
  const [profiles, setProfiles] = useState<ProfileWithCookieConfig[]>([]);
  const [originalProfiles, setOriginalProfiles] = useState<ProfileWithCookieConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(profiles) !== JSON.stringify(originalProfiles);
  }, [profiles, originalProfiles]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.cookieRotation.getProfilesConfig();
      if (result.success && result.data) {
        setProfiles(result.data);
        setOriginalProfiles(JSON.parse(JSON.stringify(result.data)));
      } else {
        console.error("Failed to load profiles config:", result.error);
        setSaveMessage({ type: "error", text: `Failed to load profiles: ${result.error || "unknown error"}` });
      }
    } catch (error) {
      console.error("Failed to load profiles config:", error);
      setSaveMessage({ type: "error", text: `Error loading profiles: ${String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = async (cookieId: string, config: Partial<CookieRotationConfig>) => {
    // Update local state immediately for responsiveness
    setProfiles((prev) =>
      prev.map((profile) => ({
        ...profile,
        cookies: profile.cookies.map((cookie) =>
          cookie.cookieId === cookieId
            ? {
                ...cookie,
                config: {
                  ...cookie.config,
                  ...config,
                },
              }
            : cookie
        ),
      }))
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Collect all config changes
      const updates: Array<{ cookieId: string; config: Partial<CookieRotationConfig> }> = [];

      profiles.forEach((profile) => {
        profile.cookies.forEach((cookie) => {
          const original = originalProfiles
            .find((p) => p.profileId === profile.profileId)
            ?.cookies.find((c) => c.cookieId === cookie.cookieId);

          if (original && JSON.stringify(cookie.config) !== JSON.stringify(original.config)) {
            updates.push({
              cookieId: cookie.cookieId,
              config: cookie.config,
            });
          }
        });
      });

      // Save all changes
      for (const update of updates) {
        const result = await window.electronAPI.cookieRotation.updateCookieConfig(update.cookieId, update.config);
        if (!result.success) {
          throw new Error(`Failed to update config for cookie ${update.cookieId}: ${result.error}`);
        }
      }

      setSaveMessage({ type: "success", text: `Successfully saved ${updates.length} configuration(s)` });
      setOriginalProfiles(JSON.parse(JSON.stringify(profiles)));

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save configurations:", error);
      setSaveMessage({ type: "error", text: `Failed to save: ${String(error)}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChanges = () => {
    setProfiles(JSON.parse(JSON.stringify(originalProfiles)));
    setSaveMessage(null);
  };

  const handleResetToDefaults = () => {
    // Reset all cookies to default config
    const defaultConfig = {
      launchWorkerOnStartup: false,
      enabledRotationMethods: ["refreshCreds", "rotateCookie"] as ("refreshCreds" | "rotateCookie" | "headless")[],
      rotationMethodOrder: ["refreshCreds", "rotateCookie", "headless"] as ("refreshCreds" | "rotateCookie" | "headless")[],
      rotationIntervalMinutes: 30,
    };

    setProfiles((prev) =>
      prev.map((profile) => ({
        ...profile,
        cookies: profile.cookies.map((cookie) => ({
          ...cookie,
          config: {
            ...cookie.config,
            ...defaultConfig,
          },
        })),
      }))
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 lg:p-8 flex flex-col animate-fadeIn overflow-hidden">
      {/* Header with Action Buttons */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cookie Rotation Configuration</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure per-cookie rotation settings and strategies</p>
            </div>
          </div>

          {/* Action Buttons Group - Top Right */}
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            {hasChanges && (
              <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Unsaved changes
              </div>
            )}

            {/* Reset Defaults Button */}
            <button
              onClick={handleResetToDefaults}
              title="Reset all cookies to default configuration"
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 hover:scale-105 transform"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Clear Changes Button */}
            <button
              onClick={handleClearChanges}
              disabled={!hasChanges}
              title="Discard unsaved changes"
              className={`p-2 rounded-lg transition-colors duration-200 transform hover:scale-105 ${
                hasChanges
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  : "bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
              title={!hasChanges ? "No changes to save" : "Save all configurations"}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${
                hasChanges && !isSaving
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {saveMessage && (
          <div
            className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
              saveMessage.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${saveMessage.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Profile/Cookie Configuration List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2">
        <CookieRotationConfigList profiles={profiles} onUpdateConfig={handleUpdateConfig} />
      </div>
    </div>
  );
}
