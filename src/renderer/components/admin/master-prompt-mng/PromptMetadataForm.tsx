import React from "react";
import { Plus } from "lucide-react";

type Prompt = {
  id?: number;
  provider?: string;
  promptTypeId?: number;
  description?: string;
  isActive?: boolean;
};

type Props = {
  prompt: Prompt;
  providers: string[];
  promptTypes: any[];
  loadingPromptTypes: boolean;
  tags: string[];
  tagInput: string;
  onUpdate: (field: keyof Prompt, value: any) => void;
  onTagInputChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
};

const PromptMetadataForm: React.FC<Props> = ({
  prompt,
  providers,
  promptTypes,
  loadingPromptTypes,
  tags,
  tagInput,
  onUpdate,
  onTagInputChange,
  onTagsChange,
}) => {
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputVal = (e.target as HTMLInputElement).value;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = inputVal.trim();
      if (!raw) return;
      const parts = raw
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      onTagsChange([...new Set([...tags, ...parts])]);
      onTagInputChange("");
    } else if (e.key === "Backspace" && inputVal === "") {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    e.preventDefault();
    const parts = paste
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    onTagsChange([...new Set([...tags, ...parts])]);
    onTagInputChange("");
  };

  const addTag = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    onTagsChange([...new Set([...tags, ...parts])]);
    onTagInputChange("");
  };

  return (
    <aside className="w-80 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Provider & Kind */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Provider
            </label>
            <select
              value={prompt.provider}
              onChange={(e) => onUpdate("provider", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Prompt Kind
            </label>
            <select
              value={prompt.promptTypeId ? String(prompt.promptTypeId) : ""}
              onChange={(e) =>
                onUpdate(
                  "promptTypeId",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={loadingPromptTypes}
            >
              <option value="">
                {loadingPromptTypes
                  ? "Loading prompt types..."
                  : "Select a prompt type"}
              </option>
              {promptTypes.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {type.typeName}
                  {type.description ? ` - ${type.description}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={prompt.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            rows={3}
            placeholder="Brief description..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="font-medium truncate max-w-[10rem]">{t}</span>
                <button
                  type="button"
                  onClick={() => onTagsChange(tags.filter((x) => x !== t))}
                  className="ml-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  aria-label={`Remove tag ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="flex flex-col gap-2 w-full">
              <input
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onPaste={handleTagPaste}
                placeholder="Add a tag and press Enter"
                className="w-full px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="w-full flex items-center justify-center px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="Add tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Press Enter or comma to add. Click × to remove.
          </p>
        </div>

        {/* Active Toggle */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Status
            </label>
            <button
              onClick={() => onUpdate("isActive", !(prompt.isActive ?? true))}
              className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-200 ${
                prompt.isActive ?? true
                  ? "bg-green-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
              aria-pressed={prompt.isActive ?? true}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  prompt.isActive ?? true ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {prompt.isActive ?? true
              ? "Prompt is active"
              : "Prompt is inactive"}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default PromptMetadataForm;
