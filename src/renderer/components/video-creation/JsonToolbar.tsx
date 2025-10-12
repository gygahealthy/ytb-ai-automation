import {
  CheckSquare,
  Copy,
  Eye,
  EyeOff,
  FileDown,
  FileUp,
  Filter,
  Play,
  Plus,
  Redo,
  Save,
  Square,
  Trash2,
  Undo,
} from "lucide-react";
import { useState } from "react";
import AppAlert from "../common/AppAlert";

interface JsonToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  allSelected: boolean;
  globalPreviewMode: boolean;
  statusFilter: "all" | "idle" | "processing" | "completed" | "failed";
  selectedCount?: number;
  onUndo: () => void;
  onRedo: () => void;
  onAddJson: () => void;
  onToggleSelectAll: () => void;
  onRemoveSelected: () => void;
  onClearAll: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onExportJson: () => void;
  onCopyJson: () => void;
  onToggleGlobalPreview: () => void;
  onStatusFilterChange: (filter: "all" | "idle" | "processing" | "completed" | "failed") => void;
  onCreateMultiple?: (opts?: { skipConfirm?: boolean }) => void;
}

export default function JsonToolbar({
  canUndo,
  canRedo,
  hasSelection,
  allSelected,
  globalPreviewMode,
  statusFilter,
  selectedCount = 0,
  onUndo,
  onRedo,
  onAddJson,
  onToggleSelectAll,
  onRemoveSelected,
  onClearAll,
  onSaveDraft,
  onLoadDraft,
  onExportJson,
  onCopyJson,
  onToggleGlobalPreview,
  onStatusFilterChange,
  onCreateMultiple,
}: JsonToolbarProps) {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "warning" | "error";
  }>({ open: false, message: "", severity: "info" });
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex flex-wrap items-center gap-2">
        {/* JSON Operations */}
        <div className="flex items-center gap-2 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onAddJson}
            aria-label="Add prompts from JSON"
            title="Add prompts from JSON"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <Plus className="w-5 h-5" />
            <span className="sr-only">Add JSON</span>
          </button>

          {/* Create (Generate Videos) - moved next to Add JSON */}
          <button
            onClick={() => {
              // Use AppAlert for validation; parent handles actual generation
              if (!onCreateMultiple) return;
              // show alert from parent if no selection - parent also validates, but help fast feedback here
              if (!(hasSelection as boolean)) {
                setAlertState({ open: true, message: "Please select at least one prompt to generate videos", severity: "error" });
                return;
              }
              // delegate to parent handler and show our AppAlert confirm dialog
              const countText = selectedCount > 0 ? `${selectedCount} selected` : "selected";
              setAlertState({
                open: true,
                message: `Generate videos for ${countText} prompt(s)?\n\nCompleted videos will be automatically skipped.\n\nThis will start video generation with a small delay between each to avoid rate limiting.`,
                severity: "info",
              });
            }}
            aria-label="Generate videos for selected prompts"
            title="Generate videos for selected prompts (skips completed)"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <Play className="w-5 h-5" />
            <span className="sr-only">Create Videos</span>
          </button>
        </div>

        {/* AppAlert rendered here for toolbar-level errors */}
        {alertState.open && (
          <AppAlert
            title={alertState.severity === "error" ? "Error" : "Notice"}
            message={alertState.message}
            severity={alertState.severity}
            onClose={() => setAlertState((s) => ({ ...s, open: false }))}
            onConfirm={() => {
              setAlertState((s) => ({ ...s, open: false }));
              try {
                if (onCreateMultiple) onCreateMultiple({ skipConfirm: true });
              } catch (err) {
                setAlertState({ open: true, message: String(err || "Failed to start generation"), severity: "error" });
              }
            }}
          />
        )}

        {/* Preview Mode */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onToggleGlobalPreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors text-sm ${
              !globalPreviewMode
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            }`}
            title={!globalPreviewMode ? "Showing all previews" : "Hiding all previews"}
          >
            {!globalPreviewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{!globalPreviewMode ? "Show Previews" : "Hide Previews"}</span>
          </button>
        </div>

        {/* Selection Operations */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title={allSelected ? "Unselect all prompts" : "Select all prompts"}
          >
            {allSelected ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            <span>{allSelected ? "Unselect All" : "Select All"}</span>
          </button>
        </div>

        {/* Remove Operations */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onRemoveSelected}
            disabled={!hasSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Remove selected prompts"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Selected</span>
          </button>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Clear all prompts"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>

        {/* History Operations */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
            <span>Redo</span>
          </button>
        </div>

        {/* Draft & Export Operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Save as draft"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={onLoadDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Load draft"
          >
            <FileUp className="w-4 h-4" />
            <span>Load Draft</span>
          </button>
          <button
            onClick={onCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Copy as JSON"
          >
            <Copy className="w-4 h-4" />
            <span>Copy JSON</span>
          </button>
          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Export to file"
          >
            <FileDown className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Status Filter - Right Side */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Filter:</span>
        <div className="flex items-center gap-1">
          {(["all", "idle", "processing", "completed", "failed"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onStatusFilterChange(filter)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === filter
                  ? "bg-primary-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
