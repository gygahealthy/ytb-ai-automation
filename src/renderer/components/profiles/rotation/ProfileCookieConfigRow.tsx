import { Settings, RefreshCw, Cpu, Clock, ChevronUp, ChevronDown } from "lucide-react";
import type { CookieRotationConfig, RotationMethod } from "../../common/sidebar/cookie-rotation/types";

interface ProfileCookieConfigRowProps {
  cookie: {
    cookieId: string;
    service: string;
    url: string;
    status: string;
    lastRotatedAt?: string;
    config?: CookieRotationConfig;
  };
  profileName?: string;
  onUpdateConfig: (cookieId: string, config: Partial<CookieRotationConfig>) => Promise<void>;
}

export default function ProfileCookieConfigRow({ cookie, profileName, onUpdateConfig }: ProfileCookieConfigRowProps) {
  // Provide default config if missing
  const config: CookieRotationConfig = cookie.config || {
    cookieId: cookie.cookieId,
    launchWorkerOnStartup: false,
    enabledRotationMethods: [],
    rotationMethodOrder: ["headless", "refreshCreds"],
    rotationIntervalMinutes: 60,
  };

  const handleToggleLaunchOnStartup = () => {
    onUpdateConfig(cookie.cookieId, {
      launchWorkerOnStartup: !config.launchWorkerOnStartup,
    });
  };

  const handleToggleMethod = (method: RotationMethod) => {
    const enabled = config.enabledRotationMethods.includes(method);
    const newMethods = enabled
      ? config.enabledRotationMethods.filter((m: RotationMethod) => m !== method)
      : [...config.enabledRotationMethods, method];

    onUpdateConfig(cookie.cookieId, {
      enabledRotationMethods: newMethods,
    });
  };

  const handleMoveMethodUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...config.rotationMethodOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onUpdateConfig(cookie.cookieId, {
      rotationMethodOrder: newOrder,
    });
  };

  const handleMoveMethodDown = (index: number) => {
    if (index === config.rotationMethodOrder.length - 1) return;
    const newOrder = [...config.rotationMethodOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onUpdateConfig(cookie.cookieId, {
      rotationMethodOrder: newOrder,
    });
  };

  const handleIntervalChange = (minutes: number) => {
    onUpdateConfig(cookie.cookieId, {
      rotationIntervalMinutes: Math.max(1, Math.min(1440, minutes)),
    });
  };

  const getMethodLabel = (method: RotationMethod): string => {
    switch (method) {
      case "refreshCreds":
        return "Refresh Creds";
      case "rotateCookie":
        return "Rotate Cookie";
      case "headless":
        return "Headless";
      default:
        return method;
    }
  };

  const getServiceBadgeColor = (service: string) => {
    switch (service.toLowerCase()) {
      case "gemini":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      case "flow":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex flex-col h-full">
      {/* Card Header with Profile Name and Service */}
      <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        {profileName && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Profile: {profileName}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getServiceBadgeColor(cookie.service)}`}>
            {cookie.service}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1" title={cookie.url}>
            {new URL(cookie.url).hostname}
          </span>
        </div>
      </div>

      {/* Compact Controls Grid */}
      <div className="space-y-2 flex-1">
        {/* 1. Launch on Startup Toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Launch</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.launchWorkerOnStartup}
              onChange={handleToggleLaunchOnStartup}
              className="sr-only peer"
            />
            <div className="relative w-7 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600" />
          </label>
        </div>

        {/* 2. Rotation Methods Checkboxes */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Methods</span>
          </div>
          <div className="flex flex-wrap gap-2 ml-0.5">
            <label className="inline-flex items-center cursor-pointer">
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">Headless</span>
              <input
                type="checkbox"
                checked={config.enabledRotationMethods.includes("headless")}
                onChange={() => handleToggleMethod("headless")}
                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">Refresh</span>
              <input
                type="checkbox"
                checked={config.enabledRotationMethods.includes("refreshCreds")}
                onChange={() => handleToggleMethod("refreshCreds")}
                className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* 3. Method Priority (Compact) */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Priority</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {config.rotationMethodOrder.map((method: RotationMethod, index: number) => (
              <div
                key={method}
                className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded px-1.5 py-0.5 group"
              >
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-indigo-500 text-white text-[8px] font-bold mr-0.5">
                  {index + 1}
                </span>
                <span className="text-[10px] font-medium text-gray-900 dark:text-white">{getMethodLabel(method)}</span>
                <div className="hidden group-hover:flex gap-0 ml-0.5">
                  <button
                    onClick={() => handleMoveMethodUp(index)}
                    disabled={index === 0}
                    className={`p-0.5 ${
                      index === 0
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    <ChevronUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleMoveMethodDown(index)}
                    disabled={index === config.rotationMethodOrder.length - 1}
                    className={`p-0.5 ${
                      index === config.rotationMethodOrder.length - 1
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Rotation Interval */}
        <div>
          <label className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Interval (min)</span>
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={config.rotationIntervalMinutes}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Last Rotated Info */}
      {cookie.lastRotatedAt && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Last: {new Date(cookie.lastRotatedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
