import { FolderKanban, History, Plus, User, Video } from "lucide-react";
import { useEffect, useState } from "react";
import AddJsonModal from "../../components/video-creation/AddJsonModal";
import DraftManagerModal from "../../components/video-creation/DraftManagerModal";
import JobDetailsModal from "../../components/video-creation/JobDetailsModal";
import JsonToolbar from "../../components/video-creation/JsonToolbar";
import VideoPromptRow from "../../components/video-creation/VideoPromptRow";
import { useDrawer } from "../../contexts/DrawerContext";
import { useAlert } from "../../hooks/useAlert";
import profileIPC from "../../ipc/profile";
import veo3IPC from "../../ipc/veo3";
import useVeo3Store from "../../store/veo3.store";
import { useVideoCreationStore } from "../../store/video-creation.store";

export default function SingleVideoCreationPage() {
  const [showAddJsonModal, setShowAddJsonModal] = useState(false);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { openDrawer, closeDrawer } = useDrawer();
  const veo3Store = useVeo3Store();
  const { show: showAlert } = useAlert();

  const {
    prompts,
    jobs,
    drafts,
    globalPreviewMode,
    statusFilter,
    addPrompt,
    removePrompt,
    updatePrompt,
    togglePromptSelection,
    togglePromptPreview,
    togglePromptProfileSelect,
    updatePromptProfile,
    updatePromptProject,
    toggleAllSelections,
    removeSelectedPrompts,
    clearAllPrompts,
    loadFromJson,
    undo,
    redo,
    canUndo,
    canRedo,
    saveDraft,
    loadDraft,
    deleteDraft,
    createJob,
    updateJobStatus,
    toggleGlobalPreview,
    setStatusFilter,
  } = useVideoCreationStore();

  // Ensure global previews are enabled by default when entering the single creation page
  useEffect(() => {
    // Ensure global preview mode is enabled. toggleGlobalPreview is a toggle (no args),
    // so call it only when the current mode is false.
    if (!globalPreviewMode) {
      try {
        toggleGlobalPreview();
      } catch (e) {
        // ignore; best-effort to enable previews
      }
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSelection = prompts.some((p) => p.selected);
  const allSelected = prompts.every((p) => p.selected);

  // Filter prompts based on status
  const filteredPrompts = prompts.filter((prompt) => {
    if (statusFilter === "all") return true;

    const job = jobs.find((j) => j.promptId === prompt.id);

    if (statusFilter === "idle") {
      return !job; // No job exists for this prompt
    }

    return job?.status === statusFilter;
  });

  // Listen for custom event to toggle profile drawer
  useEffect(() => {
    const handleToggleProfileDrawer = () => {
      handleOpenProfileDrawer();
    };

    window.addEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
    return () => window.removeEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
  }, [selectedProfileId, selectedProjectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleCreateVideo = async (promptId: string, promptText: string) => {
    if (!promptText.trim()) {
      alert("Prompt text cannot be empty");
      return;
    }

    // Get the prompt to determine which profile/project to use
    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt) {
      alert("Prompt not found");
      return;
    }

    // Determine effective profile and project
    const effectiveProfileId = prompt.profileId || selectedProfileId;
    const effectiveProjectId = prompt.projectId || selectedProjectId;

    if (!effectiveProfileId) {
      alert("Please select a profile first (use the Profile button or set per-row profile)");
      return;
    }

    if (!effectiveProjectId) {
      alert("Please select a project first (use the Profile button or set per-row project)");
      return;
    }

    // Create job in store with "processing" status
    const jobId = createJob(promptId, promptText);
    console.log(`[VideoCreation] Starting video generation for prompt: ${promptId}`);
    console.log(`[VideoCreation] Using profile: ${effectiveProfileId}, project: ${effectiveProjectId}`);

    try {
      // Call backend to start video generation
      const result = await veo3IPC.startVideoGeneration(
        effectiveProfileId,
        effectiveProjectId,
        promptText,
        "VIDEO_ASPECT_RATIO_LANDSCAPE" // Default aspect ratio, can be made configurable later
      );

      if (!result.success) {
        console.error("[VideoCreation] Failed to start video generation:", result.error);
        alert(`Failed to start video generation: ${result.error}`);
        // Update job status to failed using store method
        updateJobStatus(jobId, "failed", {
          error: result.error,
        });
        return;
      }

      const { generationId, sceneId, operationName } = result.data;
      console.log(`[VideoCreation] Video generation started: ${generationId}`);
      console.log(`[VideoCreation] Scene ID: ${sceneId}, Operation: ${operationName}`);

      // Update job to processing status and store generationId - use store method to trigger re-render
      updateJobStatus(jobId, "processing", {
        generationId: generationId,
        progress: 0,
      });

      console.log(
        `[VideoCreation] Job ${jobId} updated with generationId: ${generationId}. VideoPromptRow will now poll for status updates.`
      );
    } catch (error) {
      console.error("[VideoCreation] Error starting video generation:", error);
      alert(`Error: ${error}`);
      // Update job status to failed using store method
      updateJobStatus(jobId, "failed", {
        error: String(error),
      });
    }
  };

  const handleAddJson = (jsonString: string) => {
    const success = loadFromJson(jsonString, "add");
    return success;
  };

  // Register a profile drawer API that uses the real ProfileDrawerContent so shortcuts can open it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const api = (window as any).__veo3_drawer_api;
    (window as any).__veo3_profile_drawer_api = {
      toggle: () => {
        try {
          if (api && typeof api.toggle === "function") {
            api.toggle({
              title: "Profile & Project Selection",
              icon: <User className="w-5 h-5" />,
              children: <ProfileDrawerContent />,
            });
          } else {
            // fallback to dispatch event
            window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
          }
        } catch (err) {
          console.error("[Profile API] Failed to toggle profile drawer", err);
          window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
        }
      },
      isOpen: () => (api && typeof api.isOpen === "function" ? api.isOpen() : false),
    };

    return () => {
      try {
        delete (window as any).__veo3_profile_drawer_api;
      } catch (e) {
        /* ignore */
      }
    };
  }, [selectedProfileId, selectedProjectId]);

  const handleCreateMultiple = () => {
    const input = window.prompt("How many prompts would you like to create?", "5");
    if (!input) return;
    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    for (let i = 0; i < count; i++) {
      addPrompt();
    }
  };

  const handleSaveDraft = () => {
    setShowSaveDraftDialog(true);
  };

  const handleSaveDraftConfirm = () => {
    if (!draftName.trim()) {
      alert("Please enter a draft name");
      return;
    }
    saveDraft(draftName);
    setDraftName("");
    setShowSaveDraftDialog(false);
    alert("Draft saved successfully");
  };

  const handleExportJson = () => {
    const json = JSON.stringify(
      prompts.map((p) => ({ text: p.text, order: p.order })),
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(
      prompts.map((p) => ({ text: p.text, order: p.order })),
      null,
      2
    );
    navigator.clipboard.writeText(json);
    alert("JSON copied to clipboard");
  };

  const handleShowInfo = (promptId: string) => {
    const job = jobs.find((j) => j.promptId === promptId);
    if (job) {
      setSelectedJobId(job.id);
    }
  };

  const handleShowInFolder = (path: string) => {
    // TODO: Implement with IPC
    console.log("Show in folder:", path);
    alert("This will open the folder in your OS explorer");
  };

  const handleDownload = (url: string) => {
    // TODO: Implement download
    console.log("Download:", url);
    alert("Download functionality will be implemented");
  };

  const handleOpenHistory = () => {
    openDrawer({
      title: "Creation History",
      icon: <History className="w-5 h-5" />,
      children: (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No videos created yet</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJobId(job.id);
                }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary-500" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Video Job</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : job.status === "processing"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : job.status === "failed"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{job.promptText}</p>

                {job.status === "processing" && job.progress !== undefined && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{job.progress}% complete</p>
                  </div>
                )}

                {job.error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{job.error}</p>}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(job.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      ),
    });
  };

  const handleOpenProfileDrawer = () => {
    openDrawer({
      title: "Profile & Project Selection",
      icon: <User className="w-5 h-5" />,
      children: <ProfileDrawerContent />,
    });
  };

  const ProfileDrawerContent = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [localProfileId, setLocalProfileId] = useState(selectedProfileId);
    const [localProjectId, setLocalProjectId] = useState(selectedProjectId);
    const [loading, setLoading] = useState(false);

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

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const response = await profileIPC.getAll();
        if (response.success && response.data) {
          setProfiles(response.data);
        }
      } catch (error) {
        console.error("[ProfileDrawer] Failed to fetch profiles", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProjects = async (profileId: string) => {
      setLoading(true);
      try {
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
        } else {
          // Show error alert to user
          const errorMsg = response?.error || "Unknown error";
          console.error("[ProfileDrawer] Failed to fetch projects:", errorMsg);

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
        console.error("[ProfileDrawer] Failed to fetch projects", error);
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

    const handleApply = () => {
      setSelectedProfileId(localProfileId);
      setSelectedProjectId(localProjectId);
      closeDrawer();
    };

    return (
      <div className="space-y-6">
        {/* Profile Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4" />
            <span>Select Profile</span>
          </label>
          <select
            value={localProfileId}
            onChange={(e) => setLocalProfileId(e.target.value)}
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

        {/* Project Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FolderKanban className="w-4 h-4" />
            <span>Select Project</span>
          </label>
          <select
            value={localProjectId}
            onChange={(e) => setLocalProjectId(e.target.value)}
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
          {!localProfileId && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select a profile first</p>}
        </div>

        {/* Info Box */}
        {localProfileId && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              This profile and project will be used globally for all video creation unless overridden per-row.
            </p>
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
        >
          Apply Selection
        </button>
      </div>
    );
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Single Video Creation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create videos using single or multiple prompts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenProfileDrawer}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                selectedProfileId
                  ? "bg-primary-50 text-primary-700 border-primary-200"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}
              title="Select profile & project (Ctrl+F)"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={handleOpenHistory}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              <span>History ({jobs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="mb-4">
          <JsonToolbar
            canUndo={canUndo()}
            canRedo={canRedo()}
            hasSelection={hasSelection}
            allSelected={allSelected}
            globalPreviewMode={globalPreviewMode}
            statusFilter={statusFilter}
            onUndo={undo}
            onRedo={redo}
            onAddJson={() => setShowAddJsonModal(true)}
            onToggleSelectAll={toggleAllSelections}
            onRemoveSelected={removeSelectedPrompts}
            onClearAll={clearAllPrompts}
            onSaveDraft={handleSaveDraft}
            onLoadDraft={() => setShowDraftManager(true)}
            onExportJson={handleExportJson}
            onCopyJson={handleCopyJson}
            onToggleGlobalPreview={toggleGlobalPreview}
            onStatusFilterChange={setStatusFilter}
            onCreateMultiple={handleCreateMultiple}
          />
        </div>

        {/* Add Prompt Button */}
        <div className="mb-4">
          <button
            onClick={addPrompt}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Prompt</span>
          </button>
        </div>

        {/* Prompts List */}
        <div className="space-y-3">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No prompts match the current filter</p>
            </div>
          ) : (
            filteredPrompts.map((prompt, index) => {
              const job = jobs.find((j) => j.promptId === prompt.id);
              return (
                <VideoPromptRow
                  key={prompt.id}
                  prompt={prompt}
                  index={index}
                  canDelete={prompts.length > 1}
                  globalPreviewMode={globalPreviewMode}
                  globalProfileId={selectedProfileId}
                  job={job}
                  onUpdate={updatePrompt}
                  onDelete={removePrompt}
                  onToggleSelect={togglePromptSelection}
                  onTogglePreview={togglePromptPreview}
                  onCreate={handleCreateVideo}
                  onShowInfo={handleShowInfo}
                  onToggleProfileSelect={togglePromptProfileSelect}
                  onProfileChange={updatePromptProfile}
                  onProjectChange={updatePromptProject}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <AddJsonModal isOpen={showAddJsonModal} onClose={() => setShowAddJsonModal(false)} onAdd={handleAddJson} />

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJobId(null)}
        onShowInFolder={handleShowInFolder}
        onDownload={handleDownload}
      />

      <DraftManagerModal
        isOpen={showDraftManager}
        drafts={drafts}
        onClose={() => setShowDraftManager(false)}
        onLoad={loadDraft}
        onDelete={deleteDraft}
      />

      {/* Save Draft Dialog */}
      {showSaveDraftDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Save Draft</h3>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter draft name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveDraftConfirm();
                }
              }}
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveDraftDialog(false);
                  setDraftName("");
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraftConfirm}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
