import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Copy, Download, Eye, EyeOff, FileDown, FileUp, Filter, Play, Redo, Save, Trash2, Undo } from "lucide-react";
import { useAlert } from "../../../hooks/useAlert";
// no local react state currently required

interface JsonToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  globalPreviewMode: boolean;
  statusFilter: "all" | "idle" | "processing" | "completed" | "failed";
  selectedCount?: number;
  totalCount?: number;
  onUndo: () => void;
  onRedo: () => void;
  onAddJson: () => void;
  onClearAll: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onExportJson: () => void;
  onCopyJson: () => void;
  onToggleGlobalPreview: () => void;
  onStatusFilterChange: (filter: "all" | "idle" | "processing" | "completed" | "failed") => void;
  onSortChange?: (sortBy: "index" | "status") => void;
  currentSort?: "index" | "status";
  onCreateMultiple?: (opts?: { skipConfirm?: boolean }) => void;
  onDownloadSelected?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export default function JsonToolbar({
  canUndo,
  canRedo,
  hasSelection,
  globalPreviewMode,
  statusFilter,
  selectedCount = 0,
  totalCount = 0,
  onUndo,
  onRedo,
  onAddJson,
  onClearAll,
  onSaveDraft,
  onLoadDraft,
  onExportJson,
  onCopyJson,
  onToggleGlobalPreview,
  onStatusFilterChange,
  onSortChange,
  currentSort = "index",
  onCreateMultiple,
  onDownloadSelected,
  onSelectAll,
  onDeselectAll,
}: JsonToolbarProps) {
  // Note: alerts are shown via useAlert hook
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const alert = useAlert();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!filterRef.current) return;
      if (filterRef.current.contains(e.target as Node)) return;
      setFilterOpen(false);
    }

    if (filterOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [filterOpen]);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Add JSON button occupies its own visual row */}
        <div className="flex items-center gap-2 w-full sm:w-auto pr-2">
          <div className="relative flex items-center">
            {/* animated bordered pulse circle */}
            <span
              className="absolute -inset-1 rounded-full border-2 border-indigo-300 opacity-60 transform-gpu animate-pulse-slow scale-100"
              aria-hidden="true"
            ></span>
            <button
              onClick={onAddJson}
              aria-label="Add prompts from JSON"
              title="Add prompts from JSON"
              className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_10px_36px_rgba(79,70,229,0.18)] hover:shadow-[0_16px_48px_rgba(79,70,229,0.22)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <FileUp className="w-6 h-6" />
              <span className="sr-only">Add JSON</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (!onCreateMultiple) return;
              if (!hasSelection) {
                window.alert("Please select at least one prompt to generate videos");
                return;
              }

              const countText = selectedCount > 0 ? `${selectedCount} selected` : "selected";
              const confirmed = window.confirm(
                `Generate videos for ${countText} prompt(s)?\n\nCompleted videos will be automatically skipped.\n\nThis will start video generation with a small delay between each request.`
              );

              if (confirmed) {
                onCreateMultiple();
              }
            }}
            aria-label="Generate videos for selected prompts"
            title="Generate videos for selected prompts (skips completed)"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <Play className="w-5 h-5" />
            <span className="sr-only">Create Videos</span>
          </button>

          {/* Download selected completed videos */}
          <button
            onClick={() => {
              console.log("[JsonToolbar] Download button clicked");
              console.log("[JsonToolbar] onDownloadSelected exists:", !!onDownloadSelected);
              console.log("[JsonToolbar] hasSelection:", hasSelection);
              console.log("[JsonToolbar] selectedCount:", selectedCount);

              if (!onDownloadSelected) {
                console.log("[JsonToolbar] No onDownloadSelected handler");
                return;
              }

              if (!hasSelection) {
                console.log("[JsonToolbar] No selection, showing alert");
                alert.show({
                  title: "No Selection",
                  message: "Please select at least one prompt to download videos",
                  severity: "warning",
                });
                return;
              }

              console.log("[JsonToolbar] Calling onDownloadSelected");
              onDownloadSelected();
            }}
            aria-label="Download selected videos"
            title="Download selected videos to configured folder"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-blue-600 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="sr-only">Download</span>
          </button>

          {/* Clear All next to Create button */}
          <button
            onClick={onClearAll}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-red-600 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
            title="Clear all prompts"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Clear</span>
          </button>
        </div>

        {/* Select/Deselect All Controls */}
        {onSelectAll && onDeselectAll && (
          <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700">
            <button
              onClick={onSelectAll}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              title="Select all prompts"
            >
              <span className="text-xs font-medium">Select All</span>
            </button>
            <button
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Deselect all prompts"
            >
              <span className="text-xs font-medium">Deselect</span>
            </button>
            {selectedCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {selectedCount} / {totalCount}
              </span>
            )}
          </div>
        )}

        {/* Undo/Redo compact */}
        <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-gray-700">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-md bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-md bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Draft & Export grouped compact - preview toggle moved here */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveDraft}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            title="Save as draft"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={onLoadDraft}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            title="Load draft"
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Load</span>
          </button>

          <button
            onClick={onToggleGlobalPreview}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            title={globalPreviewMode ? "Hide all previews" : "Show all previews"}
          >
            {globalPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{globalPreviewMode ? "Previews" : "Previews"}</span>
          </button>

          <button
            onClick={onCopyJson}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            title="Copy as JSON"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy</span>
          </button>

          <button
            onClick={onExportJson}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            title="Export to file"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {/* Status Filter - Right Side: single toggle that opens a popover */}
      <div className="flex items-center gap-2 ml-auto" ref={filterRef}>
        <button
          onClick={() => {
            if (filterOpen) {
              // clicking while open clears and hides
              onStatusFilterChange("all");
              setFilterOpen(false);
            } else {
              setFilterOpen(true);
            }
          }}
          aria-expanded={filterOpen}
          title={filterOpen ? "Hide filter" : "Show filter"}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
        >
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-400 font-medium">Filter</span>
          {statusFilter !== "all" && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-500 text-white">
              {statusFilter === "idle" ? "Not Created" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </span>
          )}
        </button>

        {/* Popover */}
        {filterOpen && (
          <div className="absolute right-3 mt-12 z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2 px-2 w-48">
              {(["idle", "completed", "processing", "failed"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    onStatusFilterChange(filter);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    statusFilter === filter
                      ? "bg-primary-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter === "idle" ? "Not Created" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    onStatusFilterChange("all");
                    setFilterOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort Button */}
        <button
          onClick={() => {
            const nextSort: "index" | "status" = currentSort === "index" ? "status" : "index";
            onSortChange?.(nextSort);
          }}
          title={`Sort by: ${currentSort === "index" ? "Array Index" : "Status"}`}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
        >
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-400 font-medium">
            {currentSort === "index" ? "By Index" : "By Status"}
          </span>
        </button>
      </div>
    </div>
  );
}
