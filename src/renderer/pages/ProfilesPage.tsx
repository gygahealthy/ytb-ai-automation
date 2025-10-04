import {
  Calendar,
  ChevronDown,
  Cookie,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Folder,
  Globe,
  Grid3x3,
  List,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProfileModal, { ProfileFormData } from "../components/ProfileModal";

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ColumnVisibility {
  id: boolean;
  name: boolean;
  path: boolean;
  userAgent: boolean;
  credit: boolean;
  tags: boolean;
  createdAt: boolean;
  cookie: boolean;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Refs for detecting clicks outside dropdowns
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    id: true,
    name: true,
    path: true,
    userAgent: true,
    credit: true,
    tags: true,
    createdAt: true,
    cookie: true,
  });

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter profiles when search or tags change
  useEffect(() => {
    let filtered = profiles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (profile) =>
          profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.userDataDir.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((profile) => selectedTags.every((tag) => profile.tags?.includes(tag)));
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, selectedTags]);

  // Get all unique tags from profiles
  const allTags = Array.from(new Set(profiles.flatMap((profile) => profile.tags || []))).sort();

  const loadProfiles = async () => {
    try {
      const response = (await window.electronAPI.profile.getAll()) as ApiResponse<Profile[]>;
      if (response.success && response.data) {
        setProfiles(response.data);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setIsEditMode(true);
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingProfile(null);
  };

  const handleSaveProfile = async (formData: ProfileFormData) => {
    try {
      if (isEditMode && editingProfile) {
        const response = (await window.electronAPI.profile.update(editingProfile.id, {
          name: formData.name,
          userDataDir: formData.userDataDir || undefined,
          userAgent: formData.userAgent || undefined,
          creditRemaining: formData.creditRemaining,
          tags: formData.tags,
        })) as ApiResponse<Profile>;

        if (response.success) {
          await loadProfiles();
        } else {
          alert(`Failed to update profile: ${response.error}`);
          throw new Error(response.error);
        }
      } else {
        const response = (await window.electronAPI.profile.create({
          name: formData.name,
          userDataDir: formData.userDataDir || undefined,
          userAgent: formData.userAgent || undefined,
          creditRemaining: formData.creditRemaining,
          tags: formData.tags,
        })) as ApiResponse<Profile>;

        if (response.success) {
          await loadProfiles();
        } else {
          alert(`Failed to create profile: ${response.error}`);
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    try {
      const response = (await window.electronAPI.profile.delete(id)) as ApiResponse<boolean>;
      if (response.success) {
        await loadProfiles();
      } else {
        alert(`Failed to delete profile: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alert(`Failed to delete profile: ${error}`);
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-primary-500" />
            Profiles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your browser profiles</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>

      {/* Search, Filter, and View Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles by name, ID, or path..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Filter Button */}
        <div className="relative" ref={filterDropdownRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              selectedTags.length > 0
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filter by Tags
            {selectedTags.length > 0 && (
              <span className="bg-white text-primary-500 rounded-full px-2 py-0.5 text-xs font-bold">{selectedTags.length}</span>
            )}
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Filter by Tags
                  </span>
                  {selectedTags.length > 0 && (
                    <button onClick={() => setSelectedTags([])} className="text-xs text-red-600 hover:text-red-700">
                      Clear
                    </button>
                  )}
                </div>
                {allTags.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {allTags.map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTagFilter(tag)}
                          className="rounded"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No tags available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column Visibility */}
        <div className="relative" ref={columnDropdownRef}>
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            Columns
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Column Settings Dropdown */}
          {showColumnSettings && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
              <div className="p-3 space-y-1">
                {Object.entries(columnVisibility).map(([column, visible]) => (
                  <label
                    key={column}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => toggleColumnVisibility(column as keyof ColumnVisibility)}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{column}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "table"
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title="Table View"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title="Grid View"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery || selectedTags.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              <Search className="w-3 h-3" />
              Search: {searchQuery}
              <button onClick={() => setSearchQuery("")} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                onClick={() => toggleTagFilter(tag)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                  {columnVisibility.id && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                  )}
                  {columnVisibility.name && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                  )}
                  {columnVisibility.path && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Path
                    </th>
                  )}
                  {columnVisibility.userAgent && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User Agent
                    </th>
                  )}
                  {columnVisibility.credit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credit
                    </th>
                  )}
                  {columnVisibility.tags && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                  )}
                  {columnVisibility.createdAt && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created At
                    </th>
                  )}
                  {columnVisibility.cookie && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cookie
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {profiles.length === 0
                        ? "No profiles yet. Create your first profile to get started."
                        : "No profiles match your filters."}
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProfile(profile)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                      {columnVisibility.id && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {profile.id}
                          </span>
                        </td>
                      )}
                      {columnVisibility.name && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" />
                            {profile.name}
                          </span>
                        </td>
                      )}
                      {columnVisibility.path && (
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs break-all flex items-center gap-2">
                            <Folder className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate" title={profile.userDataDir}>
                              {profile.userDataDir}
                            </span>
                          </span>
                        </td>
                      )}
                      {columnVisibility.userAgent && (
                        <td className="px-6 py-4 max-w-xs">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all line-clamp-2 flex items-center gap-2">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <span title={profile.userAgent}>{profile.userAgent || "Default"}</span>
                          </span>
                        </td>
                      )}
                      {columnVisibility.credit && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {profile.creditRemaining.toFixed(2)}
                          </span>
                        </td>
                      )}
                      {columnVisibility.tags && (
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(profile.createdAt)}
                          </span>
                        </td>
                      )}
                      {columnVisibility.cookie && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Cookie
                              className={`w-4 h-4 ${isCookieExpired(profile.cookieExpires) ? "text-red-500" : "text-green-500"}`}
                            />
                            {profile.cookieExpires ? (
                              <span
                                className={`text-xs ${
                                  isCookieExpired(profile.cookieExpires)
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {isCookieExpired(profile.cookieExpires) ? "Expired" : formatDate(profile.cookieExpires)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">No cookie</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
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
                      onClick={() => handleEditProfile(profile)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
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
                  <Cookie className={`w-4 h-4 ${isCookieExpired(profile.cookieExpires) ? "text-red-500" : "text-green-500"}`} />
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

                {/* Created Date */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(profile.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        editingProfile={editingProfile}
        onClose={handleCloseModal}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
