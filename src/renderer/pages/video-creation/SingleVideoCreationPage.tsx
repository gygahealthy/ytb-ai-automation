import { History, Plus, User, Video } from "lucide-react";
import { useEffect, useState } from "react";
import AddJsonModal from "../../components/video-creation/AddJsonModal";
import DraftManagerModal from "../../components/video-creation/DraftManagerModal";
import JobDetailsModal from "../../components/video-creation/JobDetailsModal";
import JsonToolbar from "../../components/video-creation/JsonToolbar";
import ProfileProjectModal from "../../components/video-creation/ProfileProjectModal";
import ProfileProjectSidebar from "../../components/video-creation/ProfileProjectSidebar";
import PromptRow from "../../components/video-creation/PromptRow";
import { useDrawer } from "../../contexts/DrawerContext";
import profileIPC from "../../ipc/profile";
import { useVideoCreationStore } from "../../store/video-creation.store";

export default function SingleVideoCreationPage() {
  const [showAddJsonModal, setShowAddJsonModal] = useState(false);
  const [showDraftManager, setShowDraftManager] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProfileName, setSelectedProfileName] = useState<string>("");

  const { openDrawer } = useDrawer();

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
    toggleGlobalPreview,
    setStatusFilter,
  } = useVideoCreationStore();

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
        } else if (e.key === "d") {
          e.preventDefault();
          handleOpenHistory();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleCreateVideo = (promptId: string, promptText: string) => {
    if (!promptText.trim()) return;

    // TODO: Call IPC handler to backend
    const jobId = createJob(promptId, promptText);
    console.log("Created job:", jobId, "for prompt:", promptText);

    // This will be replaced with actual IPC call:
    // window.electronAPI.createVideo({ promptId, promptText })
  };

  const handleAddJson = (jsonString: string) => {
    const success = loadFromJson(jsonString, "add");
    return success;
  };

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

  const handleProfileSelect = async (profileId: string, projectId?: string) => {
    setSelectedProfileId(profileId);
    setSelectedProjectId(projectId || "");

    // Fetch profile name from IPC
    try {
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        const profile = response.data.find((p: any) => p.id === profileId);
        if (profile) {
          setSelectedProfileName(profile.name);
          console.log(`[SingleVideoCreationPage] Selected profile: ${profile.name} (${profileId}), project: ${projectId}`);
        } else {
          setSelectedProfileName("Unknown Profile");
        }
      }
    } catch (error) {
      console.error("[SingleVideoCreationPage] Failed to fetch profile name", error);
      setSelectedProfileName("Profile " + profileId.substring(0, 8));
    }
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
              onClick={() => setShowProfileSidebar(!showProfileSidebar)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showProfileSidebar
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
              title="Toggle profile & project sidebar"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
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

      {/* Main Content with optional sidebar */}
      <div className="flex-1 flex overflow-hidden">
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
              selectedProfileName={selectedProfileName}
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
              onSelectProfile={() => setShowProfileModal(true)}
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
                  <PromptRow
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
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Profile & Project Sidebar */}
        <ProfileProjectSidebar
          isOpen={showProfileSidebar}
          onClose={() => setShowProfileSidebar(false)}
          selectedProfileId={selectedProfileId}
          selectedProjectId={selectedProjectId}
          onProfileChange={setSelectedProfileId}
          onProjectChange={setSelectedProjectId}
        />
      </div>

      {/* Modals */}
      <AddJsonModal isOpen={showAddJsonModal} onClose={() => setShowAddJsonModal(false)} onAdd={handleAddJson} />

      <ProfileProjectModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialProfileId={selectedProfileId}
        initialProjectId={selectedProjectId}
        onConfirm={handleProfileSelect}
      />

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
