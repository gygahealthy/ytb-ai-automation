import {
  Calendar,
  Cookie,
  DollarSign,
  Edit,
  Folder,
  Globe,
  LogIn,
  Tag,
  Trash2,
  User,
  MessageSquare,
} from "lucide-react";

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
  loginStatus: boolean;
}

interface ProfilesTableProps {
  profiles: Profile[];
  filteredProfiles: Profile[];
  columnVisibility: ColumnVisibility;
  onEditProfile: (profile: Profile) => void;
  onLoginProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onOpenCookieModal?: (profileId: string) => void;
  onOpenChatModal?: (profileId: string) => void;
}

export default function ProfilesTable({
  profiles,
  filteredProfiles,
  columnVisibility,
  onEditProfile,
  onLoginProfile,
  onDeleteProfile,
  onOpenCookieModal,
  onOpenChatModal,
}: ProfilesTableProps) {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Actions
              </th>
              {columnVisibility.id && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  ID
                </th>
              )}
              {columnVisibility.name && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Name
                </th>
              )}
              {columnVisibility.browser && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  Browser
                </th>
              )}
              {columnVisibility.path && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Path
                </th>
              )}
              {columnVisibility.userAgent && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-80">
                  User Agent
                </th>
              )}
              {columnVisibility.credit && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  Credit
                </th>
              )}
              {columnVisibility.tags && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                  Tags
                </th>
              )}
              {columnVisibility.createdAt && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44">
                  Created At
                </th>
              )}
              {columnVisibility.cookie && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                  Cookie
                </th>
              )}
              {columnVisibility.loginStatus && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Login Status
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {profiles.length === 0
                    ? "No profiles yet. Create your first profile to get started."
                    : "No profiles match your filters."}
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap w-32">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditProfile(profile)}
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => onLoginProfile(profile.id)}
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors group"
                        title="Login"
                      >
                        <LogIn className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => onDeleteProfile(profile.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                      </button>
                      {onOpenCookieModal && (
                        <button
                          onClick={() => onOpenCookieModal(profile.id)}
                          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
                          title="Manage Cookies"
                        >
                          <Cookie className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      {onOpenChatModal && (
                        <button
                          onClick={() => onOpenChatModal(profile.id)}
                          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors group"
                          title="Test Chat"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </td>
                  {columnVisibility.id && (
                    <td className="px-4 py-4 whitespace-nowrap w-32">
                      <span
                        className="text-xs font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block truncate"
                        title={profile.id}
                      >
                        {profile.id}
                      </span>
                    </td>
                  )}
                  {columnVisibility.name && (
                    <td className="px-4 py-4 whitespace-nowrap w-32">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <span className="truncate" title={profile.name}>
                          {profile.name}
                        </span>
                      </span>
                    </td>
                  )}
                  {columnVisibility.browser && (
                    <td className="px-4 py-4 whitespace-nowrap w-28">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span
                          className="truncate"
                          title={profile.browserPath || "Chrome"}
                        >
                          {profile.browserPath
                            ? profile.browserPath
                                .split("\\")
                                .pop()
                                ?.replace(".exe", "") || "Chrome"
                            : "Chrome"}
                        </span>
                      </span>
                    </td>
                  )}
                  {columnVisibility.path && (
                    <td className="px-4 py-4 w-32">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono flex items-center gap-2">
                        <Folder className="w-4 h-4 flex-shrink-0" />
                        <span
                          className="truncate block"
                          title={profile.userDataDir}
                        >
                          {profile.userDataDir}
                        </span>
                      </span>
                    </td>
                  )}
                  {columnVisibility.userAgent && (
                    <td className="px-4 py-4 w-80">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono flex items-center gap-2">
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        <span
                          className="line-clamp-2"
                          title={profile.userAgent}
                        >
                          {profile.userAgent || "Default"}
                        </span>
                      </span>
                    </td>
                  )}
                  {columnVisibility.credit && (
                    <td className="px-4 py-4 whitespace-nowrap w-28">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {profile.creditRemaining.toFixed(2)}
                      </span>
                    </td>
                  )}
                  {columnVisibility.tags && (
                    <td className="px-4 py-4 w-40">
                      <div className="flex flex-wrap gap-1">
                        {profile.tags && profile.tags.length > 0 ? (
                          profile.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tags</span>
                        )}
                      </div>
                    </td>
                  )}
                  {columnVisibility.createdAt && (
                    <td className="px-4 py-4 whitespace-nowrap w-44">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">
                          {formatDate(profile.createdAt)}
                        </span>
                      </span>
                    </td>
                  )}
                  {columnVisibility.cookie && (
                    <td className="px-4 py-4 whitespace-nowrap w-36">
                      <div className="flex items-center gap-2">
                        <Cookie
                          className={`w-4 h-4 ${
                            isCookieExpired(profile.cookieExpires)
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        />
                        {profile.cookieExpires ? (
                          <span
                            className={`text-xs ${
                              isCookieExpired(profile.cookieExpires)
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {isCookieExpired(profile.cookieExpires)
                              ? "Expired"
                              : formatDate(profile.cookieExpires)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            No cookie
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  {columnVisibility.loginStatus && (
                    <td className="px-4 py-4 whitespace-nowrap w-32">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          profile.isLoggedIn
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {profile.isLoggedIn ? "✓ Logged In" : "✗ Not Logged In"}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
