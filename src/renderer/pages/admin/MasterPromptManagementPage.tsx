import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAlert } from "../../hooks/useAlert";
import { useConfirm } from "../../hooks/useConfirm";
import AdminPromptTable, {
  VideoPromptRow,
} from "../../components/admin/AdminPromptTable";
import PromptModal from "../../components/admin/PromptModal";
import VariablesHint from "../../components/admin/VariablesHint";
import electronApi from "../../ipc";

interface MasterPrompt extends VideoPromptRow {
  id: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

type PromptKindFilter =
  | "all"
  | "video_creation"
  | "channel_analysis"
  | "platform_analysis";
type ProviderFilter = "all" | "youtube" | "tiktok" | "veo3";
type StatusFilter = "all" | "active" | "inactive";

const MasterPromptManagementPage: React.FC = () => {
  const alertApi = useAlert();
  const confirm = useConfirm();

  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [kindFilter, setKindFilter] = useState<PromptKindFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showVariablesHint, setShowVariablesHint] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<
    VideoPromptRow | undefined
  >(undefined);

  const promptKindOptions: { value: PromptKindFilter; label: string }[] = [
    { value: "all", label: "All Types" },
    { value: "video_creation", label: "Video Creation" },
    { value: "platform_analysis", label: "Platform Analysis" },
    { value: "channel_analysis", label: "Channel Analysis" },
  ];

  const providerOptions: { value: ProviderFilter; label: string }[] = [
    { value: "all", label: "All Providers" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "veo3", label: "VEO3" },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    loadAllPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllPrompts = async () => {
    setLoading(true);
    try {
      const result = await electronApi.masterPrompts.getAll();
      if (result.success && result.data) {
        setPrompts(result.data);
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

  const filteredPrompts = prompts.filter((p) => {
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
      if (kindFilter === "platform_analysis") {
        const isPlatformAnalysis =
          p.promptKind?.includes("analysis") &&
          !p.promptKind?.includes("channel");
        if (!isPlatformAnalysis) return false;
      } else if (p.promptKind !== kindFilter) {
        return false;
      }
    }

    // Provider filter
    if (providerFilter !== "all") {
      if (p.provider?.toLowerCase() !== providerFilter.toLowerCase())
        return false;
    }

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
        promptKind: prompt.promptKind,
        description: prompt.description,
        promptTemplate: prompt.promptTemplate,
      });
    } else {
      setEditingPrompt({
        provider: "veo3",
        promptKind: "video_creation",
        description: "",
        promptTemplate: "",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPrompt(undefined);
  };

  const handleModalSave = async () => {
    await loadAllPrompts();
    handleCloseModal();
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
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

          {/* Collapsible Variables Hint */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowVariablesHint(!showVariablesHint)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                📌 Using Variables in Prompts
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  showVariablesHint ? "rotate-180" : ""
                }`}
              />
            </button>
            {showVariablesHint && (
              <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                <VariablesHint />
              </div>
            )}
          </div>
        </div>

        {/* Toolbar with Filters and Add Button */}
        <div className="mb-6 space-y-4">
          {/* Search Bar and Add Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-md transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add New Prompt
            </button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Filter by:</span>
            </div>

            {/* Prompt Kind Filter */}
            <select
              value={kindFilter}
              onChange={(e) =>
                setKindFilter(e.target.value as PromptKindFilter)
              }
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {promptKindOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) =>
                setProviderFilter(e.target.value as ProviderFilter)
              }
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {providerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
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

            {/* Clear Filters Button */}
            {(kindFilter !== "all" ||
              providerFilter !== "all" ||
              statusFilter !== "all" ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setKindFilter("all");
                  setProviderFilter("all");
                  setStatusFilter("all");
                }}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                Loading prompts...
              </p>
            </div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              {prompts.length === 0
                ? "No prompts found"
                : "No prompts match your filters"}
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
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <AdminPromptTable
              prompts={filteredPrompts}
              onEdit={(row) => handleOpenModal(row as MasterPrompt)}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <PromptModal
          open={modalOpen}
          onClose={handleCloseModal}
          initial={editingPrompt}
          onSave={() => handleModalSave()}
        />
      )}
    </div>
  );
};

export default MasterPromptManagementPage;
