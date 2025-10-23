import { Zap, RotateCcw, Save, X, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import CookieRotationConfigList from "./CookieRotationConfigList";
import { CookieAddModal } from "./CookieAddModal";
import type { CookieRotationConfig } from "../../common/sidebar/cookie-rotation/types";
import type { ApiResponse } from "@/shared/types";

type ElectronCookiesBridge = {
  extractAndCreateCookie: (profileId: string, service: string, url: string, headless: boolean) => Promise<ApiResponse<unknown>>;
};

type ElectronAPIWithCookies = Window["electronAPI"] & {
  cookies?: ElectronCookiesBridge;
};

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
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [selectedProfileForCookie, setSelectedProfileForCookie] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

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

  const handleAddCookie = (profileId: string) => {
    setSelectedProfileForCookie(profileId);
    setShowCookieModal(true);
  };

  const handleCookieModalClose = () => {
    setShowCookieModal(false);
    setSelectedProfileForCookie(null);
  };

  const handleCookieModalSuccess = async () => {
    handleCookieModalClose();
    // Reload profiles to reflect the new cookie
    await loadProfiles();
  };

  const handleForceHeadlessRefresh = async (profileId: string, cookieId: string) => {
    try {
      const profile = profiles.find((p) => p.profileId === profileId);
      const cookie = profile?.cookies.find((c) => c.cookieId === cookieId);
      if (!cookie) return;

      const electronCookies = (window.electronAPI as ElectronAPIWithCookies).cookies;
      const result = await electronCookies?.extractAndCreateCookie(profileId, cookie.service, cookie.url, true); // headless = true
      if (!result?.success) {
        setSaveMessage({
          type: "error",
          text: `Failed to refresh: ${result?.error || "unknown error"}`,
        });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "success", text: "Headless refresh started" });
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: `Error: ${String(error)}`,
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleForceVisibleRefresh = async (profileId: string, cookieId: string) => {
    try {
      const profile = profiles.find((p) => p.profileId === profileId);
      const cookie = profile?.cookies.find((c) => c.cookieId === cookieId);
      if (!cookie) return;

      const electronCookies = (window.electronAPI as ElectronAPIWithCookies).cookies;
      const result = await electronCookies?.extractAndCreateCookie(profileId, cookie.service, cookie.url, false); // headless = false
      if (!result?.success) {
        setSaveMessage({
          type: "error",
          text: `Failed to refresh: ${result?.error || "unknown error"}`,
        });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "success", text: "Visible refresh started" });
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: `Error: ${String(error)}`,
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleStartWorker = async (profileId: string, cookieId: string) => {
    try {
      const result = await window.electronAPI.cookieRotation.startWorker(profileId, cookieId);
      if (!result?.success) {
        setSaveMessage({
          type: "error",
          text: `Failed to start worker: ${result?.error || "unknown error"}`,
        });
      } else {
        setSaveMessage({ type: "success", text: "Worker started" });
      }
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: `Error: ${String(error)}`,
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleStopWorker = async (profileId: string, cookieId: string) => {
    try {
      const result = await window.electronAPI.cookieRotation.stopWorker(profileId, cookieId);
      if (!result?.success) {
        setSaveMessage({
          type: "error",
          text: `Failed to stop worker: ${result?.error || "unknown error"}`,
        });
      } else {
        setSaveMessage({ type: "success", text: "Worker stopped" });
      }
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: `Error: ${String(error)}`,
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
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
      <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-700 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cookie Rotation</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure per-cookie rotation settings and strategies
              </p>
            </div>
          </div>
        </div>

        {/* Status Message - Inline in header */}
        {saveMessage && (
          <div className="px-6 lg:px-8 pb-4">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                saveMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}
            >
              {saveMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Search and View Options */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search profiles..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Expand/Collapse All */}
            <button
              onClick={() => setAllExpanded(!allExpanded)}
              title={allExpanded ? "Collapse all" : "Expand all"}
              className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              {allExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
            </button>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Unsaved</span>
              </div>
            )}

            {/* Reset Defaults Button */}
            <button
              onClick={handleResetToDefaults}
              title="Reset all cookies to default configuration"
              className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Clear Changes Button */}
            <button
              onClick={handleClearChanges}
              disabled={!hasChanges}
              title="Discard unsaved changes"
              className={`p-2.5 rounded-lg transition-colors ${
                hasChanges
                  ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
              title={!hasChanges ? "No changes to save" : "Save all configurations"}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                hasChanges && !isSaving
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8">
        <CookieRotationConfigList
          profiles={profiles}
          onUpdateConfig={handleUpdateConfig}
          onAddCookie={handleAddCookie}
          onForceHeadlessRefresh={handleForceHeadlessRefresh}
          onForceVisibleRefresh={handleForceVisibleRefresh}
          onStartWorker={handleStartWorker}
          onStopWorker={handleStopWorker}
          allExpanded={allExpanded}
        />
      </div>

      {/* Cookie Edit Modal */}
      <CookieAddModal
        isOpen={showCookieModal}
        profileId={selectedProfileForCookie}
        mode="extract"
        onClose={handleCookieModalClose}
        onSuccess={handleCookieModalSuccess}
      />
    </div>
  );
}
