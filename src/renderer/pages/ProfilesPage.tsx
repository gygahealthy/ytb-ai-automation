import { Search, Tag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import ProfileForm, { ProfileFormData } from "../components/profiles/ProfileForm";
import ProfilesTable from "../components/profiles/ProfilesTable";
import ProfilesGrid from "../components/profiles/ProfilesGrid";
import ProfilesToolbar from "../components/profiles/ProfilesToolbar";
import { useModal } from "../hooks/useModal";
import { useAlert } from '../hooks/useAlert';
import { useConfirm } from '../hooks/useConfirm';
import electronApi from "../ipc";

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

interface ColumnVisibility extends Record<string, boolean> {
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
  const modal = useModal();
  const alertApi = useAlert();
  const confirm = useConfirm();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    id: true,
    name: true,
    browser: true,
    path: true,
    userAgent: true,
    credit: true,
    tags: true,
    createdAt: true,
    cookie: true,
    loginStatus: true,
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = (await electronApi.profile.getAll()) as ApiResponse<Profile[]>;
      if (response.success && response.data) {
        setProfiles(response.data);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.userDataDir?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      selectedTags.length === 0 ||
      (profile.tags && profile.tags.some((tag) => selectedTags.includes(tag)));

    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(profiles.flatMap((p) => p.tags || [])));

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingProfile(null);
    
    modal.openModal({
      title: 'Create New Profile',
      icon: <User className="w-6 h-6 text-indigo-500" />,
      content: (
        <ProfileForm
          isEditMode={false}
          editingProfile={null}
          onSave={handleSaveProfile}
          onCancel={() => modal.closeModal()}
        />
      ),
      size: 'lg',
      closeOnEscape: true,
      closeOnOverlay: false,
    });
  };

  const handleEditProfile = (profile: Profile) => {
    setIsEditMode(true);
    setEditingProfile(profile);
    
    modal.openModal({
      title: 'Edit Profile',
      icon: <User className="w-6 h-6 text-indigo-500" />,
      content: (
        <ProfileForm
          isEditMode={true}
          editingProfile={profile}
          onSave={handleSaveProfile}
          onCancel={() => modal.closeModal()}
        />
      ),
      size: 'lg',
      closeOnEscape: true,
      closeOnOverlay: false,
    });
  };

  const handleSaveProfile = async (formData: ProfileFormData) => {
    try {
      if (isEditMode && editingProfile) {
        const response = (await electronApi.profile.update(editingProfile.id, {
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
          modal.closeModal();
        } else {
          alertApi.show({ message: `Failed to update profile: ${response.error}`, title: 'Profile Error' });
          throw new Error(response.error);
        }
      } else {
        const response = (await electronApi.profile.create({
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
          modal.closeModal();
        } else {
          alertApi.show({ message: `Failed to create profile: ${response.error}`, title: 'Profile Error' });
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!(await confirm({ message: "Are you sure you want to delete this profile?" }))) {
      return;
    }

    try {
      const response = (await electronApi.profile.delete(id)) as ApiResponse<boolean>;
      if (response.success) {
        await loadProfiles();
      } else {
        alertApi.show({ message: `Failed to delete profile: ${response.error}`, title: 'Profile Error' });
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alertApi.show({ message: `Failed to delete profile: ${error}`, title: 'Profile Error' });
    }
  };

  const handleLoginProfile = async (id: string) => {
    try {
      const response = (await electronApi.profile.login(id)) as ApiResponse<Profile>;
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
      </div>

      {/* Toolbar */}
      <ProfilesToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTags={selectedTags}
        toggleTagFilter={toggleTagFilter}
        allTags={allTags}
        columnVisibility={columnVisibility}
        toggleColumnVisibility={(c) => toggleColumnVisibility(c as keyof ColumnVisibility)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewProfile={handleOpenModal}
      />

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
    </div>
  );
}
