import React, { useEffect } from "react";
import { Loader, Zap } from "lucide-react";
import { useAIPromptConfig } from "../../hooks/useAIPromptConfig";
import { useToast } from "../../hooks/useToast";
import { ConfigTable } from "../../components/master-prompt/ai-prompt-config/ConfigTable";
import { ComponentSelector } from "../../components/master-prompt/ai-prompt-config/ComponentSelector";

export const AIPromptConfigPage: React.FC = () => {
  const toast = useToast();
  const {
    configs,
    prompts,
    profiles,
    loading,
    error,
    success,
    formState,
    loadData,
    updateFormState,
    resetFormState,
    saveConfig,
    deleteConfig,
    editConfig,
    clearMessages,
  } = useAIPromptConfig();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, "Error", undefined, "top-right");
      clearMessages();
    }
  }, [error, toast, clearMessages]);

  useEffect(() => {
    if (success) {
      toast.success(success, "Success", undefined, "top-right");
      clearMessages();
    }
  }, [success, toast, clearMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 animate-fadeIn">
      <div className="w-full mx-auto space-y-8">
        {/* Header with Icon */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Zap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                AI Prompt Configuration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage AI configurations with precision and ease</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {/* Toast notifications are displayed via ToastContainer in App.tsx */}

        {/* Main Layout: Left column (1/3) = Builder (top) + Tree (scrollable). Right column (2/3) = Active Configs (scrollable) */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">
          {/* LEFT: Builder (top) + Component Tree (below) - 1/3 width */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3 ">
            {/* Builder - compact and sticky */}
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200 flex-shrink-0 sticky top-6 z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration Builder</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formState.selectedComponent ? `Component: ${formState.selectedComponent}` : "Select a component to begin"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Primary Selections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Profile Selection */}
                  <div className="group">
                    <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                      Profile <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formState.selectedProfileId}
                      onChange={(e) => updateFormState({ selectedProfileId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    >
                      <option value="">Select Profile</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prompt Selection */}
                  <div className="group">
                    <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" />
                      Master Prompt <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formState.selectedPromptId}
                      onChange={(e) =>
                        updateFormState({
                          selectedPromptId: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                    >
                      <option value="">Select Prompt</option>
                      {prompts
                        .filter((p) => p.isActive !== false)
                        .map((prompt) => (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.provider} - {prompt.description || "N/A"}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* AI Model Selection */}
                <div className="group">
                  <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gradient-to-r from-pink-500 to-orange-600 rounded-full" />
                    AI Model
                  </label>
                  <select
                    value={formState.selectedModel}
                    onChange={(e) => updateFormState({ selectedModel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  >
                    <option value="GEMINI_2_5_PRO">Gemini 2.5 Pro</option>
                    <option value="GEMINI_2_5_FLASH">Gemini 2.5 Flash</option>
                    <option value="GEMINI_2_0_FLASH">Gemini 2.0 Flash</option>
                  </select>
                </div>

                {/* Toggles Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-md border border-blue-200/50 dark:border-blue-800/30">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formState.enabled}
                      onChange={(e) => updateFormState({ enabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
                      Enable Configuration
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formState.useTempChat}
                      onChange={(e) => updateFormState({ useTempChat: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
                      Temporary Chat
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formState.keepContext}
                      onChange={(e) => updateFormState({ keepContext: e.target.checked })}
                      className="w-5 h-5 text-pink-600 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer accent-pink-600"
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
                      Keep Context
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveConfig}
                    disabled={!formState.selectedComponent || !formState.selectedProfileId || formState.selectedPromptId === ""}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold transition-all duration-150 text-white shadow-sm hover:shadow-md"
                    style={{
                      background:
                        formState.selectedComponent && formState.selectedProfileId && formState.selectedPromptId !== ""
                          ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                          : "#9ca3af",
                      cursor:
                        formState.selectedComponent && formState.selectedProfileId && formState.selectedPromptId !== ""
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <Zap size={18} />
                    Save Configuration
                  </button>
                  <button
                    onClick={resetFormState}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-150 shadow-sm hover:shadow-md"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Component Tree - scrollable area below builder */}
            <div className="overflow-y-auto flex-1 pt-2">
              <ComponentSelector
                selectedComponent={formState.selectedComponent}
                onComponentSelect={(comp: string) => updateFormState({ selectedComponent: comp })}
              />
            </div>
          </div>

          {/* RIGHT: Active Configurations - 2/3 width, full column */}
          <div className="w-full lg:w-2/3 flex flex-col h-full">
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 flex-1 flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  Active Configurations
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
                <ConfigTable
                  configs={configs}
                  prompts={prompts}
                  profiles={profiles}
                  onEdit={editConfig}
                  onDelete={deleteConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPromptConfigPage;
