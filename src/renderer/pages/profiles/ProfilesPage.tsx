import { Plus, Search, Tag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import ProfileForm, { ProfileFormData } from "@components/profiles/profile-page/ProfileForm";
import ProfilesTable from "@components/profiles/profile-page/ProfilesTable";
import ProfilesGrid from "@/renderer/components/profiles/profile-page/ProfilesGrid";
import ProfilesToolbar from "@components/profiles/profile-page/ProfilesToolbar";
import CookieModal from "@components/profiles/CookieModal";
import ChatModal from "@components/profiles/ChatModal";
import { useModal } from "@hooks/useModal";
import { useAlert } from "@hooks/useAlert";
import { useConfirm } from "@hooks/useConfirm";
import electronApi from "@renderer/ipc";

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
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieModalProfileId, setCookieModalProfileId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatModalProfileId, setChatModalProfileId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    id: false,
    name: true,
    browser: true,
    path: false,
    userAgent: false,
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

    const matchesTags = selectedTags.length === 0 || (profile.tags && profile.tags.some((tag) => selectedTags.includes(tag)));

    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(profiles.flatMap((p) => p.tags || [])));

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingProfile(null);

    modal.openModal({
      title: "Create New Profile",
      icon: <User className="w-6 h-6 text-indigo-500" />,
      content: (
        <ProfileForm isEditMode={false} editingProfile={null} onSave={handleSaveProfile} onCancel={() => modal.closeModal()} />
      ),
      size: "lg",
      closeOnEscape: true,
      closeOnOverlay: false,
    });
  };

  const handleEditProfile = (profile: Profile) => {
    setIsEditMode(true);
    setEditingProfile(profile);

    modal.openModal({
      title: "Edit Profile",
      icon: <User className="w-6 h-6 text-indigo-500" />,
      content: (
        <ProfileForm isEditMode={true} editingProfile={profile} onSave={handleSaveProfile} onCancel={() => modal.closeModal()} />
      ),
      size: "lg",
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
          alertApi.show({
            message: `Failed to update profile: ${response.error}`,
            title: "Profile Error",
          });
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
          alertApi.show({
            message: `Failed to create profile: ${response.error}`,
            title: "Profile Error",
          });
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (
      !(await confirm({
        message: "Are you sure you want to delete this profile?",
      }))
    ) {
      return;
    }

    try {
      const response = (await electronApi.profile.delete(id)) as ApiResponse<boolean>;
      if (response.success) {
        await loadProfiles();
      } else {
        alertApi.show({
          message: `Failed to delete profile: ${response.error}`,
          title: "Profile Error",
        });
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
      alertApi.show({
        message: `Failed to delete profile: ${error}`,
        title: "Profile Error",
      });
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleOpenCookieModal = (profileId: string) => {
    setCookieModalProfileId(profileId);
    setShowCookieModal(true);
  };

  const handleCloseCookieModal = () => {
    setShowCookieModal(false);
    setCookieModalProfileId(null);
  };

  const handleOpenChatModal = (profileId: string) => {
    setChatModalProfileId(profileId);
    setShowChatModal(true);
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setChatModalProfileId(null);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 lg:p-8 flex flex-col animate-fadeIn">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Profiles</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your browser profiles efficiently</p>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            New Profile
          </button>
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
      />

      {/* Active Filters Display */}
      {(searchQuery || selectedTags.length > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
          {searchQuery && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <Search className="w-3.5 h-3.5" />
              {searchQuery}
              <button
                onClick={() => setSearchQuery("")}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
            >
              <Tag className="w-3.5 h-3.5" />
              {tag}
              <button
                onClick={() => toggleTagFilter(tag)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-1 flex flex-col">
        {/* Table View */}
        {viewMode === "table" && (
          <ProfilesTable
            profiles={profiles}
            filteredProfiles={filteredProfiles}
            columnVisibility={columnVisibility}
            onEditProfile={handleEditProfile}
            onDeleteProfile={handleDeleteProfile}
            onOpenChatModal={handleOpenChatModal}
          />
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="p-6 h-full flex flex-col overflow-y-auto">
            <ProfilesGrid
              profiles={profiles}
              filteredProfiles={filteredProfiles}
              onEditProfile={handleEditProfile}
              onDeleteProfile={handleDeleteProfile}
              onOpenCookieModal={handleOpenCookieModal}
              onOpenChatModal={handleOpenChatModal}
            />
          </div>
        )}
      </div>

      {/* Cookie Management Modal */}
      <CookieModal isOpen={showCookieModal} profileId={cookieModalProfileId} onClose={handleCloseCookieModal} />

      {/* Chat Modal */}
      <ChatModal isOpen={showChatModal} profileId={chatModalProfileId} onClose={handleCloseChatModal} />
    </div>
  );
}
