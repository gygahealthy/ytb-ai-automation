import React from "react";
import { Save, RotateCcw } from "lucide-react";

interface AIModelOption {
  value: string;
  label: string;
}

interface Profile {
  id: string;
  name: string;
}

interface MasterPrompt {
  id: number;
  provider: string;
  description?: string;
  isActive?: boolean;
}

interface ConfigFormProps {
  selectedComponent: string;
  selectedProfileId: string;
  selectedPromptId: number | "";
  selectedModel: string;
  enabled: boolean;
  useTempChat: boolean;
  keepContext: boolean;
  profiles: Profile[];
  prompts: MasterPrompt[];
  components: { value: string; label: string }[];
  saving: boolean;
  onProfileChange: (profileId: string) => void;
  onPromptChange: (promptId: number) => void;
  onModelChange: (model: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onTempChatChange: (useTempChat: boolean) => void;
  onKeepContextChange: (keepContext: boolean) => void;
  onSave: () => void;
  onReset: () => void;
}

const AI_MODELS: AIModelOption[] = [
  { value: "GEMINI_2_5_PRO", label: "Gemini 2.5 Pro" },
  { value: "GEMINI_2_5_FLASH", label: "Gemini 2.5 Flash" },
  { value: "GEMINI_2_0_FLASH", label: "Gemini 2.0 Flash" },
];

export const ConfigForm: React.FC<ConfigFormProps> = ({
  selectedComponent,
  selectedProfileId,
  selectedPromptId,
  selectedModel,
  enabled,
  useTempChat,
  keepContext,
  profiles,
  prompts,
  saving,
  onProfileChange,
  onPromptChange,
  onModelChange,
  onEnabledChange,
  onTempChatChange,
  onKeepContextChange,
  onSave,
  onReset,
}) => {
  const isValid =
    selectedComponent && selectedProfileId && selectedPromptId !== "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          Add/Update Configuration
        </h2>
      </div>

      <div className="space-y-6">
        {/* Primary Selections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Profile <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => onProfileChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Master Prompt <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPromptId}
              onChange={(e) => onPromptChange(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

        {/* AI Model */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            {AI_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
              Enabled
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={useTempChat}
              onChange={(e) => onTempChatChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
              Use Temporary Chat
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={keepContext}
              onChange={(e) => onKeepContextChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition">
              Keep Context
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onSave}
            disabled={saving || !isValid}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${
              isValid && !saving
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
