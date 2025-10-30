import React, { useEffect, useState } from "react";
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
  onViewLogs?: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

export function CookieRotationPanel({
  status: s,
  profiles,
  onRefresh,
  onStartAll,
  onStartWorker,
  onStopWorker,
  onForceHeadlessRefresh,
  onForceVisibleRefresh,
  onViewLogs,
  ref,
}: Props) {
  // default to expanded for all profiles
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  useEffect(() => {
    // expand all profile ids by default whenever profiles prop changes
    const all = new Set(profiles.map((p) => p.profileId));
    setExpandedProfiles(all);
  }, [profiles]);
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
        return "text-gray-700 dark:text-gray-300";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-300";
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

  // If viewing logs, show the log viewer (full height layout)
  if (viewingLogs) {
    return (
      <div
        ref={ref}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-0 w-full h-full overflow-hidden flex flex-col"
        role="dialog"
        aria-label="Worker Logs"
      >
        <WorkerLogViewer
          cookieId={viewingLogs.cookieId}
          profileId={viewingLogs.profileId}
          profileName={viewingLogs.profileName}
          onClose={() => setViewingLogs(null)}
          onBack={() => setViewingLogs(null)}
          maxHeight="580px"
        />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-3 w-full h-full flex flex-col"
      role="dialog"
      aria-label="Cookie Rotation Dashboard"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cookie Rotation</h3>
        </div>
      </div>
      {/* Dashboard cards - compact layout */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Left column: Status & Workers (compact) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${s.isRunning ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{s.isRunning ? "Running" : "Stopped"}</span>
            </div>
          </div>
        </div>

        {/* Right column: Session Health (compact badges) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-700 dark:text-green-300">{s.healthy}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">{s.degraded}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-red-700 dark:text-red-300">{s.expired}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="Refresh status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {s.requiresHeadless > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs">{s.requiresHeadless}</span>
            </div>
          )}
        </div>
      </div>

      {/* divider between status and profiles */}
      <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

      {/* Profiles Grid */}
      {profiles.length > 0 ? (
        <div className="space-y-2 flex-1 overflow-hidden">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Profiles ({profiles.length})</div>
          <div className="grid grid-cols-1 gap-2 h-full overflow-y-auto auto-rows-min items-start">
            {profiles.map((profile) => (
              <div
                key={profile.profileId}
                className="flex-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 shadow-sm"
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

                {/* Always show cookies (expanded by default) */}
                <div className="mt-3 space-y-2">
                  {profile.cookies.map((cookie) => (
                    <div
                      key={cookie.cookieId}
                      className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700 rounded p-2"
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
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">No profiles found.</div>
      )}

      {/* Footer actions */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 flex gap-2 mt-auto">
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

        {onViewLogs && (
          <button
            onClick={onViewLogs}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            title="View all worker logs with quick navigation"
          >
            View Logs
          </button>
        )}
      </div>
    </div>
  );
}

export default CookieRotationPanel;
