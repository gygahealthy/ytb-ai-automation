import {
  ChevronDown,
  Eye,
  Filter,
  Grid3x3,
  List,
  Plus,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProfileModal, { ProfileFormData } from "../components/profiles/ProfileModal";
import ProfilesTable from "../components/profiles/ProfilesTable";
import ProfilesGrid from "../components/profiles/ProfilesGrid";

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
    id: false,
    name: true,
    browser: true,
    path: false,
    userAgent: true,
    credit: true,
    tags: true,
    createdAt: true,
    cookie: true,
    loginStatus: true,
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
          browserPath: formData.browserPath || undefined,
          userDataDir: formData.userDataDir || undefined,
          userAgent: formData.userAgent || undefined,
          creditRemaining: formData.creditRemaining,
          tags: formData.tags,
          cookies: formData.cookies || undefined,
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
          browserPath: formData.browserPath || undefined,
          userDataDir: formData.userDataDir || undefined,
          userAgent: formData.userAgent || undefined,
          creditRemaining: formData.creditRemaining,
          tags: formData.tags,
          cookies: formData.cookies || undefined,
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

  const handleLoginProfile = async (id: string) => {
    try {
      const response = (await window.electronAPI.profile.login(id)) as ApiResponse<Profile>;
      if (response.success) {
        await loadProfiles();
      } else {
        console.error("Login failed:", response.error);
      }
    } catch (error) {
      console.error("Failed to login profile:", error);
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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
        <ProfilesTable
          profiles={profiles}
          filteredProfiles={filteredProfiles}
          columnVisibility={columnVisibility}
          onEditProfile={handleEditProfile}
          onLoginProfile={handleLoginProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <ProfilesGrid
          profiles={profiles}
          filteredProfiles={filteredProfiles}
          onEditProfile={handleEditProfile}
          onLoginProfile={handleLoginProfile}
          onDeleteProfile={handleDeleteProfile}
        />
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
