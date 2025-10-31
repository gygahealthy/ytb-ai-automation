import { Calendar, Cookie, DollarSign, Folder, Globe, Tag, User } from "lucide-react";
import { useState } from "react";
import ProfileActionButtons from "./ProfileActionButtons";
import ToggleSwitch from "@components/common/ToggleSwitch";
import ProjectSelectionModal from "@components/common/ProjectSelectionModal";
import { useDefaultProfileStore } from "@store/default-profile.store";

interface Profile {
  id: string;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  creditRemaining: number;
  tags?: string[];
  cookieExpires?: string;
  createdAt: string;
  updatedAt: string;
}

interface ColumnVisibility {
  id: boolean;
  name: boolean;
  browser: boolean;
  path: boolean;
  userAgent: boolean;
  credit: boolean;
  tags: boolean;
  createdAt: boolean;
  cookie: boolean;
}

interface ProfilesTableProps {
  profiles: Profile[];
  filteredProfiles: Profile[];
  columnVisibility: ColumnVisibility;
  onEditProfile: (profile: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onOpenChatModal?: (profileId: string) => void;
}

export default function ProfilesTable({
  profiles,
  filteredProfiles,
  columnVisibility,
  onEditProfile,
  onDeleteProfile,
  onOpenChatModal,
}: ProfilesTableProps) {
  const geminiProfileId = useDefaultProfileStore((s) => s.geminiProfileId);
  const flowProfileId = useDefaultProfileStore((s) => s.flowProfileId);
  const setGeminiProfile = useDefaultProfileStore((s) => s.setGeminiProfile);
  const setFlowProfile = useDefaultProfileStore((s) => s.setFlowProfile);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [modalProfileId, setModalProfileId] = useState<string>("");
  const [modalProfileName, setModalProfileName] = useState<string>("");
  const [modalServiceType, setModalServiceType] = useState<"gemini" | "flow">("gemini");

  const handleGeminiToggle = (profileId: string, profileName: string, checked: boolean) => {
    if (!checked) {
      setGeminiProfile(null);
    } else {
      // Open modal to select project
      setModalProfileId(profileId);
      setModalProfileName(profileName);
      setModalServiceType("gemini");
      setShowProjectModal(true);
    }
  };

  const handleFlowToggle = (profileId: string, profileName: string, checked: boolean) => {
    if (!checked) {
      setFlowProfile(null);
    } else {
      // Open modal to select project
      setModalProfileId(profileId);
      setModalProfileName(profileName);
      setModalServiceType("flow");
      setShowProjectModal(true);
    }
  };

  const handleProjectConfirm = (projectId: string | null) => {
    if (modalServiceType === "gemini") {
      setGeminiProfile(modalProfileId, projectId);
    } else {
      setFlowProfile(modalProfileId, projectId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCookieExpired = (expiryDate?: string) => {
    if (!expiryDate) return true;
    return new Date(expiryDate) < new Date();
  };

  const getBrowserName = (browserPath?: string) => {
    if (!browserPath) return "Chrome";
    const fileName = browserPath.toLowerCase();
    if (fileName.includes("chrome")) return "Chrome";
    if (fileName.includes("edge")) return "Edge";
    if (fileName.includes("brave")) return "Brave";
    if (fileName.includes("opera")) return "Opera";
    if (fileName.includes("vivaldi")) return "Vivaldi";
    return "Other Chromium";
  };

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-36">
                Actions
              </th>
              {columnVisibility.id && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-40">
                  ID
                </th>
              )}
              {columnVisibility.name && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-40">
                  Name
                </th>
              )}
              {columnVisibility.browser && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                  Browser
                </th>
              )}
              {columnVisibility.path && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-48">
                  Path
                </th>
              )}
              {columnVisibility.userAgent && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-56">
                  User Agent
                </th>
              )}
              {columnVisibility.credit && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-28">
                  Credit
                </th>
              )}
              {columnVisibility.tags && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-40">
                  Tags
                </th>
              )}
              {columnVisibility.createdAt && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-44">
                  Created
                </th>
              )}
              {columnVisibility.cookie && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-40">
                  Cookie
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                Default Gemini
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                Default Flow
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700/30 dark:to-gray-700/50 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 font-semibold">
                        {profiles.length === 0 ? "No profiles yet" : "No profiles match"}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {profiles.length === 0 ? "Click 'New Profile' to create one" : "Try adjusting your filters"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => [
                <tr key={profile.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all duration-150">
                  <td className="px-4 py-3.5 whitespace-nowrap w-36">
                    <ProfileActionButtons
                      onEdit={() => onEditProfile(profile)}
                      onDelete={() => onDeleteProfile(profile.id)}
                      onOpenChatModal={onOpenChatModal ? () => onOpenChatModal(profile.id) : undefined}
                    />
                  </td>
                  {columnVisibility.id && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-40">
                      <span
                        className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded block truncate"
                        title={profile.id}
                      >
                        {profile.id.slice(0, 12)}...
                      </span>
                    </td>
                  )}
                  {columnVisibility.name && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-40">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={profile.name}>
                          {profile.name}
                        </span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.browser && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-32">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{getBrowserName(profile.browserPath)}</span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.path && (
                    <td className="px-4 py-3.5 w-48">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate" title={profile.userDataDir}>
                          {profile.userDataDir.split("\\").pop() || profile.userDataDir}
                        </span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.userAgent && (
                    <td className="px-4 py-3.5 w-56">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1" title={profile.userAgent}>
                          {profile.userAgent ? profile.userAgent.slice(0, 40) + "..." : "Default"}
                        </span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.credit && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-28">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-semibold">
                        <DollarSign className="w-3 h-3" />
                        {profile.creditRemaining.toFixed(2)}
                      </span>
                    </td>
                  )}
                  {columnVisibility.tags && (
                    <td className="px-4 py-3.5 w-40">
                      <div className="flex flex-wrap gap-1">
                        {profile.tags && profile.tags.length > 0 ? (
                          profile.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {profile.tags && profile.tags.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">+{profile.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                  )}
                  {columnVisibility.createdAt && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-44">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(profile.createdAt)}</span>
                      </div>
                    </td>
                  )}
                  {columnVisibility.cookie && (
                    <td className="px-4 py-3.5 whitespace-nowrap w-40">
                      <div className="flex items-center gap-2">
                        <Cookie
                          className={`w-4 h-4 ${isCookieExpired(profile.cookieExpires) ? "text-gray-400" : "text-green-500"}`}
                        />
                        {profile.cookieExpires ? (
                          <span
                            className={`text-xs font-medium ${
                              isCookieExpired(profile.cookieExpires)
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isCookieExpired(profile.cookieExpires) ? "Expired" : "Active"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                  )}
                  {/* Default Gemini Toggle */}
                  <td className="px-4 py-3.5 whitespace-nowrap w-32">
                    <ToggleSwitch
                      checked={geminiProfileId === profile.id}
                      onChange={(checked) => handleGeminiToggle(profile.id, profile.name, checked)}
                      size="sm"
                      color="purple"
                      ariaLabel="Set as default Gemini profile"
                    />
                  </td>
                  {/* Default Flow Toggle */}
                  <td className="px-4 py-3.5 whitespace-nowrap w-32">
                    <ToggleSwitch
                      checked={flowProfileId === profile.id}
                      onChange={(checked) => handleFlowToggle(profile.id, profile.name, checked)}
                      size="sm"
                      color="blue"
                      ariaLabel="Set as default Flow profile"
                    />
                  </td>
                </tr>,
              ])
            )}
          </tbody>
        </table>
      </div>

      <ProjectSelectionModal
        isOpen={showProjectModal}
        profileId={modalProfileId}
        profileName={modalProfileName}
        serviceType={modalServiceType}
        onConfirm={handleProjectConfirm}
        onClose={() => setShowProjectModal(false)}
      />
    </div>
  );
}
