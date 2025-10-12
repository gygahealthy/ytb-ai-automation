import { hasInvoke, hasWindow, invoke, safeCall } from "./invoke";

const fetchProjectsFromAPI = (profileId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.fetchProjectsFromAPI === "function")
    return safeCall(() => (window as any).electronAPI.veo3.fetchProjectsFromAPI(profileId));
  if (hasInvoke()) return invoke("veo3:fetchProjectsFromAPI", { profileId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const createProjectViaAPI = (profileId: string, projectTitle: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.createProjectViaAPI === "function")
    return safeCall(() => (window as any).electronAPI.veo3.createProjectViaAPI(profileId, projectTitle));
  if (hasInvoke()) return invoke("veo3:createProjectViaAPI", { profileId, projectTitle });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getAll = () => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getAll === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getAll());
  if (hasInvoke()) return invoke("veo3:getAll");
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const startVideoGeneration = (
  profileId: string,
  projectId: string,
  prompt: string,
  aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE"
) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.startVideoGeneration === "function")
    return safeCall(() => (window as any).electronAPI.veo3.startVideoGeneration(profileId, projectId, prompt, aspectRatio));
  if (hasInvoke()) return invoke("veo3:startVideoGeneration", { profileId, projectId, prompt, aspectRatio });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const checkGenerationStatus = (generationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.checkGenerationStatus === "function")
    return safeCall(() => (window as any).electronAPI.veo3.checkGenerationStatus(generationId));
  if (hasInvoke()) return invoke("veo3:checkGenerationStatus", { generationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const listGenerations = (limit?: number, offset?: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.listGenerations === "function")
    return safeCall(() => (window as any).electronAPI.veo3.listGenerations(limit, offset));
  if (hasInvoke()) return invoke("veo3:listGenerations", { limit, offset });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const listGenerationsByProfile = (profileId: string, limit?: number, offset?: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.listGenerationsByProfile === "function")
    return safeCall(() => (window as any).electronAPI.veo3.listGenerationsByProfile(profileId, limit, offset));
  if (hasInvoke()) return invoke("veo3:listGenerationsByProfile", { profileId, limit, offset });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getGenerationById = (generationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getGenerationById === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getGenerationById(generationId));
  if (hasInvoke()) return invoke("veo3:getGenerationById", { generationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const refreshVideoStatus = (operationName: string, generationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.refreshVideoStatus === "function")
    return safeCall(() => (window as any).electronAPI.veo3.refreshVideoStatus(operationName, generationId));
  if (hasInvoke()) return invoke("veo3:refreshVideoStatus", { operationName, generationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const generateMultipleVideosAsync = (
  requests: Array<{
    promptId: string;
    profileId: string;
    projectId: string;
    prompt: string;
    aspectRatio?: "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" | "VIDEO_ASPECT_RATIO_SQUARE";
  }>,
  delayMs?: number
) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.generateMultipleVideosAsync === "function")
    return safeCall(() => (window as any).electronAPI.veo3.generateMultipleVideosAsync(requests, delayMs));
  if (hasInvoke()) return invoke("veo3:generateMultipleVideosAsync", { requests, delayMs });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const onMultipleVideosProgress = (
  callback: (progress: {
    promptId: string;
    success: boolean;
    generationId?: string;
    sceneId?: string;
    operationName?: string;
    error?: string;
    index: number;
    total: number;
  }) => void
) => {
  if (!hasWindow()) return () => {};

  const handler = (_event: any, progress: any) => {
    callback(progress);
  };

  if ((window as any).electronAPI && (window as any).electronAPI.on) {
    (window as any).electronAPI.on("veo3:multipleVideos:progress", handler);
    return () => (window as any).electronAPI.removeListener("veo3:multipleVideos:progress", handler);
  }

  return () => {};
};

export default {
  fetchProjectsFromAPI,
  createProjectViaAPI,
  getAll,
  startVideoGeneration,
  checkGenerationStatus,
  listGenerations,
  listGenerationsByProfile,
  getGenerationById,
  refreshVideoStatus,
  generateMultipleVideosAsync,
  onMultipleVideosProgress,
};
