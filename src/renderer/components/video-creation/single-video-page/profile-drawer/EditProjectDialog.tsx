import { Edit2, X } from "lucide-react";

interface EditProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  newTitle: string;
  isLoading: boolean;
  onTitleChange: (title: string) => void;
  onUpdate: () => void;
  onClose: () => void;
}

export default function EditProjectDialog({
  isOpen,
  projectName,
  newTitle,
  isLoading,
  onTitleChange,
  onUpdate,
  onClose,
}: EditProjectDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Edit Project Title
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Current Title</label>
          <p className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-gray-900 dark:text-white text-sm">{projectName}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">New Title</label>
          <input
            type="text"
            placeholder="Enter new title..."
            value={newTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isLoading) {
                onUpdate();
              }
            }}
            disabled={isLoading}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onUpdate}
            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={isLoading || !newTitle.trim() || newTitle === projectName}
          >
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
