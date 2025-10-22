import React, { useState } from "react";
import { RotationStatus, ProfileWithCookies } from "./types";
import { Play, Square, RefreshCw, Eye } from "lucide-react";

interface Props {
  status: RotationStatus;
  profiles: ProfileWithCookies[];
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
  onStartAll: () => Promise<void> | void;
  onStartWorker: (profileId: string, cookieId: string) => Promise<void> | void;
  onStopWorker: (profileId: string, cookieId: string) => Promise<void> | void;
  onForceHeadlessRefresh: (
    profileId: string,
    cookieId: string
  ) => Promise<void> | void;
  onForceVisibleRefresh: (
    profileId: string,
    cookieId: string
  ) => Promise<void> | void;
  ref?: React.Ref<HTMLDivElement>;
}

export function CookieRotationPanel({
  status: s,
  profiles,
  onClose,
  onRefresh,
  onStartAll,
  onStartWorker,
  onStopWorker,
  onForceHeadlessRefresh,
  onForceVisibleRefresh,
  ref,
}: Props) {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(
    new Set()
  );

  const toggleProfile = (profileId: string) => {
    setExpandedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  };

  const getWorkerStatusColor = (status?: string) => {
    switch (status) {
      case "running":
        return "text-green-600 dark:text-green-400";
      case "stopped":
        return "text-gray-600 dark:text-gray-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-500";
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case "healthy":
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case "degraded":
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case "expired":
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-96 max-h-[600px] overflow-y-auto"
      role="dialog"
      aria-label="Cookie Rotation Status"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Cookie Rotation Manager
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Status Summary */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span
            className={`font-medium ${
              s.isRunning
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {s.isRunning ? "Running" : "Stopped"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Active Workers:
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {s.running} / {s.total}
          </span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Health:
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Healthy</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {s.healthy}
            </span>
          </div>

          {s.degraded > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Degraded
                </span>
              </div>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {s.degraded}
              </span>
            </div>
          )}

          {s.expired > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Expired
                </span>
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">
                {s.expired}
              </span>
            </div>
          )}

          {s.error > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Error</span>
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">
                {s.error}
              </span>
            </div>
          )}
        </div>

        {s.requiresHeadless > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {s.requiresHeadless} session{s.requiresHeadless > 1 ? "s" : ""}{" "}
                need headless refresh
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profiles List */}
      {profiles.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profiles ({profiles.length}):
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {profiles.map((profile) => (
              <div
                key={profile.profileId}
                className="border border-gray-200 dark:border-gray-700 rounded p-2"
              >
                <button
                  onClick={() => toggleProfile(profile.profileId)}
                  className="w-full flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-gray-750 p-1 rounded"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.profileName || profile.profileId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      {profile.cookies.length} cookie
                      {profile.cookies.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {expandedProfiles.has(profile.profileId) ? "▼" : "▶"}
                    </span>
                  </div>
                </button>

                {expandedProfiles.has(profile.profileId) && (
                  <div className="mt-2 space-y-1 pl-2">
                    {profile.cookies.map((cookie) => (
                      <div
                        key={cookie.cookieId}
                        className="flex items-center justify-between text-xs p-1 bg-gray-50 dark:bg-gray-750 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getHealthIcon(cookie.sessionHealth)}
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {cookie.service}
                          </span>
                          <span
                            className={`text-xs ${getWorkerStatusColor(
                              cookie.workerStatus
                            )}`}
                          >
                            {cookie.workerStatus || "stopped"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {cookie.workerStatus === "running" ? (
                            <button
                              onClick={() =>
                                onStopWorker(profile.profileId, cookie.cookieId)
                              }
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
                              title="Stop worker"
                              aria-label={`Stop worker for ${
                                profile.profileName || profile.profileId
                              }`}
                            >
                              <Square className="w-4 h-4 text-red-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                onStartWorker(
                                  profile.profileId,
                                  cookie.cookieId
                                )
                              }
                              className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900"
                              title="Start worker"
                              aria-label={`Start worker for ${
                                profile.profileName || profile.profileId
                              }`}
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </button>
                          )}

                          {/* Headless (background) refresh icon button */}
                          <button
                            onClick={() =>
                              onForceHeadlessRefresh(
                                profile.profileId,
                                cookie.cookieId
                              )
                            }
                            className="p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900"
                            title="Refresh in background (headless)"
                            aria-label={`Headless refresh for ${
                              profile.profileName || profile.profileId
                            }`}
                          >
                            <RefreshCw className="w-4 h-4 text-purple-600" />
                          </button>

                          {/* Visible (interactive) refresh icon button */}
                          <button
                            onClick={() =>
                              onForceVisibleRefresh(
                                profile.profileId,
                                cookie.cookieId
                              )
                            }
                            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
                            title="Refresh in visible browser"
                            aria-label={`Visible refresh for ${
                              profile.profileName || profile.profileId
                            }`}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex gap-2">
        <button
          onClick={onRefresh}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        >
          Refresh
        </button>
        {!s.isRunning && profiles.length > 0 && (
          <button
            onClick={onStartAll}
            className="flex-1 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
          >
            Start All
          </button>
        )}
      </div>
    </div>
  );
}

export default CookieRotationPanel;
