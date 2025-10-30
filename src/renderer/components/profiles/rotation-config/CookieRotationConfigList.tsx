import { ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import CookieConfigCard from "./CookieConfigCard";
import AddCookieCard from "./AddCookieCard";
import type { CookieRotationConfig } from "../../common/drawers/cookie-rotation/types";

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
    workerStatus?: string;
  }>;
}

interface CookieRotationConfigListProps {
  profiles: ProfileWithCookieConfig[];
  onUpdateConfig: (cookieId: string, config: Partial<CookieRotationConfig>) => Promise<void>;
  onDeleteCookie?: (profileId: string, cookieId: string) => Promise<void>;
  onAddCookie?: (profileId: string) => void;
  onForceHeadlessRefresh?: (profileId: string, cookieId: string) => Promise<void>;
  onForceVisibleRefresh?: (profileId: string, cookieId: string) => Promise<void>;
  onStartWorker?: (profileId: string, cookieId: string) => Promise<void>;
  onStopWorker?: (profileId: string, cookieId: string) => Promise<void>;
  allExpanded?: boolean;
  showAllProfiles?: boolean;
}

export default function CookieRotationConfigList({
  profiles,
  onUpdateConfig,
  onDeleteCookie,
  onAddCookie,
  onForceHeadlessRefresh,
  onForceVisibleRefresh,
  onStartWorker,
  onStopWorker,
  allExpanded = false,
  showAllProfiles = false,
}: CookieRotationConfigListProps) {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  // Use null so we treat the initial prop value as a "change" and apply it on mount
  const prevAllExpandedRef = useRef<boolean | null>(null);

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

  // Handle allExpanded prop changes - only when allExpanded actually changes, not when profiles update
  useEffect(() => {
    // Only update if allExpanded prop actually changed (including initial mount)
    if (prevAllExpandedRef.current !== allExpanded) {
      prevAllExpandedRef.current = allExpanded;

      if (allExpanded && profiles.length > 0) {
        const allProfileIds = new Set(profiles.map((p) => p.profileId));
        setExpandedProfiles(allProfileIds);
      } else if (!allExpanded) {
        setExpandedProfiles(new Set());
      }
    }
  }, [allExpanded, profiles]);

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🍪</span>
        </div>
        {showAllProfiles ? (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No profiles found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Create a profile to get started</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No profiles with cookies found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add cookies to profiles to configure rotation settings</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => {
        const isExpanded = expandedProfiles.has(profile.profileId);

        return (
          <div key={profile.profileId}>
            {/* Profile Header Card (always visible) */}
            <button
              onClick={() => toggleProfile(profile.profileId)}
              className={`w-full rounded-t-xl border shadow-sm hover:shadow-md transition-all px-4 py-3 flex items-center justify-between ${
                isExpanded
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {profile.profileName || profile.profileId}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.cookies.length} cookie{profile.cookies.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isExpanded && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                    {profile.cookies.filter((c) => c.config.launchWorkerOnStartup).length} auto-start
                  </span>
                )}
              </div>
            </button>

            {/* Expanded Cookie Grid (3-column card layout) */}
            {isExpanded && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.cookies.map((cookie) => (
                    <CookieConfigCard
                      key={cookie.cookieId}
                      cookie={cookie}
                      profileName={profile.profileName || profile.profileId}
                      onUpdateConfig={onUpdateConfig}
                      onDeleteCookie={onDeleteCookie ? (cookieId) => onDeleteCookie(profile.profileId, cookieId) : undefined}
                      onForceHeadlessRefresh={
                        onForceHeadlessRefresh ? (cookieId) => onForceHeadlessRefresh(profile.profileId, cookieId) : undefined
                      }
                      onForceVisibleRefresh={
                        onForceVisibleRefresh ? (cookieId) => onForceVisibleRefresh(profile.profileId, cookieId) : undefined
                      }
                      onStartWorker={onStartWorker ? (cookieId) => onStartWorker(profile.profileId, cookieId) : undefined}
                      onStopWorker={onStopWorker ? (cookieId) => onStopWorker(profile.profileId, cookieId) : undefined}
                      workerStatus={cookie.workerStatus}
                    />
                  ))}
                  {onAddCookie && <AddCookieCard profileId={profile.profileId} onClick={onAddCookie} />}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
