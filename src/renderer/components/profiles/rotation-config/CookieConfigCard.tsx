import { Settings, RefreshCw, Cpu, Clock, ChevronUp, ChevronDown, Play, Square, Zap, Info, X, Edit } from "lucide-react";
import type { CookieRotationConfig, RotationMethod } from "../../common/drawers/cookie-rotation/types";
import { useState, useEffect } from "react";
import CookieDetailModal from "../cookie/CookieDetailModal";
import { CookieAddModal } from "./CookieAddModal";
import ToggleSwitch from "../../common/ToggleSwitch";
import { useConfirm } from "../../../hooks/useConfirm";

interface CookieConfigCardProps {
  cookie: {
    cookieId: string;
    service: string;
    url: string;
    status: string;
    rawCookieString?: string | null;
    lastRotatedAt?: string;
    config?: CookieRotationConfig;
  };
  profileName?: string;
  onUpdateConfig: (cookieId: string, config: Partial<CookieRotationConfig>) => Promise<void>;
  onDeleteCookie?: (cookieId: string) => Promise<void>;
  onForceHeadlessRefresh?: (cookieId: string) => Promise<void>;
  onForceVisibleRefresh?: (cookieId: string) => Promise<void>;
  onStartWorker?: (cookieId: string) => Promise<void>;
  onStopWorker?: (cookieId: string) => Promise<void>;
  workerStatus?: string;
}

export default function CookieConfigCard({
  cookie,
  profileName,
  onUpdateConfig,
  onDeleteCookie,
  onForceHeadlessRefresh,
  onForceVisibleRefresh,
  onStartWorker,
  onStopWorker,
  workerStatus,
}: CookieConfigCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRequiredCookie, setNewRequiredCookie] = useState("");
  const [currentWorkerStatus, setCurrentWorkerStatus] = useState(workerStatus);
  const confirm = useConfirm();

  // Poll for real worker status from database
  useEffect(() => {
    // Update immediately when prop changes
    setCurrentWorkerStatus(workerStatus);

    // Poll every 2 seconds to get fresh status from DB
    const pollInterval = setInterval(async () => {
      try {
        const result = await window.electronAPI.cookieRotation.getProfiles();
        if (result.success && result.data) {
          // Find this specific cookie in the response
          for (const profile of result.data) {
            const foundCookie = profile.cookies.find((c: any) => c.cookieId === cookie.cookieId);
            if (foundCookie) {
              setCurrentWorkerStatus(foundCookie.workerStatus);
              break;
            }
          }
        }
      } catch (error) {
        console.error("[CookieConfigCard] Failed to poll worker status:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [workerStatus, cookie.cookieId]);

  // Provide default config if missing
  const config: CookieRotationConfig = cookie.config || {
    cookieId: cookie.cookieId,
    launchWorkerOnStartup: false,
    enabledRotationMethods: [],
    rotationMethodOrder: ["headless", "refreshCreds"],
    rotationIntervalMinutes: 60,
  };

  const handleToggleLaunchOnStartupSwitch = (checked: boolean) => {
    onUpdateConfig(cookie.cookieId, {
      launchWorkerOnStartup: checked,
    });
  };

  const handleToggleMethod = (e: React.MouseEvent | React.ChangeEvent, method: RotationMethod) => {
    e.stopPropagation();
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

  const handleAddRequiredCookie = (value?: string) => {
    const name = value?.trim() || newRequiredCookie.trim();
    if (!name) return;
    // read existing from raw cookie.config if present (type-unsafe, so use any)
    const existing: string[] = ((cookie.config as any)?.requiredCookies as string[]) || [];
    if (existing.includes(name)) return;
    // Now properly typed - no need for type casting
    onUpdateConfig(cookie.cookieId, { requiredCookies: [...existing, name] });
    setNewRequiredCookie("");
  };

  const handleRemoveRequiredCookie = (name: string) => {
    const existing: string[] = ((cookie.config as any)?.requiredCookies as string[]) || [];
    onUpdateConfig(cookie.cookieId, {
      requiredCookies: existing.filter((c: string) => c !== name),
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

  // helper to interpret a variety of worker status strings as "running"
  const statusIndicatesRunning = (s?: string) => {
    if (!s) return false;
    const norm = s.toLowerCase();
    return /run|start|active|online/.test(norm);
  };

  const isWorkerRunning = statusIndicatesRunning(currentWorkerStatus);
  const isActive = config.launchWorkerOnStartup || isWorkerRunning;

  const getActiveStatusColor = () => {
    return isActive
      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600";
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex flex-col h-full"
    >
      {/* Card Header with Profile Name and Service */}
      <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 flex-1">
            {/* Worker Status Badge moved to leftmost of this row */}
            <div
              className="flex items-center gap-2 px-2 py-1 rounded border text-xs font-medium"
              style={{
                borderColor: isWorkerRunning ? "#86efac" : "#d1d5db",
                backgroundColor: isWorkerRunning ? "rgba(34, 197, 94, 0.05)" : "transparent",
                color: isWorkerRunning ? "#166534" : "#6b7280",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-2 h-2 rounded-full ${isWorkerRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span>{isWorkerRunning ? "Running" : "Stopped"}</span>
            </div>

            {profileName && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Profile: {profileName}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Active Status Badge (kept in top-right) */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${getActiveStatusColor()}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
            {/* Delete Button - X in Top Right Corner */}
            {onDeleteCookie && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await confirm({
                    title: "Delete Cookie",
                    message: `Delete cookie for ${cookie.service}?`,
                  });
                  if (confirmed) {
                    onDeleteCookie(cookie.cookieId);
                  }
                }}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete cookie"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getServiceBadgeColor(cookie.service)}`}>
              {cookie.service}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1" title={cookie.url}>
              {new URL(cookie.url).hostname}
            </span>
          </div>
          {/* space reserved for top-right actions handled above */}
        </div>

        {/* Action Icons and Worker Status */}
        <div className="flex items-center gap-1 justify-between">
          <div className="flex items-center gap-1">
            {onForceHeadlessRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForceHeadlessRefresh(cookie.cookieId);
                }}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Force headless refresh"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            {onForceVisibleRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForceVisibleRefresh(cookie.cookieId);
                }}
                className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                title="Force visible refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {/* Info button moved to the right side (see below) */}
            {onStartWorker || onStopWorker ? (
              <>
                {isWorkerRunning ? (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onStopWorker?.(cookie.cookieId);
                    }}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Stop worker"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onStartWorker?.(cookie.cookieId);
                    }}
                    className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Start worker"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : null}
          </div>

          {/* Right side actions: moved Info icon here and add Edit icon that opens CookieAddModal */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors"
              title="Edit cookie"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailModal(true);
              }}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="View cookie details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Required Cookies (placed under header for consistent top placement) */}
      <div className="mb-3 pt-0">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Cookies</label>
          {/* keep space for potential actions */}
          <div />
        </div>
        <div className="flex items-center gap-2 w-full mt-2">
          <input
            type="text"
            value={newRequiredCookie}
            onChange={(e) => setNewRequiredCookie(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Cookie name (e.g., __Secure-1PSID)"
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddRequiredCookie();
            }}
            className="flex-shrink-0 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(((cookie.config as any)?.requiredCookies as string[]) || []).map((c) => (
            <div
              key={c}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
            >
              <span className="font-mono">{c}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveRequiredCookie(c);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Controls Grid with Separator */}
      <div className="flex flex-1 gap-3">
        {/* LEFT COLUMN: Launch and Methods */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Launch on Startup Toggle */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Settings className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">Launch At Startup</span>
            </div>
            <div className="flex items-center justify-end">
              <div onClick={(e) => e.stopPropagation()}>
                <ToggleSwitch
                  checked={config.launchWorkerOnStartup}
                  onChange={handleToggleLaunchOnStartupSwitch}
                  size="sm"
                  color="primary"
                />
              </div>
            </div>
          </div>

          {/* Rotation Methods (Vertical Stack with Switches) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">Methods</span>
            </div>
            <div className="space-y-1.5 pl-0.5">
              {[
                { method: "headless" as RotationMethod, label: "Headless" },
                { method: "refreshCreds" as RotationMethod, label: "Refresh" },
                { method: "rotateCookie" as RotationMethod, label: "Rotate" },
              ].map(({ method, label }) => (
                <div
                  key={method}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabledRotationMethods.includes(method)}
                      onChange={(e) => handleToggleMethod(e, method)}
                      className="sr-only peer"
                    />
                    <div className="relative w-6 h-3.5 bg-gray-300 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-2.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-purple-500 dark:peer-checked:bg-purple-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical Separator Line */}
        <div className="border-l border-gray-200 dark:border-gray-700" />

        {/* RIGHT COLUMN: Priority and Interval */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Method Priority Reorder - Full Width Rows */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">Priority</span>
            </div>
            <div className="space-y-1">
              {/* Only show methods that are currently enabled in the Methods section */}
              {config.rotationMethodOrder
                .filter((m: RotationMethod) => config.enabledRotationMethods.includes(m))
                .map((method: RotationMethod, visualIndex: number) => {
                  // Map back to the original rotationMethodOrder index so move handlers operate on the full order
                  const originalIndex = config.rotationMethodOrder.indexOf(method);
                  const isFirst = originalIndex === 0;
                  const isLast = originalIndex === config.rotationMethodOrder.length - 1;

                  return (
                    <div
                      key={method}
                      className="flex items-center justify-between gap-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded px-2 py-1"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[7px] font-bold flex-shrink-0">
                          {visualIndex + 1}
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {getMethodLabel(method)}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveMethodUp(originalIndex);
                          }}
                          disabled={isFirst}
                          className={`p-0.5 rounded ${
                            isFirst
                              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          }`}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveMethodDown(originalIndex);
                          }}
                          disabled={isLast}
                          className={`p-0.5 rounded ${
                            isLast
                              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                              : "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          }`}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Rotation Interval with Presets */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Clock className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">Interval</span>
            </div>
            <input
              type="number"
              min={1}
              max={1440}
              value={config.rotationIntervalMinutes}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-1"
            />
            {/* Preset Buttons */}
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 1, label: "1m" },
                { value: 5, label: "5m" },
                { value: 10, label: "10m" },
                { value: 60, label: "1h" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIntervalChange(value);
                  }}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    config.rotationIntervalMinutes === value
                      ? "bg-green-500 dark:bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Last Rotated Info */}
      {cookie.lastRotatedAt && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Last: {new Date(cookie.lastRotatedAt).toLocaleDateString()}
          </p>

          {/* Rotation Result Indicator */}
          {((cookie.config as any)?.lastRotationSuccess !== undefined || (cookie.config as any)?.lastRotationError) && (
            <div className="mt-1">
              {(cookie.config as any)?.lastRotationSuccess ? (
                <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    OK{(cookie.config as any)?.lastRotationMethod ? ` (${(cookie.config as any).lastRotationMethod})` : ""}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Failed</span>
                  </div>
                  {(cookie.config as any)?.lastRotationError && (
                    <div className="text-[9px] text-red-500 dark:text-red-400 ml-4 break-words max-w-full">
                      {(cookie.config as any).lastRotationError.substring(0, 100)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cookie Detail Modal */}
      <CookieDetailModal
        isOpen={showDetailModal}
        cookie={{
          id: cookie.cookieId,
          profileId: "", // Will need to come from parent if available
          service: cookie.service,
          url: cookie.url,
          rawCookieString: cookie.rawCookieString || "",
          lastRotatedAt: cookie.lastRotatedAt,
          spidExpiration: undefined,
          rotationData: "",
          rotationIntervalMinutes: config.rotationIntervalMinutes,
          status: "active",
          launchWorkerOnStartup: config.launchWorkerOnStartup ? 1 : 0,
          enabledRotationMethods: JSON.stringify(config.enabledRotationMethods),
          rotationMethodOrder: JSON.stringify(config.rotationMethodOrder),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        onClose={() => setShowDetailModal(false)}
      />

      <CookieAddModal
        isOpen={showEditModal}
        profileId={""}
        mode={"manual"}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => setShowEditModal(false)}
      />
    </div>
  );
}
