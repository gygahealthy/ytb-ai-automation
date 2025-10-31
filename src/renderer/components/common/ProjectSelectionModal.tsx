import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAlert } from "../../hooks/useAlert";
import veo3IPC from "../../ipc/veo3";
import useVeo3Store from "../../store/veo3.store";
import ProjectsList from "../video-creation/single-video-page/profile-drawer/ProjectsList";
import CreateProjectDialog from "../video-creation/single-video-page/profile-drawer/CreateProjectDialog";
import EditProjectDialog from "../video-creation/single-video-page/profile-drawer/EditProjectDialog";

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProjectSelectionModalProps {
  isOpen: boolean;
  profileId: string;
  profileName?: string;
  serviceType: "gemini" | "flow";
  onConfirm: (projectId: string | null) => void;
  onClose: () => void;
}

export default function ProjectSelectionModal({
  isOpen,
  profileId,
  profileName,
  serviceType,
  onConfirm,
  onClose,
}: ProjectSelectionModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [updatingProject, setUpdatingProject] = useState(false);
  const { show: showAlert } = useAlert();
  const veo3Store = useVeo3Store();

  useEffect(() => {
    if (isOpen && profileId) {
      void fetchProjects(profileId);
    }
  }, [isOpen, profileId]);

  const fetchProjects = async (profId: string, forceRefresh = false) => {
    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = veo3Store.getProjectsForProfile(profId);
        if (cached && cached.length > 0) {
          const transformed = cached.map((p: any) => ({
            id: p.projectId || p.id,
            name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
            description: p.description || "",
          }));
          setProjects(transformed);
          setLoading(false);
          return;
        }
      }

      const response = await veo3IPC.fetchProjectsFromAPI(profId);
      if (response && response.success && response.data) {
        const projectsArr = Array.isArray(response.data) ? response.data : [];
        veo3Store.setProjectsForProfile(profId, projectsArr);

        const transformed = projectsArr.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        setProjects(transformed);
      } else {
        const errorMsg = response?.error || "Unknown error";
        setProjects([]);
        showAlert({
          title: "Failed to Fetch Projects",
          message: errorMsg,
          severity: "error",
          duration: null,
        });
      }
    } catch (error) {
      console.error("[ProjectSelectionModal] Failed to fetch projects", error);
      showAlert({
        title: "Error",
        message: `Failed to fetch projects: ${String(error)}`,
        severity: "error",
        duration: null,
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || !profileId) {
      showAlert({
        title: "Invalid Input",
        message: "Please enter a project title",
        severity: "error",
        duration: 3,
      });
      return;
    }

    setCreatingProject(true);
    try {
      const response = await veo3IPC.createProjectViaAPI(profileId, newProjectTitle.trim());
      if (response && response.success) {
        showAlert({
          title: "Success",
          message: `Project "${newProjectTitle}" created successfully`,
          severity: "success",
          duration: 3,
        });
        setNewProjectTitle("");
        setShowCreateProjectDialog(false);
        await fetchProjects(profileId, true);
      } else {
        const errorMsg = response?.error || "Failed to create project";
        showAlert({
          title: "Failed to Create Project",
          message: errorMsg,
          severity: "error",
          duration: null,
        });
      }
    } catch (error) {
      console.error("[ProjectSelectionModal] Failed to create project", error);
      showAlert({
        title: "Error",
        message: `Error creating project: ${String(error)}`,
        severity: "error",
        duration: null,
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleEditProject = async () => {
    if (!editProjectTitle.trim() || !editingProjectId || !profileId) {
      showAlert({
        title: "Invalid Input",
        message: "Please enter a new project title",
        severity: "error",
        duration: 3,
      });
      return;
    }

    const currentProject = projects.find((p) => p.id === editingProjectId);
    if (editProjectTitle === currentProject?.name) {
      showAlert({
        title: "No Changes",
        message: "The new title is the same as the current one",
        severity: "info",
        duration: 3,
      });
      return;
    }

    setUpdatingProject(true);
    try {
      const response = await veo3IPC.updateProjectTitleViaAPI(profileId, editingProjectId, editProjectTitle.trim());
      if (response && response.success) {
        showAlert({
          title: "Success",
          message: `Project title updated to "${editProjectTitle}"`,
          severity: "success",
          duration: 3,
        });
        setEditProjectTitle("");
        setEditingProjectId(null);
        setShowEditProjectDialog(false);
        await fetchProjects(profileId, true);
      } else {
        const errorMsg = response?.error || "Failed to update project title";
        showAlert({
          title: "Failed to Update Project",
          message: errorMsg,
          severity: "error",
          duration: null,
        });
      }
    } catch (error) {
      console.error("[ProjectSelectionModal] Failed to update project", error);
      showAlert({
        title: "Error",
        message: `Error updating project: ${String(error)}`,
        severity: "error",
        duration: null,
      });
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleOpenEditDialog = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setEditingProjectId(projectId);
      setEditProjectTitle(project.name);
      setShowEditProjectDialog(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedProjectId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Project for Default {serviceType === "gemini" ? "Gemini" : "Flow"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Profile: <strong>{profileName || "Unknown"}</strong>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <ProjectsList
              projects={projects}
              selectedProjectId={selectedProjectId}
              loading={loading}
              onProjectSelect={setSelectedProjectId}
              onProjectEdit={handleOpenEditDialog}
              onCreateNew={() => setShowCreateProjectDialog(true)}
              onRefresh={() => fetchProjects(profileId, true)}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedProjectId}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>

      <CreateProjectDialog
        isOpen={showCreateProjectDialog}
        title={newProjectTitle}
        isLoading={creatingProject}
        onTitleChange={setNewProjectTitle}
        onCreate={handleCreateProject}
        onClose={() => {
          setShowCreateProjectDialog(false);
          setNewProjectTitle("");
        }}
      />

      <EditProjectDialog
        isOpen={showEditProjectDialog}
        projectName={projects.find((p) => p.id === editingProjectId)?.name || ""}
        newTitle={editProjectTitle}
        isLoading={updatingProject}
        onTitleChange={setEditProjectTitle}
        onUpdate={handleEditProject}
        onClose={() => {
          setShowEditProjectDialog(false);
          setEditProjectTitle("");
          setEditingProjectId(null);
        }}
      />
    </>
  );
}
