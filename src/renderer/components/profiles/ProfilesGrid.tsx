import { Calendar, Cookie, DollarSign, Edit, LogIn, Tag, Trash2, User } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  creditRemaining: number;
  tags?: string[];
  cookieExpires?: string;
  isLoggedIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfilesGridProps {
  profiles: Profile[];
  filteredProfiles: Profile[];
  onEditProfile: (profile: Profile) => void;
  onLoginProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
}

export default function ProfilesGrid({
  profiles,
  filteredProfiles,
  onEditProfile,
  onLoginProfile,
  onDeleteProfile,
}: ProfilesGridProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProfiles.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
          {profiles.length === 0
            ? "No profiles yet. Create your first profile to get started."
            : "No profiles match your filters."}
        </div>
      ) : (
        filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEditProfile(profile)}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
                <button
                  onClick={() => onLoginProfile(profile.id)}
                  className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Login"
                >
                  <LogIn className="w-4 h-4 text-green-600 dark:text-green-400" />
                </button>
                <button
                  onClick={() => onDeleteProfile(profile.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Profile Name */}
            <h3 className="text-lg font-bold mb-2 truncate" title={profile.name}>
              {profile.name}
            </h3>

            {/* Profile ID */}
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-4 truncate bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {profile.id}
            </p>

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
            <div className="mb-3 flex items-center gap-2">
              <Cookie
                className={`w-4 h-4 ${isCookieExpired(profile.cookieExpires) ? "text-red-500" : "text-green-500"}`}
              />
              <span
                className={`text-xs ${
                  isCookieExpired(profile.cookieExpires)
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {profile.cookieExpires
                  ? isCookieExpired(profile.cookieExpires)
                    ? "Cookie Expired"
                    : "Cookie Valid"
                  : "No Cookie"}
              </span>
            </div>

            {/* Login Status */}
            <div className="mb-3">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  profile.isLoggedIn
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {profile.isLoggedIn ? "✓ Logged In" : "✗ Not Logged In"}
              </span>
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
