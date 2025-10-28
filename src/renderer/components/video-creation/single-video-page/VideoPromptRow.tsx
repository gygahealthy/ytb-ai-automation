import { CheckCircle2, User } from "lucide-react";
import { useEffect, useState } from "react";
import profileIPC from "../../../ipc/profile";
import veo3IPC from "../../../ipc/veo3";
import useVeo3Store from "../../../store/veo3.store";
import { useVideoCreationStore } from "../../../store/video-creation.store";
import { Prompt, VideoCreationJob } from "../../../types/video-creation.types";
import PreviewPanel from "../../common/PreviewPanel";
import ActionControls from "../video-prompt-row/ActionControls";
import ProfilePanel from "../video-prompt-row/ProfilePanel";
import { useSingleGenerationPolling } from "../../../contexts/VideoGenerationPollingContext";

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

interface VideoPromptRowProps {
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
  onProjectChange: (id: string, projectId: string) => void;
}

export default function VideoPromptRow({
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
  onProjectChange,
}: VideoPromptRowProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const veo3Store = useVeo3Store();
  const { updateJobStatus } = useVideoCreationStore.getState();

  // Use centralized polling context - automatically registers/unregisters this generation
  const { generation: polledGeneration, progress: contextProgress } = useSingleGenerationPolling(job?.generationId);

  // Sync polled data back to job store when status changes
  useEffect(() => {
    if (!polledGeneration || !job) return;

    // Update job status in store when polled data changes
    if (polledGeneration.status === "completed" && job.status !== "completed") {
      console.log(`[VideoPromptRow] 📡 Generation ${polledGeneration.id} completed`);
      updateJobStatus(job.id, "completed", {
        videoUrl: polledGeneration.videoUrl,
        completedAt: new Date().toISOString(),
      });
    } else if (polledGeneration.status === "failed" && job.status !== "failed") {
      console.log(`[VideoPromptRow] 📡 Generation ${polledGeneration.id} failed`);
      updateJobStatus(job.id, "failed", {
        error: polledGeneration.errorMessage,
        completedAt: new Date().toISOString(),
      });
    }
  }, [polledGeneration?.status, polledGeneration?.videoUrl, polledGeneration?.errorMessage, job, updateJobStatus]);

  const isValid = prompt.text.trim().length > 0;
  // When globalPreviewMode is false (default), show all previews
  // When globalPreviewMode is true, hide all previews
  // Individual prompt.showPreview can override this behavior
  const showPreview = globalPreviewMode ? false : prompt.showPreview ?? true;

  const effectiveProfileId = prompt.profileId || globalProfileId;
  const hasCustomProfile = !!prompt.profileId;

  useEffect(() => {
    if (prompt.showProfileSelect) {
      fetchProfiles();
    }
  }, [prompt.showProfileSelect]);

  useEffect(() => {
    if (prompt.showProfileSelect && effectiveProfileId) {
      fetchProjects(effectiveProfileId);
    } else {
      setProjects([]);
    }
  }, [prompt.showProfileSelect, effectiveProfileId]);

  useEffect(() => {
    console.log(
      `[VideoPromptRow] 🔄 Effect triggered - job:`,
      job?.id,
      `generationId:`,
      job?.generationId,
      `status:`,
      job?.status,
      `contextProgress:`,
      contextProgress
    );

    // Progress is now handled by centralized VideoGenerationPollingContext
    // which automatically increments 1% per second during processing
  }, [job?.id, job?.generationId, job?.status, contextProgress]);

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
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string) => {
    setLoading(true);
    try {
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
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const rawStatus = job?.status ?? "new";
  const status = rawStatus === "idle" ? "new" : rawStatus;
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
          ? "bg-primary-50 dark:bg-slate-900/30 shadow-2xl -translate-y-1"
          : "bg-white dark:bg-slate-900 shadow-md -translate-y-0.5 hover:shadow-2xl hover:-translate-y-1.5"
      }`}
      style={{ height: "180px" }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${isArchived ? statusColor.archived : statusColor[status]}`}
        title={isArchived ? "Archived" : status}
        aria-hidden="true"
      />

      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
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

        {job && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      </div>

      <div className="flex-shrink-0 flex items-start pt-2">
        <input
          type="checkbox"
          checked={prompt.selected || false}
          onChange={() => onToggleSelect(prompt.id)}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
        />
      </div>

      <div className="flex-shrink-0 flex items-start pt-1">
        <div
          className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm border border-gray-200 dark:border-gray-700"
          aria-hidden
          style={{
            // ensure strong dark background and contrast for the index bubble
            backgroundColor: undefined,
          }}
        >
          <span className="dark:bg-slate-800 dark:text-gray-100 px-2 py-1 rounded-full">{index + 1}</span>
        </div>
      </div>

      {showPreview && (
        <div className="flex-shrink-0 w-64 h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50">
          <PreviewPanel job={job} pollingProgress={contextProgress} />
        </div>
      )}

      <ActionControls
        showPreview={showPreview}
        onTogglePreview={onTogglePreview}
        job={job}
        onShowInfo={onShowInfo}
        onCreate={onCreate}
        onDelete={onDelete}
        canDelete={canDelete}
        isValid={isValid}
        promptId={prompt.id}
        promptText={prompt.text}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {job && <div className="flex-shrink-0 mb-2">{getStatusBadge()}</div>}

        {job && job.status === "processing" && job.generationId && !showPreview && (
          <div className="flex-shrink-0 mb-2 animate-pulse">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${contextProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">🎬 Generating video...</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{contextProgress}%</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Auto-checking every 10 seconds</p>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <textarea
            value={prompt.text}
            onChange={(e) => onUpdate(prompt.id, e.target.value)}
            placeholder={`Enter prompt ${index + 1}...`}
            className={
              "w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm leading-relaxed caret-primary-600 selection:bg-primary-300 selection:text-white dark:selection:bg-primary-600 whitespace-pre-wrap"
            }
            style={{ minHeight: "100%" }}
          />
        </div>
      </div>

      <ProfilePanel
        prompt={prompt}
        effectiveProfileId={effectiveProfileId}
        loading={loading}
        setLoading={setLoading}
        profiles={profiles}
        setProfiles={setProfiles}
        projects={projects}
        setProjects={setProjects}
        onProfileChange={onProfileChange}
        onProjectChange={onProjectChange}
      />
    </div>
  );
}
