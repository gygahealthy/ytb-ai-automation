import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAlert } from "../../../hooks/useAlert";
import profileIPC from "../../../ipc/profile";
import veo3IPC from "../../../ipc/veo3";
import useVeo3Store from "../../../store/veo3.store";
import ProfileCard from "./profile-drawer/ProfileCard";
import ProjectsList from "./profile-drawer/ProjectsList";
import CreateProjectDialog from "./profile-drawer/CreateProjectDialog";
import EditProjectDialog from "./profile-drawer/EditProjectDialog";
import AuthErrorDialog from "./profile-drawer/AuthErrorDialog";

interface Profile {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProfileDrawerProps {
  initialProfileId?: string | null;
  initialProjectId?: string | null;
  onApply: (profileId?: string | null, projectId?: string | null) => void;
  onClose?: () => void;
}

export default function ProfileDrawer({ initialProfileId, initialProjectId, onApply, onClose }: ProfileDrawerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [localProfileId, setLocalProfileId] = useState<string | null | undefined>(initialProfileId);
  const [localProjectId, setLocalProjectId] = useState<string | null | undefined>(initialProjectId);
  const [loading, setLoading] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(initialProfileId || null);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [updatingProject, setUpdatingProject] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string>("");
  const { show: showAlert } = useAlert();

  useEffect(() => {
    void fetchProfiles();
  }, []);

  useEffect(() => {
    if (expandedProfileId) {
      void fetchProjects(expandedProfileId);
    } else {
      setProjects([]);
    }
  }, [expandedProfileId]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await profileIPC.getAll();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error("[ProfileDrawer] Failed to fetch profiles", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (profileId: string, forceRefresh = false) => {
    setLoading(true);
    try {
      // Only use cache if not forcing refresh and cache has data
      if (!forceRefresh) {
        const cached = useVeo3Store.getState().getProjectsForProfile(profileId);
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

      const response = await veo3IPC.fetchProjectsFromAPI(profileId);
      if (response && response.success && response.data) {
        // response.data is already an array of projects from the API
        const projectsArr = Array.isArray(response.data) ? response.data : [];
        console.log(`[ProfileDrawer] Received ${projectsArr.length} projects from API`);

        // Cache the raw API response
        useVeo3Store.getState().setProjectsForProfile(profileId, projectsArr);

        // Transform for UI display
        const transformed = projectsArr.map((p: any) => ({
          id: p.projectId || p.id,
          name: p.projectInfo?.projectTitle || p.title || p.projectTitle || p.name,
          description: p.description || "",
        }));
        console.log(`[ProfileDrawer] Transformed projects:`, transformed);
        setProjects(transformed);
      } else {
        const errorMsg = response?.error || "Unknown error";
        setProjects([]);

        if (
          errorMsg.includes("401") ||
          errorMsg.includes("Unauthorized") ||
          errorMsg.includes("cookies") ||
          errorMsg.includes("expired")
        ) {
          console.log(`[ProfileDrawer] Authentication error detected for profile: ${profileId}`);
          setAuthErrorMessage(errorMsg);
          setShowAuthDialog(true);
        } else {
          showAlert({
            title: "Failed to Fetch Projects",
            message: errorMsg,
            severity: "error",
            duration: null,
          });
        }
      }
    } catch (error) {
      console.error("[ProfileDrawer] Failed to fetch projects", error);
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
    if (!newProjectTitle.trim() || !expandedProfileId) {
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
      const response = await veo3IPC.createProjectViaAPI(expandedProfileId, newProjectTitle.trim());
      if (response && response.success) {
        showAlert({
          title: "Success",
          message: `Project "${newProjectTitle}" created successfully`,
          severity: "success",
          duration: 3,
        });
        setNewProjectTitle("");
        setShowCreateProjectDialog(false);
        // Refresh projects list with force refresh
        await fetchProjects(expandedProfileId, true);
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
      console.error("[ProfileDrawer] Failed to create project", error);
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
    if (!editProjectTitle.trim() || !editingProjectId || !expandedProfileId) {
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
      const response = await veo3IPC.updateProjectTitleViaAPI(expandedProfileId, editingProjectId, editProjectTitle.trim());
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
        // Refresh projects list with force refresh
        await fetchProjects(expandedProfileId, true);
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
      console.error("[ProfileDrawer] Failed to update project", error);
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

  const handleApply = () => {
    onApply(localProfileId ?? null, localProjectId ?? null);
    onClose?.();
  };

  const selectedProfile = profiles.find((p) => p.id === localProfileId);
  const selectedProject = projects.find((p) => p.id === localProjectId);

  return (
    <>
      <div className="space-y-4 p-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <User className="w-4 h-4" />
            <span>Select Profile</span>
          </label>

          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id}>
                <ProfileCard
                  profile={profile}
                  isExpanded={expandedProfileId === profile.id}
                  isSelected={localProfileId === profile.id}
                  onToggleExpand={() => setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id)}
                  disabled={loading}
                />

                {expandedProfileId === profile.id && (
                  <ProjectsList
                    projects={projects}
                    selectedProjectId={localProjectId}
                    loading={loading}
                    onProjectSelect={(projectId) => {
                      setLocalProfileId(profile.id);
                      setLocalProjectId(projectId);
                    }}
                    onProjectEdit={handleOpenEditDialog}
                    onCreateNew={() => setShowCreateProjectDialog(true)}
                    onRefresh={() => fetchProjects(profile.id, true)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedProfile && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Selected Profile:</strong> {selectedProfile.name}
              {selectedProject && <strong className="block mt-1">Selected Project:</strong>}
              {selectedProject && <span className="block text-blue-800 dark:text-blue-200">{selectedProject.name}</span>}
            </p>
          </div>
        )}

        <button
          onClick={handleApply}
          className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          disabled={!localProfileId}
        >
          Apply Selection
        </button>
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

      <AuthErrorDialog
        isOpen={showAuthDialog}
        errorMessage={authErrorMessage}
        onClose={() => {
          setShowAuthDialog(false);
          setAuthErrorMessage("");
        }}
      />
    </>
  );
}
