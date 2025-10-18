import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Archive,
  History,
  RotateCcw,
  Trash2,
  Clock,
  Plus,
} from "lucide-react";
import electronApi from "../../ipc";
import { useAlert } from "../../hooks/useAlert";
import { useConfirm } from "../../hooks/useConfirm";

type Prompt = {
  id?: number;
  provider?: string;
  promptKind?: string;
  description?: string;
  promptTemplate?: string;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (p: Prompt) => void;
  onArchive?: (id?: number) => void;
  initial?: Prompt;
  providers?: string[];
};

const PromptModal: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  onArchive,
  initial,
  providers = ["youtube", "tiktok", "veo3"],
}) => {
  // Ensure inputs are always controlled: provide default empty strings for text fields
  const makeDefaultPrompt = (provList: string[] | undefined) =>
    ({
      provider: provList && provList.length > 0 ? provList[0] : "youtube",
      promptKind: "",
      description: "",
      promptTemplate: "",
    } as Prompt);

  const [prompt, setPrompt] = useState<Prompt>(() =>
    initial
      ? { ...makeDefaultPrompt(providers), ...initial }
      : makeDefaultPrompt(providers)
  );
  // Managed tags as an array and a small tag input for typing new tags
  const [tags, setTags] = useState<string[]>(
    initial && initial.tags ? [...initial.tags] : []
  );
  const [tagInput, setTagInput] = useState("");

  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Archive note UI state (replace window.prompt which is unsupported)
  const [showArchiveNote, setShowArchiveNote] = useState(false);
  const [archiveNote, setArchiveNote] = useState("");

  // Prompt types state
  const [promptTypes, setPromptTypes] = useState<any[]>([]);
  const [loadingPromptTypes, setLoadingPromptTypes] = useState(false);

  // UI mode removed — always edit

  // modal container ref for focus trap
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Only update when `initial` changes. `providers` default param can create a new array each render
  // which would otherwise retrigger this effect and cause an update loop.
  useEffect(() => {
    const newPrompt = initial
      ? { ...makeDefaultPrompt(providers), ...initial }
      : makeDefaultPrompt(providers);
    setPrompt(newPrompt);
    setTags(initial && initial.tags ? [...initial.tags] : []);
    setTagInput("");
    // Load history if editing existing prompt
    if (open && initial?.id) {
      loadHistory(initial.id);
    } else {
      setPromptHistory([]);
    }
  }, [initial, open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Load prompt types when modal opens
   
  useEffect(() => {
    if (!open) return;

    const loadPromptTypes = async () => {
      setLoadingPromptTypes(true);
      try {
        const result = await electronApi.promptTypes.getAll();
        if (result.success && result.data) {
          setPromptTypes(result.data);
        } else {
          console.error("Failed to load prompt types:", result.error);
        }
      } catch (error) {
        console.error("Failed to load prompt types:", error);
      } finally {
        setLoadingPromptTypes(false);
      }
    };

    loadPromptTypes();
  }, [open]);

  // Focus trap inside modal when open
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const el = modalRef.current;
    const focusable =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(el.querySelectorAll(focusable)) as HTMLElement[];
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // focus the first element inside modal
    setTimeout(() => first?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (field: keyof Prompt, value: any) =>
    setPrompt({ ...prompt, [field]: value });

  // Load prompt history
  const loadHistory = async (promptId: number) => {
    setLoadingHistory(true);
    try {
      const result = await electronApi.promptHistory.getByPromptId(
        promptId,
        20
      );
      if (result.success && result.data) {
        setPromptHistory(result.data);
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const alertApi = useAlert();
  const confirm = useConfirm();

  // Archive current prompt template to history
  const archiveCurrentVersion = async (changeNote?: string) => {
    if (!prompt.id) {
      alertApi.show({
        message: "Cannot archive: prompt must be saved first",
        title: "Archive Error",
      });
      return;
    }

    try {
      const currentText = textareaRef.current
        ? textareaRef.current.value
        : prompt.promptTemplate;
      const result = await electronApi.promptHistory.create({
        promptId: prompt.id,
        provider: prompt.provider || "",
        promptKind: prompt.promptKind || "",
        promptTemplate: currentText || "",
        description: prompt.description,
        tags,
        isActive: prompt.isActive,
        archived: prompt.archived,
        changeNote: changeNote || "Manual archive",
      });

      if (result.success) {
        await loadHistory(prompt.id);
        alertApi.show({
          message: "Version archived successfully!",
          title: "Archived",
        });
      } else if (result.error === "duplicate") {
        alertApi.show({
          message:
            "This version is identical to the latest archived version. No new archive created.",
          title: "No changes",
        });
      } else {
        alertApi.show({
          message: "Failed to archive version: " + result.error,
          title: "Archive Failed",
        });
      }
    } catch (error) {
      console.error("Failed to archive version:", error);
      alertApi.show({
        message: "Failed to archive version",
        title: "Archive Failed",
      });
    }
  };

  // Restore from history
  const restoreFromHistory = async (historyItem: any) => {
    if (
      !(await confirm({
        message: "Restore this version? Current changes will be replaced.",
      }))
    )
      return;

    setPrompt({
      ...prompt,
      promptTemplate: historyItem.promptTemplate,
      description: historyItem.description,
      provider: historyItem.provider,
      promptKind: historyItem.promptKind,
      isActive: historyItem.isActive,
      archived: historyItem.archived,
    });
    setTags(historyItem.tags || []);
    alertApi.show({
      message: "Version restored! Remember to save to apply changes.",
      title: "Restored",
    });
  };

  // Delete history entry
  const deleteHistoryEntry = async (historyId: number) => {
    if (!(await confirm({ message: "Delete this history entry?" }))) return;

    try {
      const result = await electronApi.promptHistory.delete(historyId);
      if (result.success && prompt.id) {
        await loadHistory(prompt.id);
      }
    } catch (error) {
      console.error("Failed to delete history entry:", error);
    }
  };

  // textarea ref for reliable editing
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Ensure promptTemplate exists on prompt
  if (prompt.promptTemplate === undefined) prompt.promptTemplate = "";

  const detectedVariables = React.useMemo(() => {
    const re = /\[([A-Z0-9_]+)\]/g;
    const txt = prompt.promptTemplate || "";
    const result: Record<string, { name: string; occurrences: number[] }> = {};
    let m;
    while ((m = re.exec(txt))) {
      const name = m[1];
      const idx = m.index;
      if (!result[name]) result[name] = { name, occurrences: [] };
      result[name].occurrences.push(idx);
    }
    return Object.keys(result).map((k) => ({
      name: k,
      occurrences: result[k].occurrences,
    }));
  }, [prompt.promptTemplate]);

  const focusVariableAt = (pos: number) => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    // Find the end of the variable token at this position
    const txt = prompt.promptTemplate || "";
    const match = txt.substring(pos).match(/^\[([A-Z0-9_]+)\]/);
    const endPos = match ? pos + match[0].length : pos + 1;
    // Select the entire variable token
    el.setSelectionRange(pos, endPos);
    // Scroll to the selection
    const lineHeight = 24; // approximate line height
    const lines = txt.substring(0, pos).split("\n").length;
    el.scrollTop = Math.max(0, lines * lineHeight - el.clientHeight / 2);
  };

  // Only render modal content when open; hooks must be defined above
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {prompt.id ? "Edit Prompt" : "Create New Prompt"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Use [VAR_NAME] syntax for variables
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Metadata (Collapsible/Compact) */}
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
                    onChange={(e) => update("provider", e.target.value)}
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
                    value={prompt.promptKind}
                    onChange={(e) => update("promptKind", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={loadingPromptTypes}
                  >
                    <option value="">
                      {loadingPromptTypes
                        ? "Loading prompt types..."
                        : "Select a prompt type"}
                    </option>
                    {promptTypes.map((type) => (
                      <option key={type.id} value={type.typeName}>
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
                  onChange={(e) => update("description", e.target.value)}
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
                      <span className="font-medium truncate max-w-[10rem]">
                        {t}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTags((prev) => prev.filter((x) => x !== t))
                        }
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
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        const inputVal = (e.target as HTMLInputElement).value;
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const raw = inputVal.trim();
                          if (!raw) return;
                          const parts = raw
                            .split(",")
                            .map((p) => p.trim())
                            .filter(Boolean);
                          setTags((prev) => {
                            const lower = new Set(
                              prev.map((p) => p.toLowerCase())
                            );
                            const merged = [...prev];
                            for (const p of parts) {
                              if (!lower.has(p.toLowerCase())) {
                                merged.push(p);
                                lower.add(p.toLowerCase());
                              }
                            }
                            return merged;
                          });
                          setTagInput("");
                        } else if (e.key === "Backspace" && inputVal === "") {
                          // remove last tag on backspace when input empty
                          setTags((prev) => prev.slice(0, -1));
                        }
                      }}
                      onPaste={(e) => {
                        const paste = e.clipboardData.getData("text");
                        if (!paste) return;
                        e.preventDefault();
                        const parts = paste
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        setTags((prev) => {
                          const lower = new Set(
                            prev.map((p) => p.toLowerCase())
                          );
                          const merged = [...prev];
                          for (const p of parts) {
                            if (!lower.has(p.toLowerCase())) {
                              merged.push(p);
                              lower.add(p.toLowerCase());
                            }
                          }
                          return merged;
                        });
                        setTagInput("");
                      }}
                      placeholder="Add a tag and press Enter"
                      className="w-full px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const raw = tagInput.trim();
                        if (!raw) return;
                        const parts = raw
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        setTags((prev) => {
                          const lower = new Set(
                            prev.map((p) => p.toLowerCase())
                          );
                          const merged = [...prev];
                          for (const p of parts) {
                            if (!lower.has(p.toLowerCase())) {
                              merged.push(p);
                              lower.add(p.toLowerCase());
                            }
                          }
                          return merged;
                        });
                        setTagInput("");
                      }}
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
                    onClick={() =>
                      update("isActive" as any, !(prompt.isActive ?? true))
                    }
                    className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-200 ${
                      prompt.isActive ?? true
                        ? "bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                    aria-pressed={prompt.isActive ?? true}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                        prompt.isActive ?? true
                          ? "translate-x-7"
                          : "translate-x-0"
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

          {/* Center - Prompt Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex flex-col p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Prompt Template
                </label>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {(prompt.promptTemplate || "").length} characters
                  </div>
                  {prompt.id && (
                    <>
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        title="View version history"
                      >
                        <History className="w-3.5 h-3.5" />
                        History ({promptHistory.length})
                      </button>
                      {showArchiveNote ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={archiveNote}
                            onChange={(e) => setArchiveNote(e.target.value)}
                            placeholder="Optional note for this version"
                            className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                          />
                          <button
                            onClick={() => {
                              archiveCurrentVersion(archiveNote || undefined);
                              setShowArchiveNote(false);
                              setArchiveNote("");
                            }}
                            className="px-2 py-1 rounded-md bg-indigo-600 text-white text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowArchiveNote(false);
                              setArchiveNote("");
                            }}
                            className="px-2 py-1 rounded-md bg-slate-200 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowArchiveNote(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Archive current version"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive Version
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-inner overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={prompt.promptTemplate}
                  onChange={(e) => update("promptTemplate", e.target.value)}
                  className="w-full h-full px-4 py-3 font-mono text-sm leading-relaxed resize-none outline-none bg-transparent text-slate-900 dark:text-slate-100"
                  placeholder="Enter your prompt template here... Use [VARIABLE_NAME] for variables."
                />
              </div>
            </div>
          </div>

          {/* History Side Panel - Conditionally shown */}
          {showHistory && prompt.id && (
            <aside className="w-96 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Version History
                  </h4>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl"
                    aria-label="Close history"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Restore or delete previous versions
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Loading history...
                    </p>
                  </div>
                ) : promptHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No version history yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Archive versions to create restore points
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {promptHistory.map((item, idx) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Version #{promptHistory.length - idx}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {new Date(item.createdAt).toLocaleString()}
                            </div>
                            {item.changeNote && (
                              <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                                "{item.changeNote}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded max-h-20 overflow-y-auto">
                          {item.promptTemplate.substring(0, 150)}
                          {item.promptTemplate.length > 150 && "..."}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreFromHistory(item)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => deleteHistoryEntry(item.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Right Side - Variables Detection */}
          <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Detected Variables
                </h4>
                <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  {detectedVariables.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Click numbers to jump to occurrence
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {detectedVariables.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-400 dark:text-slate-500 text-sm">
                    No variables detected
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Use{" "}
                    <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                      [VAR_NAME]
                    </code>{" "}
                    syntax
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {detectedVariables.map((v) => (
                    <div
                      key={v.name}
                      className="h-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white break-all">
                          {v.name}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                          {v.occurrences.length}×
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {v.occurrences.map((pos, idx) => (
                          <button
                            key={idx}
                            onClick={() => focusVariableAt(pos)}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors shadow-sm hover:shadow"
                            title={`Jump to occurrence ${idx + 1}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const currentText = textareaRef.current
                ? textareaRef.current.value
                : prompt.promptTemplate;
              const finalPrompt = {
                ...prompt,
                promptTemplate: currentText,
                tags,
              };
              onSave(finalPrompt);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={async () => {
              // Archive: prefer dedicated handler if provided
              if (prompt.id && typeof onArchive === "function") {
                onArchive(prompt.id);
                return;
              }
              if (!(await confirm({ message: "Archive this prompt?" }))) return;
              const currentText = textareaRef.current
                ? textareaRef.current.value
                : prompt.promptTemplate;
              const finalPrompt = {
                ...prompt,
                promptTemplate: currentText,
                tags,
                archived: true,
              };
              onSave(finalPrompt);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Archive className="w-4 h-4" /> Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
