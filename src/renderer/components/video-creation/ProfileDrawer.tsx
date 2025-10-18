import { FolderKanban, LogIn, User } from "lucide-react";
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
  const [loggingIn, setLoggingIn] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authErrorProfileId, setAuthErrorProfileId] = useState<string | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>("");
  const { show: showAlert } = useAlert();

  useEffect(() => {
    fetchProfiles();
     
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

  const handleLogin = async () => {
    if (!authErrorProfileId) return;

    setLoggingIn(true);
    try {
      console.log(`[ProfileDrawer] Starting login for profile: ${authErrorProfileId}`);
      const result = await profileIPC.login(authErrorProfileId);

      if (result.success) {
        showAlert({
          title: "Login Successful",
          message: "You have successfully logged in. Fetching projects...",
          severity: "success",
          duration: 3000,
        });

        // Close auth dialog
        setShowAuthDialog(false);
        setAuthErrorProfileId(null);

        // Refresh profiles to update login status
        await fetchProfiles();

        // Retry fetching projects
        if (authErrorProfileId) {
          await fetchProjects(authErrorProfileId);
        }
      } else {
        showAlert({
          title: "Login Failed",
          message: result.error || "Failed to login. Please try again.",
          severity: "error",
          duration: null,
        });
      }
    } catch (error) {
      console.error("[ProfileDrawer] Login error:", error);
      showAlert({
        title: "Login Error",
        message: `An error occurred: ${String(error)}`,
        severity: "error",
        duration: null,
      });
    } finally {
      setLoggingIn(false);
    }
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
        
        // Check if it's an authentication error
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("cookies") || errorMsg.includes("expired")) {
          console.log(`[ProfileDrawer] Authentication error detected for profile: ${profileId}`);
          setAuthErrorProfileId(profileId);
          setAuthErrorMessage(errorMsg);
          setShowAuthDialog(true);
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
    <>
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

      {/* Authentication Failed Dialog */}
      {showAuthDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Failed</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Your session has expired or you are not logged in. Please log in to the profile again to fetch projects.
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{authErrorMessage}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAuthDialog(false);
                  setAuthErrorProfileId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                disabled={loggingIn}
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
