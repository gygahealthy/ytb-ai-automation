import React, { useEffect, useState } from "react";
import { Plus, Search, Sparkles, AlertCircle, ChevronDown, Grid3x3, List } from "lucide-react";
import { useAlert } from "../../hooks/useAlert";
import { useConfirm } from "../../hooks/useConfirm";
import AdminPromptTable, { VideoPromptRow } from "../../components/master-prompt/AdminPromptTable";
import PromptModal from "../../components/master-prompt/PromptModal";
import VariablesHint from "../../components/master-prompt/master-prompt/VariablesHint";
import electronApi from "../../ipc";

interface MasterPrompt extends VideoPromptRow {
  id?: number;
  provider: string;
  promptTypeId?: number;
  promptTemplate: string;
  description: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
  variableOccurrencesConfig?: any;
}

interface PromptType {
  id: number;
  typeName: string;
  typeCode: string;
  status: number;
  createdAt?: string;
}

type PromptKindFilter = "all" | string;
type StatusFilter = "all" | "active" | "inactive";

const MasterPromptPage: React.FC = () => {
  const alertApi = useAlert();
  const confirm = useConfirm();

  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<PromptKindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showVariablesHint, setShowVariablesHint] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<MasterPrompt | undefined>(undefined);

  const promptKindOptions: { value: PromptKindFilter; label: string }[] = [
    { value: "all", label: "All Types" },
    ...promptTypes.map((pt) => ({
      value: pt.typeCode as PromptKindFilter,
      label: pt.typeName,
    })),
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    loadAllPrompts();
    loadPromptTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllPrompts = async () => {
    setLoading(true);
    try {
      const result = await electronApi.masterPrompts.getAll();
      if (result.success && result.data) {
        // If we already have promptTypes loaded, enrich prompts with promptKind
        const enriched = (result.data as MasterPrompt[]).map((p) => ({
          ...p,
          promptKind:
            p.promptKind || (promptTypes.find((pt: PromptType) => pt.id === p.promptTypeId)?.typeCode as any) || undefined,
        }));
        setPrompts(enriched);
      } else {
        alertApi.show({
          message: "Failed to load master prompts",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
      alertApi.show({
        message: "Failed to load master prompts",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPromptTypes = async () => {
    try {
      const result = await electronApi.promptTypes.getAll();
      if (result.success && result.data) {
        // Filter to only active prompt types
        const activeTypes = result.data.filter((pt: PromptType) => pt.status === 1);
        setPromptTypes(activeTypes);

        // Enrich any already-loaded prompts with the corresponding type code
        setPrompts((prev) =>
          prev.map((p) => ({
            ...p,
            promptKind:
              p.promptKind || (activeTypes.find((pt: PromptType) => pt.id === p.promptTypeId)?.typeCode as any) || undefined,
          }))
        );
      } else {
        console.error("Failed to load prompt types:", result.error);
      }
    } catch (error) {
      console.error("Failed to load prompt types:", error);
    }
  };

  const filteredPrompts = prompts.filter((p) => {
    // Archived filter
    if (!showArchived && p.archived) return false;
    if (showArchived && !p.archived) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.promptKind && p.promptKind.toLowerCase().includes(term)) ||
        (p.provider && p.provider.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }

    // Kind filter
    if (kindFilter !== "all") {
      if (p.promptKind !== kindFilter) {
        return false;
      }
    }

    // Provider filter
    // (removed - only filtering by Type and Status now)

    // Status filter
    if (statusFilter !== "all") {
      const isActive = p.status !== 0;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;
    }

    return true;
  });

  const handleOpenModal = (prompt?: MasterPrompt) => {
    if (prompt) {
      setEditingPrompt({
        id: prompt.id,
        provider: prompt.provider,
        promptTypeId: prompt.promptTypeId,
        description: prompt.description,
        promptTemplate: prompt.promptTemplate,
        tags: prompt.tags,
        isActive: prompt.isActive,
        archived: prompt.archived,
        variableOccurrencesConfig: prompt.variableOccurrencesConfig,
      });
    } else {
      setEditingPrompt({
        provider: "veo3",
        promptTypeId: undefined,
        description: "",
        promptTemplate: "",
        tags: [],
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleModalSave = async (prompt: any) => {
    try {
      let result;
      if (prompt.id) {
        // Update existing prompt
        result = await electronApi.masterPrompts.updatePrompt(prompt.id, {
          provider: prompt.provider,
          promptTypeId: prompt.promptTypeId,
          description: prompt.description,
          promptTemplate: prompt.promptTemplate,
          tags: prompt.tags,
          isActive: prompt.isActive,
          archived: prompt.archived,
          variableOccurrencesConfig: prompt.variableOccurrencesConfig,
        });
      } else {
        // Create new prompt
        result = await electronApi.masterPrompts.createPrompt({
          provider: prompt.provider,
          promptTypeId: prompt.promptTypeId,
          description: prompt.description,
          promptTemplate: prompt.promptTemplate,
          tags: prompt.tags,
          isActive: prompt.isActive,
          variableOccurrencesConfig: prompt.variableOccurrencesConfig,
        });
      }

      if (result.success) {
        alertApi.show({
          message: prompt.id ? "Prompt updated successfully" : "Prompt created successfully",
          title: "Success",
        });
        await loadAllPrompts();
        handleCloseModal();
      } else {
        alertApi.show({
          message: result.error || "Failed to save prompt",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to save prompt:", error);
      alertApi.show({
        message: "Failed to save prompt",
        title: "Error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      message: "Are you sure you want to delete this prompt?",
    });
    if (!isConfirmed) return;

    try {
      const result = await electronApi.masterPrompts.deletePrompt(id);
      if (result.success) {
        await loadAllPrompts();
        alertApi.show({
          message: "Prompt deleted successfully",
          title: "Success",
        });
      } else {
        alertApi.show({
          message: result.error || "Failed to delete prompt",
          title: "Error",
        });
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alertApi.show({
        message: "Failed to delete prompt",
        title: "Error",
      });
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col animate-fadeIn">
      <div className="w-full px-6 py-8 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Master Prompts</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Manage all AI master prompts across the application
                </p>
              </div>
            </div>

            {/* Prompt Count */}
            <div className="text-right">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wide">Total Prompts</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{prompts.length}</p>
            </div>
          </div>
        </div>

        {/* Toolbar - All Controls in One Row */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {/* Add Button - Far left */}
            <div>
              <button
                onClick={() => handleOpenModal()}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all mr-3"
                title="Add New Prompt"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Variables Hint Button */}
            <button
              onClick={() => setShowVariablesHint(!showVariablesHint)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
            >
              <span>📌 Using Variables in Prompts</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showVariablesHint ? "rotate-180" : ""}`} />
            </button>

            {/* Show Archived Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showArchived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <label
                htmlFor="showArchived"
                className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer whitespace-nowrap"
              >
                Show archived
              </label>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Type:</span>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as PromptKindFilter)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {promptKindOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input (Small) */}
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* View Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* (Old add button removed) */}
          </div>

          {/* Variables Hint Content */}
          {showVariablesHint && (
            <div className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <VariablesHint />
            </div>
          )}
        </div>

        {/* Clear Filters Button - Show only if filters are active */}
        {(kindFilter !== "all" || statusFilter !== "all" || searchTerm || showArchived) && (
          <div className="mb-4">
            <button
              onClick={() => {
                setSearchTerm("");
                setKindFilter("all");
                setStatusFilter("all");
                setShowArchived(false);
              }}
              className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Content Area - Full Height */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading prompts...</p>
              </div>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                {prompts.length === 0 ? "No prompts found" : "No prompts match your filters"}
              </p>
              {prompts.length === 0 && (
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                >
                  Create your first prompt
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
              <AdminPromptTable
                prompts={filteredPrompts}
                onEdit={(row) => handleOpenModal(row as MasterPrompt)}
                onDelete={handleDelete}
                viewMode={viewMode}
                promptTypes={promptTypes}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <PromptModal
          open={modalOpen}
          onClose={handleCloseModal}
          initial={editingPrompt}
          onSave={(prompt) => handleModalSave(prompt)}
        />
      )}
    </div>
  );
};

export default MasterPromptPage;
