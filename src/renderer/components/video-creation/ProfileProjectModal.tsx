import { Check, FolderKanban, User, X } from "lucide-react";
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

interface ProfileProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfileId?: string;
  initialProjectId?: string;
  onConfirm: (profileId: string, projectId?: string) => void;
}

export default function ProfileProjectModal({
  isOpen,
  onClose,
  initialProfileId,
  initialProjectId,
  onConfirm,
}: ProfileProjectModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId || "");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      setSelectedProfileId(initialProfileId || "");
      setSelectedProjectId(initialProjectId || "");
    }
  }, [isOpen, initialProfileId, initialProjectId]);

  useEffect(() => {
    if (selectedProfileId) {
      fetchProjects(selectedProfileId);
    } else {
      setProjects([]);
      setSelectedProjectId("");
    }
  }, [selectedProfileId]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      console.log("[ProfileProjectModal] Fetching profiles...");
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        console.error("[ProfileProjectModal] Failed to fetch profiles:", response.error);
        setProfiles([]);
      }
    } catch (error) {
      console.error("[ProfileProjectModal] Failed to fetch profiles", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string) => {
    setLoading(true);
    try {
      // TODO: Call IPC to get projects for profile
      console.log(`[ProfileProjectModal] Fetching projects for profile: ${profileId}`);
      // Mock data for now
      setProjects([]);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedProfileId) {
      alert("Please select a profile");
      return;
    }
    onConfirm(selectedProfileId, selectedProjectId || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Profile & Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
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
                No profiles found. Create a profile in the Profiles page first.
              </p>
            )}
          </div>

          {/* Project Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FolderKanban className="w-4 h-4" />
              <span>Project (Optional)</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={!selectedProfileId || loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">-- No Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {!selectedProfileId && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select a profile first.</p>}
            {selectedProfileId && projects.length === 0 && !loading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                No projects available. Projects will be added in future updates.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProfileId}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
