import React, { useState } from "react";
import { RotationStatus, ProfileWithCookies } from "./types";
import { Play, Square, RefreshCw, Eye, FileText } from "lucide-react";
import WorkerLogViewer from "./WorkerLogViewer";

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
    cookieId: string,
    service: string,
    url: string,
    profileName?: string
  ) => Promise<void> | void;
  onForceVisibleRefresh: (
    profileId: string,
    cookieId: string,
    service: string,
    url: string,
    profileName?: string
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
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [viewingLogs, setViewingLogs] = useState<{ cookieId: string; profileId: string; profileName?: string } | null>(null);

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

  // If viewing logs, show the log viewer
  if (viewingLogs) {
    return (
      <div
        ref={ref}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-0 w-[28rem] max-h-[640px] overflow-hidden"
        role="dialog"
        aria-label="Worker Logs"
      >
        <WorkerLogViewer
          cookieId={viewingLogs.cookieId}
          profileId={viewingLogs.profileId}
          profileName={viewingLogs.profileName}
          onClose={() => setViewingLogs(null)}
          maxHeight="580px"
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-4 w-[22rem] max-h-[640px] overflow-y-auto"
      role="dialog"
      aria-label="Cookie Rotation Dashboard"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cookie Rotation</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            title="Refresh status"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-2 mb-3 h-fit">
        {/* Left column: Status & Workers */}
        <div className="space-y-1 flex flex-col">
          {/* Status */}
          <div className="p-2 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 flex items-center justify-between">
            <div className="text-xs text-gray-500">Status</div>
            <div className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${s.isRunning ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {s.isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>

          {/* Workers */}
          <div className="p-2 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 flex items-center justify-between">
            <div className="text-xs text-gray-500">Workers</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {s.running}/{s.total}
            </div>
          </div>
        </div>

        {/* Right column: Session Health */}
        <div className="space-y-1">
          <div className="text-xs text-gray-500 px-1 h-6 flex items-center">Session Health</div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-xs text-green-700 dark:text-green-300">Healthy</span>
            <span className="text-xs font-semibold text-green-900 dark:text-green-100 ml-auto">{s.healthy}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
            <span className="text-xs text-yellow-700 dark:text-yellow-300">Degraded</span>
            <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 ml-auto">{s.degraded}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-300">Expired</span>
            <span className="text-xs font-semibold text-red-900 dark:text-red-100 ml-auto">{s.expired}</span>
          </div>
          {s.requiresHeadless > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs text-amber-700 dark:text-amber-300">Headless</span>
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 ml-auto">{s.requiresHeadless}</span>
            </div>
          )}
        </div>
      </div>

      {/* Profiles Grid */}
      {profiles.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Profiles ({profiles.length})</div>
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
            {profiles.map((profile) => (
              <div
                key={profile.profileId}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {profile.profileName || profile.profileId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {profile.cookies.length} cookie
                      {profile.cookies.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleProfile(profile.profileId)}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      {expandedProfiles.has(profile.profileId) ? "Hide" : "Details"}
                    </button>
                  </div>
                </div>

                {expandedProfiles.has(profile.profileId) && (
                  <div className="mt-3 space-y-2">
                    {profile.cookies.map((cookie) => (
                      <div
                        key={cookie.cookieId}
                        className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-750 rounded p-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getHealthIcon(cookie.sessionHealth)}
                          <div className="min-w-0">
                            <div className="text-sm text-gray-800 dark:text-gray-200 truncate">{cookie.service}</div>
                            <div className="text-xs text-gray-500 truncate">{cookie.url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`text-xs ${getWorkerStatusColor(cookie.workerStatus)}`}>
                            {cookie.workerStatus || "stopped"}
                          </div>

                          {/* View logs button - shown for running workers */}
                          {cookie.workerStatus === "running" && (
                            <button
                              onClick={() =>
                                setViewingLogs({
                                  cookieId: cookie.cookieId,
                                  profileId: profile.profileId,
                                  profileName: profile.profileName,
                                })
                              }
                              className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
                              title="View worker logs"
                              aria-label={`View logs for ${profile.profileName || profile.profileId}`}
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                            </button>
                          )}

                          {cookie.workerStatus === "running" ? (
                            <button
                              onClick={() => onStopWorker(profile.profileId, cookie.cookieId)}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
                              title="Stop worker"
                              aria-label={`Stop worker for ${profile.profileName || profile.profileId}`}
                            >
                              <Square className="w-4 h-4 text-red-600" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onStartWorker(profile.profileId, cookie.cookieId)}
                              className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900"
                              title="Start worker"
                              aria-label={`Start worker for ${profile.profileName || profile.profileId}`}
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </button>
                          )}

                          <button
                            onClick={() =>
                              onForceHeadlessRefresh(
                                profile.profileId,
                                cookie.cookieId,
                                cookie.service,
                                cookie.url,
                                profile.profileName
                              )
                            }
                            className="p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900"
                            title="Headless refresh"
                            aria-label={`Headless refresh for ${profile.profileName || profile.profileId}`}
                          >
                            <RefreshCw className="w-4 h-4 text-purple-600" />
                          </button>

                          <button
                            onClick={() =>
                              onForceVisibleRefresh(
                                profile.profileId,
                                cookie.cookieId,
                                cookie.service,
                                cookie.url,
                                profile.profileName
                              )
                            }
                            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
                            title="Visible refresh"
                            aria-label={`Visible refresh for ${profile.profileName || profile.profileId}`}
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
      ) : (
        <div className="text-xs text-gray-500">No profiles found.</div>
      )}

      {/* Footer actions */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 flex gap-2">
        {!s.isRunning && profiles.length > 0 ? (
          <button onClick={onStartAll} className="flex-1 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded">
            Start All
          </button>
        ) : (
          <div className="flex-1" />
        )}

        <button
          onClick={onRefresh}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default CookieRotationPanel;
