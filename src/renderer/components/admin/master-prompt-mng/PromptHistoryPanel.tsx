import React from "react";
import { History, RotateCcw, Trash2, Clock } from "lucide-react";

type HistoryItem = {
  id: number;
  promptTemplate: string;
  changeNote?: string;
  createdAt: string;
};

type Props = {
  visible: boolean;
  loading: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: number) => void;
};

const PromptHistoryPanel: React.FC<Props> = ({
  visible,
  loading,
  history,
  onClose,
  onRestore,
  onDelete,
}) => {
  if (!visible) return null;

  return (
    <aside className="w-96 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4" />
            Version History
          </h4>
          <button
            onClick={onClose}
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Loading history...
            </p>
          </div>
        ) : history.length === 0 ? (
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
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Version #{history.length - idx}
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
                    onClick={() => onRestore(item)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
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
  );
};

export default PromptHistoryPanel;
