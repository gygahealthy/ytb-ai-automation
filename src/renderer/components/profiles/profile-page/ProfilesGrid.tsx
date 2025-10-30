import { Calendar, Cookie, DollarSign, Edit, Tag, Trash2, User, MessageSquare, Sparkles, Zap, Copy, Check } from "lucide-react";
import { useState } from "react";
import ToggleSwitch from "@components/common/ToggleSwitch";
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

interface ProfilesGridProps {
  profiles: Profile[];
  filteredProfiles: Profile[];
  onEditProfile: (profile: Profile) => void;
  // onLoginProfile removed - login flow deprecated
  onDeleteProfile: (id: string) => void;
  onOpenCookieModal?: (profileId: string) => void;
  onOpenChatModal?: (profileId: string) => void;
}

export default function ProfilesGrid({
  profiles,
  filteredProfiles,
  onEditProfile,
  onDeleteProfile,
  onOpenCookieModal,
  onOpenChatModal,
}: ProfilesGridProps) {
  const geminiProfileId = useDefaultProfileStore((s) => s.geminiProfileId);
  const flowProfileId = useDefaultProfileStore((s) => s.flowProfileId);
  const setGeminiProfile = useDefaultProfileStore((s) => s.setGeminiProfile);
  const setFlowProfile = useDefaultProfileStore((s) => s.setFlowProfile);

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

  // Small component to render and copy profile id
  const ProfileId: React.FC<{ id: string }> = ({ id }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch (err) {
        console.error("Failed to copy id", err);
      }
    };
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1">
          {id}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={copied ? "Copied" : "Copy ID"}
          aria-label={copied ? "Copied" : "Copy ID"}
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProfiles.length === 0 ? (
        <div className="col-span-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="mb-2">
              {profiles.length === 0
                ? "No profiles yet. Create your first profile to get started."
                : "No profiles match your filters."}
            </p>
          </div>
        </div>
      ) : (
        filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEditProfile(profile)}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
                {onOpenCookieModal && (
                  <button
                    onClick={() => onOpenCookieModal(profile.id)}
                    className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Manage Cookies"
                  >
                    <Cookie className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </button>
                )}
                {onOpenChatModal && (
                  <button
                    onClick={() => onOpenChatModal(profile.id)}
                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Test Chat"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteProfile(profile.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Profile Name */}
            <h3 className="text-base font-bold mb-2 truncate text-gray-900 dark:text-white" title={profile.name}>
              {profile.name}
            </h3>

            {/* Profile ID */}
            <ProfileId id={profile.id} />

            {/* Credit */}
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold">
              <DollarSign className="w-4 h-4" />
              {profile.creditRemaining.toFixed(2)} Credits
            </div>

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Cookie Status */}
            <div className="mb-4 flex items-center gap-2">
              <Cookie className={`w-4 h-4 ${isCookieExpired(profile.cookieExpires) ? "text-gray-400" : "text-green-500"}`} />
              <span
                className={`text-xs ${
                  isCookieExpired(profile.cookieExpires)
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {profile.cookieExpires ? (isCookieExpired(profile.cookieExpires) ? "Expired" : "Active") : "None"}
              </span>
            </div>

            {/* Default Profile Toggles */}
            <div className="mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Gemini</span>
                </div>
                <ToggleSwitch
                  checked={geminiProfileId === profile.id}
                  onChange={(checked) => setGeminiProfile(checked ? profile.id : null)}
                  size="sm"
                  color="purple"
                  ariaLabel="Set as default Gemini profile"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Flow</span>
                </div>
                <ToggleSwitch
                  checked={flowProfileId === profile.id}
                  onChange={(checked) => setFlowProfile(checked ? profile.id : null)}
                  size="sm"
                  color="blue"
                  ariaLabel="Set as default Flow profile"
                />
              </div>
            </div>

            {/* Created Date */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              {formatDate(profile.createdAt)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
