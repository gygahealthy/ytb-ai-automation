import { Zap, RotateCcw, Save, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import WorkerLaunchSettings from "../components/profiles/rotation/WorkerLaunchSettings";
import RotationMethods from "../components/profiles/rotation/RotationMethods";
import RotationMethodOrder from "../components/profiles/rotation/RotationMethodOrder";
import RotationInterval from "../components/profiles/rotation/RotationInterval";

interface CookieRotationConfig {
  launchWorkerOnAppStart: boolean;
  rotateViaHeadless: boolean;
  rotateViaRefreshCreds: boolean;
  rotationMethodOrder: ("refreshCreds" | "rotateCookie" | "headless")[];
  rotationIntervalMinutes: number;
}

const DEFAULT_CONFIG: CookieRotationConfig = {
  launchWorkerOnAppStart: false,
  rotateViaHeadless: false,
  rotateViaRefreshCreds: false,
  rotationMethodOrder: ["refreshCreds", "rotateCookie", "headless"],
  rotationIntervalMinutes: 30,
};

export default function CookieRotationConfigPage() {
  const [config, setConfig] = useState<CookieRotationConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<CookieRotationConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  }, [config, originalConfig]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // TODO: Replace with actual API call when backend is ready
      const loadedConfig = DEFAULT_CONFIG;
      setConfig(loadedConfig);
      setOriginalConfig(loadedConfig);
      console.log("Loading cookie rotation config...");
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      setSaveMessage({ type: "success", text: "Configuration saved successfully" });
      setOriginalConfig(config);
      console.log("Saved config:", config);

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: "error", text: `Failed to save configuration: ${error}` });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChanges = () => {
    setConfig(originalConfig);
    setSaveMessage(null);
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const toggleSwitch = (key: keyof Omit<CookieRotationConfig, "rotationMethodOrder" | "rotationIntervalMinutes">) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const moveMethodUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...config.rotationMethodOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setConfig((prev) => ({ ...prev, rotationMethodOrder: newOrder }));
  };

  const moveMethodDown = (index: number) => {
    if (index === config.rotationMethodOrder.length - 1) return;
    const newOrder = [...config.rotationMethodOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setConfig((prev) => ({ ...prev, rotationMethodOrder: newOrder }));
  };

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cookie Rotation</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure rotation settings and strategies</p>
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
              onClick={handleResetDefaults}
              title="Reset to default configuration"
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
              onClick={handleSaveConfig}
              disabled={!hasChanges || isSaving}
              title={!hasChanges ? "No changes to save" : "Save configuration"}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${
                hasChanges && !isSaving
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
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

      {/* Configuration Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-2">
        {/* Worker Launch Settings */}
        <WorkerLaunchSettings
          launchWorkerOnAppStart={config.launchWorkerOnAppStart}
          onToggle={() => toggleSwitch("launchWorkerOnAppStart")}
        />

        {/* Rotation Methods */}
        <RotationMethods
          rotateViaHeadless={config.rotateViaHeadless}
          rotateViaRefreshCreds={config.rotateViaRefreshCreds}
          onToggleHeadless={() => toggleSwitch("rotateViaHeadless")}
          onToggleRefreshCreds={() => toggleSwitch("rotateViaRefreshCreds")}
        />

        {/* Rotation Method Order */}
        <RotationMethodOrder
          rotationMethodOrder={config.rotationMethodOrder}
          onMoveUp={moveMethodUp}
          onMoveDown={moveMethodDown}
        />

        {/* Rotation Interval */}
        <RotationInterval
          rotationIntervalMinutes={config.rotationIntervalMinutes}
          onChange={(minutes) => setConfig((prev) => ({ ...prev, rotationIntervalMinutes: minutes }))}
        />
      </div>
    </div>
  );
}
