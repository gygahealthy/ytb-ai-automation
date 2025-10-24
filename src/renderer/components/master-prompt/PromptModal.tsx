import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, Archive } from "lucide-react";
import electronApi from "../../ipc";
import { useAlert } from "../../hooks/useAlert";
import { useConfirm } from "../../hooks/useConfirm";
import PromptMetadataForm from "./master-prompt/PromptMetadataForm";
import PromptEditor, { PromptEditorRef } from "./master-prompt/PromptEditor";
import PromptHistoryPanel from "./master-prompt/PromptHistoryPanel";
import DetectedVariablesPanel from "./master-prompt/DetectedVariablesPanel";
import { detectVariables, findVariableEnd } from "../../../shared/utils/variable-detect";
import { parseTags } from "../../utils/prompt-tag-parse";

type Prompt = {
  id?: number;
  provider?: string;
  promptTypeId?: number;
  description?: string;
  promptTemplate?: string;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  variableOccurrencesConfig?: Record<string, number[]> | null;
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
  const makeDefaultPrompt = (provList: string[] | undefined): Prompt => ({
    provider: provList && provList.length > 0 ? provList[0] : "youtube",
    promptTypeId: undefined,
    description: "",
    promptTemplate: "",
  });

  const [prompt, setPrompt] = useState<Prompt>(() =>
    initial ? { ...makeDefaultPrompt(providers), ...initial } : makeDefaultPrompt(providers)
  );

  const [tags, setTags] = useState<string[]>(() => parseTags(initial?.tags));
  const [tagInput, setTagInput] = useState("");

  // Variable occurrences selection state
  const [selectedVariableOccurrences, setSelectedVariableOccurrences] = useState<Record<string, number[]>>(() => {
    return initial?.variableOccurrencesConfig || {};
  });

  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Archive note UI state
  const [showArchiveNote, setShowArchiveNote] = useState(false);
  const [archiveNote, setArchiveNote] = useState("");

  // Prompt types state
  const [promptTypes, setPromptTypes] = useState<any[]>([]);
  const [loadingPromptTypes, setLoadingPromptTypes] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<PromptEditorRef | null>(null);

  const alertApi = useAlert();
  const confirm = useConfirm();

  // Ensure promptTemplate exists on prompt
  if (prompt.promptTemplate === undefined) prompt.promptTemplate = "";

  // Detect variables in template
  const detectedVariables = useMemo(() => detectVariables(prompt.promptTemplate || ""), [prompt.promptTemplate]);

  // Update prompt when initial changes
  useEffect(() => {
    const newPrompt = initial ? { ...makeDefaultPrompt(providers), ...initial } : makeDefaultPrompt(providers);
    setPrompt(newPrompt);
    setTags(parseTags(initial?.tags));
    setTagInput("");
    setSelectedVariableOccurrences(initial?.variableOccurrencesConfig || {});
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
  }, [open, initial]);

  // Focus trap inside modal when open
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const el = modalRef.current;
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
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
    setTimeout(() => first?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const update = (field: keyof Prompt, value: any) => setPrompt({ ...prompt, [field]: value });

  const loadHistory = async (promptId: number) => {
    setLoadingHistory(true);
    try {
      const result = await electronApi.promptHistory.getByPromptId(promptId, 20);
      if (result.success && result.data) {
        setPromptHistory(result.data);
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const archiveCurrentVersion = async (changeNote?: string) => {
    if (!prompt.id) {
      alertApi.show({
        message: "Cannot archive: prompt must be saved first",
        title: "Archive Error",
      });
      return;
    }

    try {
      const currentText = editorRef.current?.getValue() || prompt.promptTemplate;
      const result = await electronApi.promptHistory.create({
        promptId: prompt.id,
        provider: prompt.provider || "",
        promptTypeId: prompt.promptTypeId || 0,
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
          message: "This version is identical to the latest archived version. No new archive created.",
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
      promptTypeId: historyItem.promptTypeId,
      isActive: historyItem.isActive,
      archived: historyItem.archived,
    });
    setTags(parseTags(historyItem.tags));
    alertApi.show({
      message: "Version restored! Remember to save to apply changes.",
      title: "Restored",
    });
  };

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

  const focusVariableAt = (pos: number) => {
    if (!editorRef.current) return;

    const txt = prompt.promptTemplate || "";
    const endPos = findVariableEnd(txt, pos);

    // Important: Scroll first, THEN set selection to avoid losing selection when scrolling
    editorRef.current.focus();
    editorRef.current.scrollToPosition(pos);

    // Use requestAnimationFrame to ensure selection is set after scroll completes
    requestAnimationFrame(() => {
      editorRef.current?.setSelection(pos, endPos);
    });
  };

  const handleVariableOccurrenceSelection = (varName: string, selectedIndices: number[]) => {
    setSelectedVariableOccurrences({
      ...selectedVariableOccurrences,
      [varName]: selectedIndices,
    });
  };

  const handleSave = () => {
    const currentText = editorRef.current?.getValue() || prompt.promptTemplate;
    const finalPrompt = {
      ...prompt,
      promptTemplate: currentText,
      tags,
      variableOccurrencesConfig: selectedVariableOccurrences,
    };
    onSave(finalPrompt);
  };

  const handleArchive = async () => {
    if (prompt.id && typeof onArchive === "function") {
      onArchive(prompt.id);
      return;
    }
    if (!(await confirm({ message: "Archive this prompt?" }))) return;
    const currentText = editorRef.current?.getValue() || prompt.promptTemplate;
    const finalPrompt = {
      ...prompt,
      promptTemplate: currentText,
      tags,
      archived: true,
    };
    onSave(finalPrompt);
  };

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
              Use [VAR_NAME] or {"{VAR_NAME}"} syntax for variables
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
          {/* Left Side - Metadata */}
          <PromptMetadataForm
            prompt={prompt}
            providers={providers}
            promptTypes={promptTypes}
            loadingPromptTypes={loadingPromptTypes}
            tags={tags}
            tagInput={tagInput}
            onUpdate={update}
            onTagInputChange={setTagInput}
            onTagsChange={setTags}
          />

          {/* Center - Prompt Editor */}
          <PromptEditor
            ref={editorRef}
            value={prompt.promptTemplate || ""}
            characterCount={(prompt.promptTemplate || "").length}
            hasHistory={!!prompt.id}
            historyCount={promptHistory.length}
            showArchiveNote={showArchiveNote}
            archiveNote={archiveNote}
            onChange={(value) => update("promptTemplate", value)}
            onArchiveNoteChange={setArchiveNote}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onArchiveVersion={() => setShowArchiveNote(true)}
            onCancelArchive={() => {
              setShowArchiveNote(false);
              setArchiveNote("");
            }}
            onSaveArchive={() => {
              archiveCurrentVersion(archiveNote || undefined);
              setShowArchiveNote(false);
              setArchiveNote("");
            }}
          />

          {/* History Side Panel */}
          <PromptHistoryPanel
            visible={showHistory && !!prompt.id}
            loading={loadingHistory}
            history={promptHistory}
            onClose={() => setShowHistory(false)}
            onRestore={restoreFromHistory}
            onDelete={deleteHistoryEntry}
          />

          {/* Right Side - Variables Detection */}
          <DetectedVariablesPanel
            variables={detectedVariables}
            onJumpToVariable={focusVariableAt}
            selectedOccurrences={selectedVariableOccurrences}
            onSelectionChange={handleVariableOccurrenceSelection}
          />
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
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          {prompt.id && (
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Archive className="w-4 h-4" /> Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
