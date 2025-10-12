import { Check, FolderKanban, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAlert } from "../../hooks/useAlert";
import profileIPC from "../../ipc/profile";
import veo3IPC from "../../ipc/veo3";
import useVeo3Store from "../../store/veo3.store";

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
  const { show: showAlert } = useAlert();

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
      console.log(`[ProfileProjectModal] Fetching projects for profile: ${profileId}`);

      // Try cached projects first
      const cached = useVeo3Store.getState().getProjectsForProfile(profileId);
      if (cached) {
        console.log(`[ProfileProjectModal] Using cached projects for profile: ${profileId}`);
        const transformedProjects = cached.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformedProjects);
        setLoading(false);
        return;
      }

      const response = await veo3IPC.fetchProjectsFromAPI(profileId);
      if (response && response.success) {
        const projectsArr = Array.isArray(response.data)
          ? response.data
          : response.data?.projects || response.data?.result?.projects || [];
        // Cache
        useVeo3Store.getState().setProjectsForProfile(profileId, projectsArr);

        const transformedProjects = projectsArr.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformedProjects);
      } else {
        const errorMsg = response?.error || "Unknown error";
        console.error("[ProfileProjectModal] Failed to fetch projects:", errorMsg);
        setProjects([]);

        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          showAlert({
            title: "Authentication Failed",
            message: "Your session has expired or you are not logged in. Please log in to the profile again to fetch projects.",
            severity: "error",
            duration: null,
          });
        } else if (errorMsg.includes("cookies") || errorMsg.includes("expired")) {
          showAlert({
            title: "Session Expired",
            message: errorMsg,
            severity: "warning",
            duration: null,
          });
        } else {
          showAlert({
            title: "Failed to Fetch Projects",
            message: errorMsg,
            severity: "error",
            duration: null,
          });
        }
      }
    } catch (error) {
      console.error("[ProfileProjectModal] Failed to fetch projects", error);
      setProjects([]);
      showAlert({
        title: "Error",
        message: `Failed to fetch projects: ${String(error)}`,
        severity: "error",
        duration: null,
      });
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
