import { CheckSquare, Copy, Eye, EyeOff, FileDown, FileUp, Filter, Plus, Redo, Save, Square, Trash2, Undo } from "lucide-react";

interface JsonToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  allSelected: boolean;
  globalPreviewMode: boolean;
  statusFilter: "all" | "idle" | "processing" | "completed" | "failed";
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
  onCreateMultiple?: () => void;
}

export default function JsonToolbar({
  canUndo,
  canRedo,
  hasSelection,
  allSelected,
  globalPreviewMode,
  statusFilter,
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex flex-wrap items-center gap-2">
        {/* JSON Operations */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={onAddJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Add prompts from JSON"
          >
            <Plus className="w-4 h-4" />
            <span>Add JSON</span>
          </button>
        </div>

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
          {/* Create Multiple Prompts */}
          <button
            onClick={onCreateMultiple}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 transition-colors text-sm"
            title="Create multiple empty prompts"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
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
