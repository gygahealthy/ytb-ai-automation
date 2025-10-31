import { Plus, RefreshCw } from "lucide-react";
import ProjectCard from "./ProjectCard";

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProjectsListProps {
  projects: Project[];
  selectedProjectId: string | null | undefined;
  loading: boolean;
  onProjectSelect: (projectId: string) => void;
  onProjectEdit: (projectId: string) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export default function ProjectsList({
  projects,
  selectedProjectId,
  loading,
  onProjectSelect,
  onProjectEdit,
  onCreateNew,
  onRefresh,
}: ProjectsListProps) {
  return (
    <div className="mt-2 ml-4 space-y-1.5">
      {loading && projects.length === 0 ? (
        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-xs">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-2 text-center text-gray-500 dark:text-gray-400 text-xs">No projects found</div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProjectId === project.id}
              onSelect={() => onProjectSelect(project.id)}
              onEdit={() => onProjectEdit(project.id)}
              disabled={loading}
            />
          ))}
        </div>
      )}

      {/* Refresh and Create New Buttons */}
      <div className="flex gap-2 pt-1.5">
        <button
          onClick={onRefresh}
          className="flex-1 px-3 py-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
          disabled={loading}
          title="Refresh projects list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>

        <button
          onClick={onCreateNew}
          className="flex-1 px-3 py-1.5 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
          disabled={loading}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New</span>
        </button>
      </div>
    </div>
  );
}
