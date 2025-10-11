import { Archive, CheckCircle2, Eye, EyeOff, Info, Play, User, Video } from "lucide-react";
import { useEffect, useState } from "react";
import profileIPC from "../../ipc/profile";
import veo3IPC from "../../ipc/veo3";
import useVeo3Store from "../../store/veo3.store";
import { Prompt, VideoCreationJob } from "../../types/video-creation.types";

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

interface PromptRowProps {
  prompt: Prompt;
  index: number;
  canDelete: boolean;
  globalPreviewMode: boolean;
  globalProfileId?: string;
  job?: VideoCreationJob;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onTogglePreview: (id: string) => void;
  onCreate: (id: string, text: string) => void;
  onShowInfo: (id: string) => void;
  onToggleProfileSelect: (id: string) => void;
  onProfileChange: (id: string, profileId: string) => void;
}

export default function PromptRow({
  prompt,
  index,
  canDelete,
  globalPreviewMode,
  globalProfileId,
  job,
  onUpdate,
  onDelete,
  onToggleSelect,
  onTogglePreview,
  onCreate,
  onShowInfo,
  onToggleProfileSelect,
  onProfileChange,
}: PromptRowProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const veo3Store = useVeo3Store();

  const isValid = prompt.text.trim().length > 0;
  // Per-row preview: independent toggle even in global mode
  // If global mode is on, individual row can still hide its preview
  const showPreview = globalPreviewMode ? !prompt.showPreview : prompt.showPreview || false;

  // Determine which profile to use: row-specific or global
  const effectiveProfileId = prompt.profileId || globalProfileId;
  const hasCustomProfile = !!prompt.profileId;

  // Fetch profiles when profile select is shown
  useEffect(() => {
    if (prompt.showProfileSelect) {
      fetchProfiles();
    }
  }, [prompt.showProfileSelect]);

  // Fetch projects when profile changes
  useEffect(() => {
    if (prompt.showProfileSelect && effectiveProfileId) {
      fetchProjects(effectiveProfileId);
    } else {
      setProjects([]);
    }
  }, [prompt.showProfileSelect, effectiveProfileId]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      console.log("[PromptRow] Fetching profiles...");
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        console.error("[PromptRow] Failed to fetch profiles:", response.error);
        setProfiles([]);
      }
    } catch (error) {
      console.error("[PromptRow] Failed to fetch profiles", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string) => {
    setLoading(true);
    try {
      console.log(`[PromptRow] Fetching projects for profile: ${profileId}`);
      // Check cache first
      const cached = veo3Store.getProjectsForProfile(profileId);
      if (cached) {
        const transformedProjects = cached.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformedProjects);
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await veo3IPC.fetchProjectsFromAPI(profileId);
      if (response && response.success) {
        const projectsArr = Array.isArray(response.data) ? response.data : response.data?.projects || [];
        veo3Store.setProjectsForProfile(profileId, projectsArr);
        const transformedProjects = projectsArr.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformedProjects);
      }
    } catch (error) {
      console.error("[PromptRow] Failed to fetch projects", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Determine row status for the left-edge indicator
  // If there's a job, use its status. Map 'idle' to 'new'. Otherwise treat as 'new'.
  const rawStatus = job?.status ?? "new";
  const status = rawStatus === "idle" ? "new" : rawStatus;

  // Support an optional `archived` flag on Prompt; the shared type doesn't include it so access safely
  const isArchived = (prompt as any)?.archived === true;

  const statusColor: Record<string, string> = {
    new: "bg-gray-300 dark:bg-gray-600",
    processing: "bg-blue-400 dark:bg-blue-700",
    completed: "bg-green-400 dark:bg-green-700",
    failed: "bg-red-400 dark:bg-red-700",
    archived: "bg-gray-200 dark:bg-gray-800",
  };

  const getStatusBadge = () => {
    if (!job) return null;
    const statusConfig: Record<string, { label: string; color: string }> = {
      completed: { label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      processing: { label: "Processing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      failed: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
      idle: { label: "Idle", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
    };
    const config = statusConfig[job.status] || statusConfig.idle;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-lg transition-transform transform will-change-transform ${
        prompt.selected
          ? "bg-primary-50 dark:bg-primary-900/20 shadow-2xl -translate-y-1"
          : "bg-white dark:bg-gray-800 shadow-md -translate-y-0.5 hover:shadow-2xl hover:-translate-y-1.5"
      }`}
      style={{ height: "180px" }}
    >
      {/* Left-edge status indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${isArchived ? statusColor.archived : statusColor[status]}`}
        title={isArchived ? "Archived" : status}
        aria-hidden="true"
      />
      {/* Top Right Icons */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Profile Toggle Button */}
        <button
          onClick={() => onToggleProfileSelect(prompt.id)}
          className={`p-1.5 rounded-md transition-all shadow-sm ${
            prompt.showProfileSelect || hasCustomProfile
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
          }`}
          title={hasCustomProfile ? "Custom profile set" : "Select profile for this video"}
        >
          <User className="w-4 h-4" />
        </button>

        {/* Video Created Indicator */}
        {job && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      </div>
      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-start pt-2">
        <input
          type="checkbox"
          checked={prompt.selected || false}
          onChange={() => onToggleSelect(prompt.id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
        />
      </div>

      {/* Index */}
      <div className="flex-shrink-0 flex items-start pt-1">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm">
          {index + 1}
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="flex-shrink-0 w-64 h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50">
          {job?.videoUrl ? (
            <video src={job.videoUrl} className="w-full h-full object-contain" controls />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Video className="w-12 h-12 text-gray-400" />
              <span className="text-xs text-gray-400">No video yet</span>
            </div>
          )}
        </div>
      )}

      {/* Vertical Action Buttons - Organized by function groups */}
      <div className="flex-shrink-0 flex flex-col gap-1 items-center justify-center py-2 px-1 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* View Controls Group */}
        <div className="flex flex-col gap-1 pb-1 mb-1 border-b border-gray-300 dark:border-gray-600">
          {/* Preview Toggle Button */}
          <button
            onClick={() => onTogglePreview(prompt.id)}
            className={`p-2 rounded-md transition-all shadow-sm ${
              showPreview
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            }`}
            title={
              globalPreviewMode
                ? showPreview
                  ? "Hide this preview"
                  : "Show this preview"
                : showPreview
                ? "Hide preview"
                : "Show preview"
            }
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Info Button */}
          <button
            onClick={() => job && onShowInfo(job.id)}
            disabled={!job}
            className={`p-2 rounded-md transition-all shadow-sm ${
              job
                ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
            }`}
            title={job ? "View job details" : "No video created yet"}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-col gap-1">
          {/* Create Button */}
          <button
            onClick={() => onCreate(prompt.id, prompt.text)}
            disabled={!isValid}
            className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500"
            title="Create video from this prompt"
          >
            <Play className="w-4 h-4" />
          </button>

          {/* Archive/Delete Button */}
          {canDelete && (
            <button
              onClick={() => onDelete(prompt.id)}
              className="p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all shadow-sm border border-gray-200 dark:border-gray-600"
              title="Delete this prompt"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Prompt Text - Takes remaining space and full height */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Status Badge at top */}
        {job && <div className="flex-shrink-0 mb-2">{getStatusBadge()}</div>}

        {/* Prompt Input - Takes all remaining height */}
        <div className="flex-1 overflow-hidden">
          <textarea
            value={prompt.text}
            onChange={(e) => onUpdate(prompt.id, e.target.value)}
            placeholder={`Enter prompt ${index + 1}...`}
            className="w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            style={{ minHeight: "100%" }}
          />
        </div>

        {/* Progress Bar - Only visible when processing */}
        {job?.status === "processing" && job.progress !== undefined && (
          <div className="flex-shrink-0 w-full mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{job.progress}%</p>
          </div>
        )}
      </div>

      {/* Profile Selection Panel - 1/3 width, slides in from right */}
      {prompt.showProfileSelect && (
        <div className="flex-shrink-0 w-1/3 h-full border-l border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg flex flex-col p-3">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Profile & Project</h4>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Compact Profile + Project Row */}
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
                    {profiles.map((profile) => (
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
                    onChange={(e) => {
                      const projectId = e.target.value;
                      // update store per-row
                      try {
                        // import action at runtime
                        const store = require("../../store/video-creation.store").useVideoCreationStore;
                        store.getState().updatePromptProject(prompt.id, projectId);
                      } catch (err) {
                        console.error("Failed to update prompt project", err);
                      }
                    }}
                    disabled={!effectiveProfileId || loading || projects.length === 0}
                    className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    title="Select project (per-row)"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Info Box */}
            {hasCustomProfile ? (
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

            {/* Clear Custom Profile */}
            {hasCustomProfile && (
              <button
                onClick={() => onProfileChange(prompt.id, "")}
                className="w-full px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Clear Custom Profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
