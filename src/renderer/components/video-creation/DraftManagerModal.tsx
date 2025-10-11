import { FileText, Trash2, X } from "lucide-react";
import { JsonDraft } from "../../types/video-creation.types";

interface DraftManagerModalProps {
  isOpen: boolean;
  drafts: JsonDraft[];
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DraftManagerModal({ isOpen, drafts, onClose, onLoad, onDelete }: DraftManagerModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Load Draft</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {drafts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No saved drafts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-primary-500" />
                          <span className="font-medium text-gray-900 dark:text-white">{draft.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {draft.prompts.length} prompt{draft.prompts.length !== 1 ? "s" : ""}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p>Created: {new Date(draft.createdAt).toLocaleString()}</p>
                          <p>Updated: {new Date(draft.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            onLoad(draft.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete draft "${draft.name}"?`)) {
                              onDelete(draft.id);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
