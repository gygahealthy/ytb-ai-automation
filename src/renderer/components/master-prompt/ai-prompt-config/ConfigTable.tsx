import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import type { ComponentPromptConfig } from "../../../../shared/types";

interface MasterPrompt {
  id: number;
  provider: string;
  description?: string;
}

interface Profile {
  id: string;
  name: string;
}

interface ConfigTableProps {
  configs: ComponentPromptConfig[];
  prompts: MasterPrompt[];
  profiles: Profile[];
  onEdit: (config: ComponentPromptConfig) => void;
  onDelete: (componentName: string) => void;
}

export const ConfigTable: React.FC<ConfigTableProps> = ({
  configs,
  prompts,
  profiles,
  onEdit,
  onDelete,
}) => {
  const suffix = (componentName: string) => {
    if (!componentName) return componentName;
    const idxDash = componentName.lastIndexOf("-");
    const idxPipe = componentName.lastIndexOf("|");
    const idx = Math.max(idxDash, idxPipe);
    return idx === -1 ? componentName : componentName.slice(idx + 1);
  };
  if (configs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
        <div className="text-gray-500 dark:text-gray-400 space-y-2">
          <p className="text-lg font-medium">No configurations found</p>
          <p className="text-sm">Add one above to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Component
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Profile
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Prompt
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                AI Model
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config, idx) => {
              const prompt = prompts.find((p) => p.id === config.promptId);
              const profile = profiles.find((p) => p.id === config.profileId);
              const isEven = idx % 2 === 0;

              return (
                <tr
                  key={config.id}
                  className={`border-b border-gray-200 dark:border-gray-700 transition ${
                    isEven
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-750"
                  } hover:bg-blue-50 dark:hover:bg-gray-700/50`}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {suffix(config.componentName)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {profile?.name || config.profileId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {prompt ? (
                        <span className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {prompt.provider}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {prompt.description || "N/A"}
                          </span>
                        </span>
                      ) : (
                        <span className="italic text-gray-400">Unknown</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                      {config.aiModel || "Default"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.enabled !== false
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {config.enabled !== false ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(config)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Edit configuration"
                      >
                        <Edit2 size={16} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(suffix(config.componentName))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete configuration"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
