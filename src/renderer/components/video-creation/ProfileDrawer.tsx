import { FolderKanban, User } from "lucide-react";
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

interface ProfileDrawerProps {
  initialProfileId?: string | null;
  initialProjectId?: string | null;
  onApply: (profileId?: string | null, projectId?: string | null) => void;
  onClose?: () => void;
}

export default function ProfileDrawer({ initialProfileId, initialProjectId, onApply, onClose }: ProfileDrawerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [localProfileId, setLocalProfileId] = useState<string | null | undefined>(initialProfileId);
  const [localProjectId, setLocalProjectId] = useState<string | null | undefined>(initialProjectId);
  const [loading, setLoading] = useState(false);
  const { show: showAlert } = useAlert();

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (localProfileId) {
      fetchProjects(localProfileId);
    } else {
      setProjects([]);
    }
  }, [localProfileId]);

  const handleProfileSelect = async (profileId: string) => {
    setLocalProfileId(profileId || null);
    if (!profileId) {
      setProjects([]);
      return;
    }
    await fetchProjects(profileId);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error("[ProfileDrawer] Failed to fetch profiles", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string) => {
    setLoading(true);
    try {
      const cached = useVeo3Store.getState().getProjectsForProfile(profileId);
      if (cached) {
        const transformed = cached.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformed);
        setLoading(false);
        return;
      }

      const response = await veo3IPC.fetchProjectsFromAPI(profileId);
      if (response && response.success) {
        const projectsArr = Array.isArray(response.data)
          ? response.data
          : response.data?.projects || response.data?.result?.projects || [];
        useVeo3Store.getState().setProjectsForProfile(profileId, projectsArr);
        const transformed = projectsArr.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformed);
      } else {
        const errorMsg = response?.error || "Unknown error";
        setProjects([]);
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
          showAlert({
            title: "Authentication Failed",
            message: "Your session has expired or you are not logged in. Please log in to the profile again to fetch projects.",
            severity: "error",
            duration: null,
          });
        } else if (errorMsg.includes("cookies") || errorMsg.includes("expired")) {
          showAlert({ title: "Session Expired", message: errorMsg, severity: "warning", duration: null });
        } else {
          showAlert({ title: "Failed to Fetch Projects", message: errorMsg, severity: "error", duration: null });
        }
      }
    } catch (error) {
      console.error("[ProfileDrawer] Failed to fetch projects", error);
      showAlert({ title: "Error", message: `Failed to fetch projects: ${String(error)}`, severity: "error", duration: null });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(localProfileId ?? null, localProjectId ?? null);
    if (onClose) onClose();
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <User className="w-4 h-4" />
          <span>Select Profile</span>
        </label>
        <select
          value={localProfileId ?? ""}
          onChange={(e) => void handleProfileSelect(e.target.value)}
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
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FolderKanban className="w-4 h-4" />
          <span>Select Project</span>
        </label>
        <select
          value={localProjectId ?? ""}
          onChange={(e) => setLocalProjectId(e.target.value || null)}
          disabled={!localProfileId || loading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="">-- Select Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {localProfileId && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This profile and project will be used globally for all video creation unless overridden per-row.
          </p>
        </div>
      )}

      <button
        onClick={handleApply}
        className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
      >
        Apply Selection
      </button>
    </div>
  );
}
