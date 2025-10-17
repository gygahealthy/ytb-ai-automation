import {
  ArrowLeft,
  Lightbulb,
  BookOpen,
  Sparkles,
  Edit3,
  ArrowRight,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PromptModal from "../../components/admin/PromptModal";
import electronApi from "../../ipc";

interface MasterPrompt {
  id?: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  archived?: boolean;
  tags?: string[];
}

interface PromptCardData {
  id: string;
  kind: string;
  title: string;
  description: string;
  helpText: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  selectedPrompt: MasterPrompt | null;
}

const MasterPromptSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompts, setSelectedPrompts] = useState<{
    [key: string]: number | null;
  }>({
    topic_generation: null,
    script_generation: null,
    veo3_video_prompts: null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<
    MasterPrompt | undefined
  >();
  const [editingCategory, setEditingCategory] = useState<string>("");

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const result = await electronApi.masterPrompts.getAll();
      if (result.success) {
        setPrompts(result.data);
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPromptsByKind = (kind: string): MasterPrompt[] => {
    return prompts.filter(
      (p) => p.promptKind === kind && !p.archived && p.isActive !== false
    );
  };

  const getSelectedPrompt = (kind: string): MasterPrompt | null => {
    const id = selectedPrompts[kind];
    return id ? prompts.find((p) => p.id === id) || null : null;
  };

  const handleSelectPrompt = (promptId: number, category: string) => {
    setSelectedPrompts((prev) => ({
      ...prev,
      [category]: promptId,
    }));
  };

  const handleEditPrompt = (prompt: MasterPrompt, category: string) => {
    setEditingPrompt(prompt);
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSavePrompt = async (promptData: MasterPrompt) => {
    try {
      if (promptData.id) {
        await electronApi.masterPrompts.updatePrompt(
          promptData.id,
          promptData as any
        );
      } else {
        const result = await electronApi.masterPrompts.createPrompt(
          promptData as any
        );
        if (result.success && (result.data as any)?.id) {
          handleSelectPrompt((result.data as any).id, editingCategory);
        }
      }
      await loadPrompts();
      setModalOpen(false);
      setEditingPrompt(undefined);
    } catch (error) {
      console.error("Failed to save prompt:", error);
    }
  };

  const handleContinue = () => {
    const allSelected =
      selectedPrompts.topic_generation &&
      selectedPrompts.script_generation &&
      selectedPrompts.veo3_video_prompts;

    if (!allSelected) {
      alert("Please select a prompt for each category");
      return;
    }

    navigate("/video-creation/script-create", {
      state: { selectedPrompts },
    });
  };

  // Prompt card configurations
  const promptCards: PromptCardData[] = [
    {
      id: "topic_generation",
      kind: "topic_generation",
      title: "Topic Generation",
      description: "Generate video topics based on user hints",
      helpText:
        "Used in the topic input to create AI-suggested topics when users click 'Generate'",
      icon: <Lightbulb className="w-6 h-6" />,
      gradient:
        "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
      accentColor: "amber",
      selectedPrompt: getSelectedPrompt("topic_generation"),
    },
    {
      id: "script_generation",
      kind: "script_generation",
      title: "Script Generation",
      description: "Generate video scripts from selected topics",
      helpText:
        "Transforms topics into complete video scripts with scenes and narration",
      icon: <BookOpen className="w-6 h-6" />,
      gradient:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      accentColor: "blue",
      selectedPrompt: getSelectedPrompt("script_generation"),
    },
    {
      id: "veo3_video_prompts",
      kind: "veo3_video_prompts",
      title: "VEO3 Video Prompts",
      description: "Generate VEO3 API video prompt JSON",
      helpText:
        "Creates structured prompts for VEO3 API to generate videos from scripts",
      icon: <Sparkles className="w-6 h-6" />,
      gradient:
        "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      accentColor: "purple",
      selectedPrompt: getSelectedPrompt("veo3_video_prompts"),
    },
  ];

  const allSelected = Object.values(selectedPrompts).every((v) => v !== null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate("/video-creation/single")}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Single Video Creation</span>
          </button>

          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Configure AI Prompts
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Set up the master prompts that will power your video generation
              pipeline
            </p>
          </div>
        </div>

        {/* Prompt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {promptCards.map((card) => {
            const categoryPrompts = getPromptsByKind(card.kind);
            const selectedId = selectedPrompts[card.id];
            const selected = selectedId
              ? categoryPrompts.find((p) => p.id === selectedId)
              : null;

            return (
              <div
                key={card.id}
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
                  selected
                    ? `border-${card.accentColor}-500`
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                }`}
              >
                {/* Selection Indicator */}
                {selected && (
                  <div
                    className={`absolute -top-3 -right-3 w-8 h-8 bg-${card.accentColor}-500 rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                {/* Header with Icon */}
                <div
                  className={`bg-gradient-to-r ${card.gradient} px-6 py-8 rounded-t-xl border-b-2 border-gray-100 dark:border-slate-700`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 bg-${card.accentColor}-100 dark:bg-${card.accentColor}-900/30 rounded-xl text-${card.accentColor}-600 dark:text-${card.accentColor}-400 group-hover:scale-110 transition-transform`}
                    >
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {card.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Help Text */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      <span className="font-semibold">ℹ️ Usage: </span>
                      {card.helpText}
                    </p>
                  </div>

                  {/* Selected Prompt Display */}
                  {selected ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          Selected Prompt
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {selected.description || `Prompt #${selected.id}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Provider: {selected.provider}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 font-mono">
                          {selected.promptTemplate}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditPrompt(selected, card.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Prompt
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        No prompt selected
                      </p>
                      {categoryPrompts.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {categoryPrompts.map((prompt) => (
                            <button
                              key={prompt.id}
                              onClick={() =>
                                handleSelectPrompt(prompt.id || 0, card.id)
                              }
                              className="w-full text-left p-2 text-xs rounded-lg border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <p className="font-medium text-slate-900 dark:text-white">
                                {prompt.description || `Prompt #${prompt.id}`}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 truncate">
                                {prompt.promptTemplate}
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPrompt({
                              provider: "veo3",
                              promptKind: card.kind,
                              promptTemplate: "",
                              description: "",
                            });
                            setEditingCategory(card.id);
                            setModalOpen(true);
                          }}
                          className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg transition-all"
                        >
                          Create First Prompt
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer Action */}
                  {categoryPrompts.length > 0 && (
                    <button
                      onClick={() => {
                        setEditingPrompt({
                          provider: "veo3",
                          promptKind: card.kind,
                          promptTemplate: "",
                          description: "",
                        });
                        setEditingCategory(card.id);
                        setModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      + New Prompt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          {/* Status Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Configuration Status
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {promptCards.map((card) => (
                <div key={card.id} className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedPrompts[card.id]
                        ? `bg-${card.accentColor}-100 dark:bg-${card.accentColor}-900/30 text-${card.accentColor}-600 dark:text-${card.accentColor}-400`
                        : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500"
                    }`}
                  >
                    {selectedPrompts[card.id] ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs">○</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {card.title}
                    </p>
                    <p
                      className={`text-xs ${
                        selectedPrompts[card.id]
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {selectedPrompts[card.id] ? "Selected" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => navigate("/admin/prompts/video-creation")}
              className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Manage All Prompts
            </button>
            <button
              onClick={handleContinue}
              disabled={!allSelected}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                allSelected
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
                  : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              Continue to Script Creation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPrompt(undefined);
        }}
        onSave={(promptData: any) => {
          handleSavePrompt(promptData);
        }}
        initial={editingPrompt}
        providers={["veo3", "youtube", "tiktok"]}
      />
    </div>
  );
};

export default MasterPromptSelectionPage;
