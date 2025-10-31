import { useEffect } from "react";
import { User } from "lucide-react";
import { useVideoCreationStore } from "@store/video-creation.store";
import { useToast } from "@hooks/useToast";
import { useVideoGeneration } from "@hooks/video-creation/useVideoGeneration";
import { useVideoFilters } from "@hooks/video-creation/useVideoFilters";
import { useVideoCreationUI } from "@hooks/video-creation/useVideoCreationUI";
import JsonToolbar from "@/renderer/components/video-creation/single-video-page/JsonToolbar";
import VideoPromptRow from "@/renderer/components/video-creation/single-video-page/VideoPromptRow";
import { exportPromptsToJson, copyPromptsToClipboard } from "@/renderer/utils/video-creation/jsonUtils";

/**
 * Video creation interface embedded in Video Studio
 * Shows when no completed videos exist
 */
export default function StudioVideoCreation() {
  const toast = useToast();

  // Custom hooks for video generation
  const { handleCreateVideo } = useVideoGeneration();
  const { filteredPrompts } = useVideoFilters();
  const { selectedProfileId, selectedProjectId, handleOpenProfileDrawer } = useVideoCreationUI();

  // Subscribe to store values
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
  const undo = useVideoCreationStore((state) => state.undo);
  const redo = useVideoCreationStore((state) => state.redo);
  const canUndo = useVideoCreationStore((state) => state.canUndo);
  const canRedo = useVideoCreationStore((state) => state.canRedo);
  const clearAllPrompts = useVideoCreationStore((state) => state.clearAllPrompts);
  const toggleGlobalPreview = useVideoCreationStore((state) => state.toggleGlobalPreview);
  const setStatusFilter = useVideoCreationStore((state) => state.setStatusFilter);
  const setSortBy = useVideoCreationStore((state) => state.setSortBy);

  // Ensure global previews enabled
  useEffect(() => {
    if (!globalPreviewMode) {
      try {
        toggleGlobalPreview();
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts for undo/redo
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
      console.log("Show job info:", job);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with Profile Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Videos for Studio</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generate videos to populate your studio timeline</p>
          </div>

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
            <span className="text-sm font-medium">Profile</span>
          </button>
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
            onAddJson={() => {}}
            onClearAll={clearAllPrompts}
            onExportJson={handleExportJson}
            onCopyJson={handleCopyJson}
            onToggleGlobalPreview={toggleGlobalPreview}
            onStatusFilterChange={setStatusFilter}
            onSortChange={setSortBy}
            currentSort={sortBy}
            onCreateMultiple={() => {}}
            onDownloadSelected={() => {}}
            onSelectAll={useVideoCreationStore.getState().selectAllPrompts}
            onDeselectAll={useVideoCreationStore.getState().clearAllSelections}
          />
        </div>

        {/* Add Prompt Button */}
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
                  creationMode="text-to-video"
                  onUpdate={updatePrompt}
                  onDelete={removePrompt}
                  onToggleSelect={togglePromptSelection}
                  onTogglePreview={togglePromptPreview}
                  onCreate={(promptId, promptText) =>
                    handleCreateVideo(promptId, promptText, selectedProfileId, selectedProjectId)
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
    </div>
  );
}
