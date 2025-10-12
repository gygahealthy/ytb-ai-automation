/// <reference types="../../../types/electron-api" />
import { ArrowLeft, Music, Plus, Youtube } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPromptTable, { VideoPromptRow } from "../../../components/admin/AdminPromptTable";
import PromptModal from "../../../components/admin/PromptModal";
import VariablesHint from "../../../components/admin/VariablesHint";
import { useConfirm } from "../../../hooks/useConfirm";
import electronApi from "../../../ipc";

interface MasterPrompt {
  id?: number;
  provider: "youtube" | "tiktok";
  promptKind: string;
  promptTemplate: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const PlatformAnalysisPromptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<"youtube" | "tiktok">("youtube");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VideoPromptRow | undefined>(undefined);

  useEffect(() => {
    loadPrompts();
  }, [selectedProvider]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const result = await electronApi.masterPrompts.getByProvider(selectedProvider);
      if (result.success) {
        setPrompts(
          result.data.filter((p: MasterPrompt) => p.promptKind.includes("analysis") || p.promptKind.includes("video_analysis"))
        );
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prompt create/update handled by modal; keep API handlers in modal save

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

  // Use modal to add new prompts

  // Table-driven editing (modal) — no inline updates needed

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              {selectedProvider === "youtube" ? (
                <Youtube className="w-7 h-7 text-white" />
              ) : (
                <Music className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Video Platform Analysis Prompts</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configure master prompts for content analysis</p>
            </div>
          </div>

          {/* Variables Hint */}
          <VariablesHint />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedProvider("youtube")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedProvider === "youtube"
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:shadow-md"
              }`}
            >
              <Youtube className="w-4 h-4 inline mr-2" />
              YouTube
            </button>
            <button
              onClick={() => setSelectedProvider("tiktok")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedProvider === "tiktok"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:shadow-md"
              }`}
            >
              <Music className="w-4 h-4 inline mr-2" />
              TikTok
            </button>
          </div>

          <div>
            <button
              onClick={() => {
                setEditing({ provider: selectedProvider, promptKind: "video_analysis", description: "", promptTemplate: "" });
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-4 h-4" /> Add New Prompt
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
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
                const confirmFn = useConfirm();
                if (!(await confirmFn({ message: `${action.charAt(0).toUpperCase() + action.slice(1)} this prompt?` }))) return;
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

export default PlatformAnalysisPromptsPage;
