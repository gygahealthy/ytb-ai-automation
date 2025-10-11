import { ChevronRight, FolderKanban, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import profileIPC from "../../ipc/profile";

interface Profile {
  id: string;
  name: string;
  isLoggedIn?: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProfileProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfileId?: string;
  selectedProjectId?: string;
  onProfileChange: (profileId: string) => void;
  onProjectChange: (projectId: string) => void;
}

export default function ProfileProjectSidebar({
  isOpen,
  onClose,
  selectedProfileId,
  selectedProjectId,
  onProfileChange,
  onProjectChange,
}: ProfileProjectSidebarProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Fetch projects when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      fetchProjects(selectedProfileId);
    } else {
      setProjects([]);
    }
  }, [selectedProfileId]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      console.log("[ProfileProjectSidebar] Fetching profiles...");
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        console.error("[ProfileProjectSidebar] Failed to fetch profiles:", response.error);
        setProfiles([]);
      }
    } catch (error) {
      console.error("[ProfileProjectSidebar] Failed to fetch profiles", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string) => {
    setLoading(true);
    try {
      // TODO: Call IPC to get projects for profile
      console.log(`[ProfileProjectSidebar] Fetching projects for profile: ${profileId}`);
      // Mock data for now - will be implemented later
      setProjects([]);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-1/3 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile & Project</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4" />
            <span>Select Profile</span>
          </label>
          <select
            value={selectedProfileId || ""}
            onChange={(e) => onProfileChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Select Profile --</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} {profile.isLoggedIn ? "✓" : ""}
              </option>
            ))}
          </select>
          {profiles.length === 0 && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              No profiles found. Create a profile in the Profiles page.
            </p>
          )}
        </div>

        {/* Project Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FolderKanban className="w-4 h-4" />
            <span>Select Project</span>
          </label>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={!selectedProfileId || loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Select Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!selectedProfileId && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select a profile first to see available projects.</p>
          )}
          {selectedProfileId && projects.length === 0 && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              No projects found for this profile. Projects will be added in future updates.
            </p>
          )}
        </div>

        {/* Info Box */}
        {selectedProfileId && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Profile Selected</p>
                <p className="text-blue-800 dark:text-blue-200 text-xs">
                  Videos will be created using the selected profile's browser session and settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
