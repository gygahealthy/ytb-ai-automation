import { useRef, forwardRef, useImperativeHandle } from "react";
import { History, Archive } from "lucide-react";

type Props = {
  value: string;
  characterCount: number;
  hasHistory: boolean;
  historyCount: number;
  showArchiveNote: boolean;
  archiveNote: string;
  onChange: (value: string) => void;
  onArchiveNoteChange: (value: string) => void;
  onToggleHistory: () => void;
  onArchiveVersion: () => void;
  onCancelArchive: () => void;
  onSaveArchive: () => void;
};

export type PromptEditorRef = {
  focus: () => void;
  setSelection: (start: number, end: number) => void;
  scrollToPosition: (position: number) => void;
  getValue: () => string;
};

const PromptEditor = forwardRef<PromptEditorRef, Props>(
  (
    {
      value,
      characterCount,
      hasHistory,
      historyCount,
      showArchiveNote,
      archiveNote,
      onChange,
      onArchiveNoteChange,
      onToggleHistory,
      onArchiveVersion,
      onCancelArchive,
      onSaveArchive,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          // Ensure the element is focused before setting selection. Use
          // requestAnimationFrame to avoid a race where focus causes the
          // browser to reset selection immediately after we set it.
          if (document.activeElement !== textareaRef.current) {
            textareaRef.current.focus();
            requestAnimationFrame(() => {
              textareaRef.current?.setSelectionRange(start, end);
            });
          } else {
            textareaRef.current.setSelectionRange(start, end);
          }
        }
      },
      scrollToPosition: (position: number) => {
        if (!textareaRef.current) return;

        const ta = textareaRef.current;

        // Compute line index for the given character position
        const textBefore = ta.value.substring(0, position);
        const lineIndex = textBefore.split("\n").length - 1; // zero-based

        // Compute a more accurate line height. Try to read from computed style;
        // fallback to measurement if not available.
        const computed = window.getComputedStyle(ta);
        let lineHeight = parseFloat(computed.lineHeight || "0");
        if (!lineHeight || Number.isNaN(lineHeight)) {
          // Create a temporary span to measure single line height using same font
          const div = document.createElement("div");
          div.style.position = "absolute";
          div.style.visibility = "hidden";
          div.style.whiteSpace = "nowrap";
          div.style.font =
            computed.font || `${computed.fontSize} ${computed.fontFamily}`;
          div.textContent = "A";
          document.body.appendChild(div);
          lineHeight = div.getBoundingClientRect().height || 24;
          document.body.removeChild(div);
        }

        // Compute desired scrollTop so the target line is vertically centered
        const targetTop = lineIndex * lineHeight;
        const newScrollTop = Math.max(
          0,
          targetTop - ta.clientHeight / 2 + lineHeight / 2
        );

        ta.scrollTop = newScrollTop;
      },
      getValue: () => {
        return textareaRef.current?.value || value;
      },
    }));

    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Prompt Template
            </label>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {characterCount} characters
              </div>
              {hasHistory && (
                <>
                  <button
                    onClick={onToggleHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    title="View version history"
                  >
                    <History className="w-3.5 h-3.5" />
                    History ({historyCount})
                  </button>
                  {showArchiveNote ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={archiveNote}
                        onChange={(e) => onArchiveNoteChange(e.target.value)}
                        placeholder="Optional note for this version"
                        className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
                      />
                      <button
                        onClick={onSaveArchive}
                        className="px-2 py-1 rounded-md bg-indigo-600 text-white text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={onCancelArchive}
                        className="px-2 py-1 rounded-md bg-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onArchiveVersion}
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
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full px-4 py-3 font-mono text-sm leading-relaxed resize-none outline-none bg-transparent text-slate-900 dark:text-slate-100"
              placeholder="Enter your prompt template here... Use [VARIABLE_NAME] or {VARIABLE_NAME} for variables."
            />
          </div>
        </div>
      </div>
    );
  }
);

PromptEditor.displayName = "PromptEditor";

export default PromptEditor;
