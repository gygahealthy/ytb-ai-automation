/**
 * Cookie Rotation Logs Panel
 * Displays worker logs with quick navigation via tabs or grid of mini cards
 */

import React, { useMemo, useState } from "react";
import { ProfileWithCookies } from "./types";
import WorkerLogViewer from "./WorkerLogViewer";
import { Grid3x3, List, ArrowLeft } from "lucide-react";
import clsx from "clsx";

interface Props {
  profiles: ProfileWithCookies[];
  onBack?: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

export function CookieRotationLogsPanel({ profiles, onBack, ref }: Props) {
  // Flatten all cookies into a single list with profile context
  const allCookies = useMemo(() => {
    const cookies = [];
    for (const profile of profiles) {
      for (const cookie of profile.cookies) {
        cookies.push({
          profileId: profile.profileId,
          profileName: profile.profileName,
          cookieId: cookie.cookieId,
          service: cookie.service,
          url: cookie.url,
          workerStatus: cookie.workerStatus,
          sessionHealth: cookie.sessionHealth,
        });
      }
    }
    return cookies;
  }, [profiles]);

  // Selected cookie for viewing logs
  const [selectedCookie, setSelectedCookie] = useState<(typeof allCookies)[0] | null>(
    allCookies.length > 0 ? allCookies[0] : null
  );

  // View mode: 'tabs' for tab-based navigation, 'grid' for mini card grid
  const [viewMode, setViewMode] = useState<"tabs" | "grid">("tabs");

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

  if (allCookies.length === 0) {
    return (
      <div ref={ref} className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No cookies available</p>
      </div>
    );
  }

  if (!selectedCookie) {
    return (
      <div ref={ref} className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Select a cookie to view logs</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden w-full">
      {/* Single Compact Navigation Bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1.5 flex items-center gap-1">
        {/* Cookie Selector - Only show if NOT in grid mode */}
        {viewMode === "tabs" && (
          <div className="flex gap-0.5 overflow-x-auto flex-1 scrollbar-thin">
            {allCookies.map((cookie) => {
              const isSelected = selectedCookie.cookieId === cookie.cookieId && selectedCookie.profileId === cookie.profileId;
              return (
                <button
                  key={`${cookie.profileId}-${cookie.cookieId}`}
                  onClick={() => setSelectedCookie(cookie)}
                  className={clsx(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                    isSelected
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  )}
                  title={`${cookie.profileName || cookie.profileId} • ${cookie.service}`}
                >
                  {getHealthIcon(cookie.sessionHealth)}
                  <span>{cookie.service}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grid Mode - show selected cookie info */}
        {viewMode === "grid" && (
          <div className="flex-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            {getHealthIcon(selectedCookie.sessionHealth)}
            <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCookie.service}</span>
            <span className="text-gray-500">•</span>
            <span>{selectedCookie.profileName || selectedCookie.profileId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0 border-l border-gray-300 dark:border-gray-600 pl-1">
          <button
            onClick={() => setViewMode(viewMode === "tabs" ? "grid" : "tabs")}
            className={clsx(
              "p-1.5 rounded transition-colors",
              viewMode === "grid"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
            title={viewMode === "tabs" ? "Switch to grid view" : "Switch to inline view"}
          >
            {viewMode === "tabs" ? <Grid3x3 className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid View Selector (only shown when grid mode is active) */}
      {viewMode === "grid" && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
          <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto">
            {allCookies.map((cookie) => {
              const isSelected = selectedCookie.cookieId === cookie.cookieId && selectedCookie.profileId === cookie.profileId;
              return (
                <button
                  key={`grid-${cookie.profileId}-${cookie.cookieId}`}
                  onClick={() => setSelectedCookie(cookie)}
                  className={clsx(
                    "p-2 rounded border transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                  )}
                  title={`${cookie.profileName} • ${cookie.service}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {getHealthIcon(cookie.sessionHealth)}
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate w-full text-center">
                      {cookie.service}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {cookie.profileName?.split("@")[0] || "Profile"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Log Viewer */}
      <div className="flex-1 overflow-hidden">
        <WorkerLogViewer
          cookieId={selectedCookie.cookieId}
          profileId={selectedCookie.profileId}
          profileName={selectedCookie.profileName}
          onBack={undefined}
          onClose={undefined}
        />
      </div>
    </div>
  );
}

export default CookieRotationLogsPanel;
