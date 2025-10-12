import { User } from "lucide-react";
import { useEffect } from "react";
import { useAlert } from "../../../hooks/useAlert";
import profileIPC from "../../../ipc/profile";
import veo3IPC from "../../../ipc/veo3";
import useVeo3Store from "../../../store/veo3.store";

export default function ProfilePanel({
  prompt,
  effectiveProfileId,
  loading,
  setLoading,
  profiles,
  setProfiles,
  projects,
  setProjects,
  onProfileChange,
  onProjectChange,
}: any) {
  const { show: showAlert } = useAlert();
  // Fetch profiles when opened
  useEffect(() => {
    if (prompt.showProfileSelect && profiles.length === 0) {
      (async () => {
        setLoading(true);
        try {
          const response = await profileIPC.getAll();
          if (response.success && response.data) {
            setProfiles(response.data);
          } else {
            setProfiles([]);
          }
        } catch (err) {
          setProfiles([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [prompt.showProfileSelect]);

  useEffect(() => {
    if (prompt.showProfileSelect && effectiveProfileId) {
      (async () => {
        setLoading(true);
        try {
          const cached = useVeo3Store.getState().getProjectsForProfile(effectiveProfileId);
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

          const response = await veo3IPC.fetchProjectsFromAPI(effectiveProfileId);
          if (response && response.success) {
            const arr = Array.isArray(response.data) ? response.data : response.data?.projects || [];
            useVeo3Store.getState().setProjectsForProfile(effectiveProfileId, arr);
            const transformed = arr.map((p: any) => ({
              id: p.projectId || p.id,
              name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
              description: p.description || "",
            }));
            setProjects(transformed);
          } else {
            const errorMsg = response?.error || "Unknown error";
            console.error("[ProfilePanel] Failed to fetch projects:", errorMsg);
            setProjects([]);

            if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
              showAlert({
                title: "Authentication Failed",
                message:
                  "Your session has expired or you are not logged in. Please log in to the profile again to fetch projects.",
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
        } catch (err) {
          console.error("[ProfilePanel] Failed to fetch projects", err);
          setProjects([]);
          showAlert({
            title: "Error",
            message: `Failed to fetch projects: ${String(err)}`,
            severity: "error",
            duration: null,
          });
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setProjects([]);
    }
  }, [prompt.showProfileSelect, effectiveProfileId, showAlert]);

  if (!prompt.showProfileSelect) return null;

  return (
    <div className="flex-shrink-0 w-1/3 h-full border-l border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg flex flex-col p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Profile & Project</h4>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="relative">
              <select
                value={prompt.profileId || ""}
                onChange={(e) => onProfileChange(prompt.id, e.target.value)}
                disabled={loading}
                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                title="Select profile (per-row)"
              >
                <option value="">Use Global Profile</option>
                {profiles.map((profile: any) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{loading ? "..." : ""}</div>
            </div>
          </div>

          <div className="w-1/2">
            <div className="relative">
              <select
                value={prompt.projectId || ""}
                onChange={(e) => onProjectChange(prompt.id, e.target.value)}
                disabled={!effectiveProfileId || loading || projects.length === 0}
                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                title="Select project (per-row)"
              >
                <option value="">Use Global Project</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {prompt.profileId ? (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-200">✓ Custom profile set for this video</p>
          </div>
        ) : effectiveProfileId ? (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">Using global profile</p>
          </div>
        ) : (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">⚠ No profile selected. Use Ctrl+F</p>
          </div>
        )}

        {prompt.profileId && (
          <button
            onClick={() => onProfileChange(prompt.id, "")}
            className="w-full px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
          >
            Clear Custom Profile
          </button>
        )}
      </div>
    </div>
  );
}
