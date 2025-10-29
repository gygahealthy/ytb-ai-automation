import { Edit2, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  disabled?: boolean;
}

export default function ProjectCard({ project, isSelected, onSelect, onEdit, disabled }: ProjectCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
      disabled={disabled}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FolderOpen className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500 dark:text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
            {project.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isSelected && <div className="text-green-500 font-bold">✓</div>}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
            title="Edit project title"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
