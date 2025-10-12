import { ArrowLeft, Plus, Youtube } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPromptTable, { VideoPromptRow } from "../../../components/admin/AdminPromptTable";
import PromptModal from "../../../components/admin/PromptModal";
import VariablesHint from "../../../components/admin/VariablesHint";
import { useConfirm } from "../../../hooks/useConfirm";
import electronApi from "../../../ipc";

interface MasterPrompt {
  id?: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const ChannelAnalysisPromptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VideoPromptRow | undefined>(undefined);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const result = await electronApi.masterPrompts.getByKind("channel_analysis");
      if (result.success) {
        setPrompts(result.data);
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  // create/update handled by modal

  const handleDelete = async (id: number) => {
    const confirmFn = useConfirm();
    if (!(await confirmFn({ message: "Are you sure you want to delete this prompt?" }))) return;

    try {
      const result = await electronApi.masterPrompts.deletePrompt(id);
      if (result.success) {
        await loadPrompts();
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  const openAddModal = () => {
    setEditing({ provider: "youtube", promptKind: "channel_analysis", description: "", promptTemplate: "" });
    setModalOpen(true);
  };

  // in-table editing replaced with modal

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">YouTube Channel Analysis Prompts</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Configure master prompts for channel evaluation</p>
            </div>
          </div>

          <VariablesHint />
        </div>

        <div className="flex items-center justify-end mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Prompt
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div>
            <AdminPromptTable
              prompts={prompts as VideoPromptRow[]}
              onEdit={(row) => {
                setEditing(row);
                setModalOpen(true);
              }}
              onDelete={async (id) => {
                await handleDelete(id);
              }}
              onToggleActive={async (id, active) => {
                try {
                  await electronApi.masterPrompts.updatePrompt(id, { isActive: active } as any);
                  await loadPrompts();
                } catch (e) {
                  console.error(e);
                }
              }}
              onArchive={async (id) => {
                const prompt = prompts.find((p) => p.id === id);
                const isArchived = (prompt as any)?.archived;
                const action = isArchived ? "unarchive" : "archive";
                if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this prompt?`)) return;
                try {
                  await electronApi.masterPrompts.updatePrompt(id, { archived: !isArchived } as any);
                  await loadPrompts();
                } catch (e) {
                  console.error(e);
                }
              }}
            />
          </div>
        )}

        <PromptModal
          open={modalOpen}
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(undefined);
          }}
          onSave={async (p) => {
            setModalOpen(false);
            try {
              if (p.id) {
                await electronApi.masterPrompts.updatePrompt(p.id, p as any);
              } else {
                await electronApi.masterPrompts.createPrompt(p as any);
              }
              await loadPrompts();
            } catch (err) {
              console.error(err);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ChannelAnalysisPromptsPage;
