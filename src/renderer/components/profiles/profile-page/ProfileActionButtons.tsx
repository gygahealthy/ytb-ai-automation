import { Edit, Trash2, MessageSquare } from "lucide-react";

interface ProfileActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  onOpenChatModal?: () => void;
}

export default function ProfileActionButtons({ onEdit, onDelete, onOpenChatModal }: ProfileActionButtonsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
      </button>

      {/* Chat Test Button */}
      {onOpenChatModal && (
        <button
          onClick={onOpenChatModal}
          className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          title="Test Chat"
        >
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}
    </div>
  );
}
