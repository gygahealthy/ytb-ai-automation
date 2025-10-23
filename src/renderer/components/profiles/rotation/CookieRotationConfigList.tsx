import { ChevronRight } from "lucide-react";
import { useState } from "react";
import ProfileCookieConfigRow from "./ProfileCookieConfigRow";
import type { CookieRotationConfig } from "../../common/sidebar/cookie-rotation/types";

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

interface CookieRotationConfigListProps {
  profiles: ProfileWithCookieConfig[];
  onUpdateConfig: (cookieId: string, config: Partial<CookieRotationConfig>) => Promise<void>;
}

export default function CookieRotationConfigList({ profiles, onUpdateConfig }: CookieRotationConfigListProps) {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());

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

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🍪</span>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No profiles with cookies found</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Add cookies to profiles to configure rotation settings</p>
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
              className="w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-t-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all px-4 py-3 flex items-center justify-between"
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
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-850 dark:to-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.cookies.map((cookie) => (
                    <ProfileCookieConfigRow
                      key={cookie.cookieId}
                      cookie={cookie}
                      profileName={profile.profileName || profile.profileId}
                      onUpdateConfig={onUpdateConfig}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
