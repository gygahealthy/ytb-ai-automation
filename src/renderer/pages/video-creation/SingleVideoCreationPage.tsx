import { useEffect, useState } from "react";
import { History, User, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useDefaultProfileStore } from "@store/default-profile.store";
import { useToast } from "@hooks/useToast";
import { useAlert } from "@hooks/useAlert";
import AppAlert from "@components/common/AppAlert";
import AddJsonModal from "@/renderer/components/video-creation/single-video-page/AddJsonModal";
import JobDetailsModal from "@/renderer/components/video-creation/single-video-page/JobDetailsModal";
import JsonToolbar from "@/renderer/components/video-creation/single-video-page/JsonToolbar";
import VideoPromptRow from "@/renderer/components/video-creation/single-video-page/VideoPromptRow";
import VideoCreationModeTabs, {
  VideoCreationMode,
} from "@/renderer/components/video-creation/single-video-page/VideoCreationModeTabs";
import { useVideoGeneration } from "@hooks/video-creation/useVideoGeneration";
import { useVideoDownload } from "@hooks/video-creation/useVideoDownload";
import { useVideoFilters } from "@hooks/video-creation/useVideoFilters";
import { useVideoCreationUI } from "@hooks/video-creation/useVideoCreationUI";
import { exportPromptsToJson, copyPromptsToClipboard } from "@/renderer/utils/video-creation/jsonUtils";

export default function SingleVideoCreationPage() {
  const [creationMode, setCreationMode] = useState<VideoCreationMode>("text-to-video");
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });

  const navigate = useNavigate();

  // Handle mode change - navigate to studio if video-studio mode is selected
  const handleModeChange = (mode: VideoCreationMode) => {
    if (mode === "video-studio") {
      navigate("/video-creation/studio");
    } else {
      setCreationMode(mode);
    }
  };
  const toast = useToast();
  const alert = useAlert();

  // Subscribe to default profile store
  const geminiProfileId = useDefaultProfileStore((s) => s.geminiProfileId);
  const flowProfileId = useDefaultProfileStore((s) => s.flowProfileId);

  // Determine if we have a default profile set (prioritize gemini, then flow)
  const hasDefaultProfile = !!(geminiProfileId || flowProfileId);

  // Custom hooks for extracted logic
  const { handleCreateVideo, handleCreateMultiple } = useVideoGeneration();
  const { handleDownloadSelected } = useVideoDownload();
  const { filteredPrompts } = useVideoFilters();
  const {
    showAddJsonModal,
    setShowAddJsonModal,
    selectedJobId,
    setSelectedJobId,
    selectedProfileId,
    selectedProjectId,
    handleOpenProfileDrawer,
    handleOpenImageGallery,
  } = useVideoCreationUI();

  // Subscribe to specific store values
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);
  const globalPreviewMode = useVideoCreationStore((state) => state.globalPreviewMode);
  const statusFilter = useVideoCreationStore((state) => state.statusFilter);
  const sortBy = useVideoCreationStore((state) => state.sortBy);

  // Actions
  const addPrompt = useVideoCreationStore((state) => state.addPrompt);
  const removePrompt = useVideoCreationStore((state) => state.removePrompt);
  const updatePrompt = useVideoCreationStore((state) => state.updatePrompt);
  const togglePromptSelection = useVideoCreationStore((state) => state.togglePromptSelection);
  const togglePromptPreview = useVideoCreationStore((state) => state.togglePromptPreview);
  const togglePromptProfileSelect = useVideoCreationStore((state) => state.togglePromptProfileSelect);
  const updatePromptProfile = useVideoCreationStore((state) => state.updatePromptProfile);
  const updatePromptProject = useVideoCreationStore((state) => state.updatePromptProject);
  const loadFromJson = useVideoCreationStore((state) => state.loadFromJson);
  const undo = useVideoCreationStore((state) => state.undo);
  const redo = useVideoCreationStore((state) => state.redo);
  const canUndo = useVideoCreationStore((state) => state.canUndo);
  const canRedo = useVideoCreationStore((state) => state.canRedo);
  const clearAllPrompts = useVideoCreationStore((state) => state.clearAllPrompts);
  const toggleGlobalPreview = useVideoCreationStore((state) => state.toggleGlobalPreview);
  const setStatusFilter = useVideoCreationStore((state) => state.setStatusFilter);
  const setSortBy = useVideoCreationStore((state) => state.setSortBy);

  // Ensure global previews are enabled by default
  useEffect(() => {
    if (!globalPreviewMode) {
      try {
        toggleGlobalPreview();
      } catch (e) {
        // ignore; best-effort to enable previews
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for keyboard shortcut to cycle video creation mode
  useEffect(() => {
    const handleCycleMode = () => {
      // Only cycle between text-to-video and ingredients (exclude video-studio)
      const modes: VideoCreationMode[] = ["text-to-video", "ingredients"];
      const currentIndex = modes.indexOf(creationMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      handleModeChange(modes[nextIndex]);
    };

    window.addEventListener("cycle-video-creation-mode", handleCycleMode);
    return () => {
      window.removeEventListener("cycle-video-creation-mode", handleCycleMode);
    };
  }, [creationMode, navigate]);

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

  const hasSelection = prompts.some((p) => p.selected);

  const handleAddJson = (jsonString: string) => {
    const success = loadFromJson(jsonString, "add");
    return success;
  };

  const handleCreateMultipleWrapper = async (opts?: { skipConfirm?: boolean }) => {
    const result = await handleCreateMultiple(selectedProfileId, selectedProjectId, creationMode, opts);

    if (!result.success) {
      setAlertState({
        open: true,
        message: result.message || "Failed to start batch generation",
        severity: "error",
      });
      return;
    }

    const skippedMessage =
      result.skippedCount && result.skippedCount > 0 ? ` (${result.skippedCount} completed will be skipped)` : "";

    const isIngredientsMode = creationMode === "ingredients";
    const ingredientsNote = isIngredientsMode ? " with selected images" : "";

    if (!opts?.skipConfirm) {
      alert.show({
        title: "Starting Video Generation",
        message: `Generating videos for ${result.generatedCount} prompt(s)${skippedMessage}${ingredientsNote}...`,
        severity: "success",
        duration: 2000,
      });
    }

    const finalMessage =
      result.skippedCount && result.skippedCount > 0 ? `\n\n${result.skippedCount} completed prompt(s) were skipped.` : "";

    setAlertState({
      open: true,
      message: `Batch generation started!${finalMessage}\n\n${result.generatedCount} video(s) will be generated${ingredientsNote} with delays between each request.\n\nEach video will update independently as processing starts.`,
      severity: "success",
    });
  };

  const handleExportJson = () => {
    exportPromptsToJson(prompts);
  };

  const handleCopyJson = async () => {
    await copyPromptsToClipboard(prompts);
    toast.success("✓ JSON copied to clipboard", "Copy Complete", 3000);
  };

  const handleShowInfo = (promptId: string) => {
    const job = jobs.find((j) => j.promptId === promptId);
    if (job) {
      setSelectedJobId(job.id);
    }
  };

  const handleShowInFolder = (path: string) => {
    console.log("Show in folder:", path);
    alert.show({
      message: "This will open the folder in your OS explorer",
      severity: "info",
    });
  };

  const handleDownload = (url: string) => {
    console.log("Download:", url);
    alert.show({
      message: "Download functionality will be implemented",
      severity: "info",
    });
  };

  const handleOpenHistory = () => {
    navigate("/video-creation/history");
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Single Video Creation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create videos using single or multiple prompts</p>
          </div>

          {/* Mode tabs - centered */}
          <div className="flex-1 flex justify-center">
            <VideoCreationModeTabs currentMode={creationMode} onModeChange={handleModeChange} />
          </div>

          <div className="flex items-center gap-3">
            {/* Image Gallery button - only show in ingredients mode */}
            {creationMode === "ingredients" && (
              <button
                onClick={handleOpenImageGallery}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="Open Image Gallery (Ctrl+M)"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleOpenProfileDrawer}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                selectedProfileId || hasDefaultProfile
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}
              title="Select profile & project (Ctrl+F)"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              onClick={handleOpenHistory}
              className="relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 text-white font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
              title="Open History"
            >
              <History className="w-4 h-4 opacity-95" />
              <span className="text-sm">History</span>

              <span className="ml-2 inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/90 text-orange-600 font-medium text-xs shadow-sm">
                {jobs.length}
              </span>
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
            globalPreviewMode={globalPreviewMode}
            statusFilter={statusFilter}
            selectedCount={prompts.filter((p) => p.selected).length}
            totalCount={prompts.length}
            onUndo={undo}
            onRedo={redo}
            onAddJson={() => setShowAddJsonModal(true)}
            onClearAll={clearAllPrompts}
            onExportJson={handleExportJson}
            onCopyJson={handleCopyJson}
            onToggleGlobalPreview={toggleGlobalPreview}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
            currentSort={sortBy}
            onCreateMultiple={handleCreateMultipleWrapper}
            onDownloadSelected={handleDownloadSelected}
            onSelectAll={useVideoCreationStore.getState().selectAllPrompts}
            onDeselectAll={useVideoCreationStore.getState().clearAllSelections}
          />
        </div>

        {/* Add Prompt button */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="absolute -inset-1 rounded-full border-2 border-rose-300 opacity-60 transform-gpu animate-pulse-slow"
                aria-hidden="true"
              ></span>
              <button
                onClick={addPrompt}
                aria-label="Add New Prompt"
                title="Add New Prompt"
                className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_10px_36px_rgba(79,70,229,0.18)] hover:shadow-[0_16px_48px_rgba(79,70,229,0.22)] transform hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
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
                  creationMode={creationMode}
                  onUpdate={updatePrompt}
                  onDelete={removePrompt}
                  onToggleSelect={togglePromptSelection}
                  onTogglePreview={togglePromptPreview}
                  onCreate={(promptId, promptText) =>
                    handleCreateVideo(promptId, promptText, selectedProfileId, selectedProjectId, creationMode)
                  }
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

      {/* AppAlert for validation and notifications */}
      {alertState.open && (
        <AppAlert
          title={alertState.severity === "error" ? "Error" : alertState.severity === "success" ? "Success" : "Notice"}
          message={alertState.message}
          severity={alertState.severity}
          onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
