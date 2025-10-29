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

const updateProjectTitleViaAPI = (profileId: string, projectId: string, projectTitle: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.updateProjectTitleViaAPI === "function")
    return safeCall(() => (window as any).electronAPI.veo3.updateProjectTitleViaAPI(profileId, projectId, projectTitle));
  if (hasInvoke()) return invoke("veo3:updateProjectTitleViaAPI", { profileId, projectId, projectTitle });
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

// New optimized video history methods with pagination
const getVideoHistory = (
  page?: number,
  pageSize?: number,
  filter?: {
    status?: "all" | "pending" | "processing" | "completed" | "failed";
    profileId?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getVideoHistory === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getVideoHistory(page, pageSize, filter));
  if (hasInvoke()) return invoke("veo3:getVideoHistory", { page, pageSize, filter });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getVideoHistoryGroupedByDate = (
  page?: number,
  pageSize?: number,
  filter?: {
    status?: "all" | "pending" | "processing" | "completed" | "failed";
    profileId?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getVideoHistoryGroupedByDate === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getVideoHistoryGroupedByDate(page, pageSize, filter));
  if (hasInvoke()) return invoke("veo3:getVideoHistoryGroupedByDate", { page, pageSize, filter });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getStatusCounts = (profileId?: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getStatusCounts === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getStatusCounts(profileId));
  if (hasInvoke()) return invoke("veo3:getStatusCounts", { profileId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

// DB-only status queries (no API calls - worker thread handles API polling)
const getGenerationStatusFromDB = (generationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getGenerationStatusFromDB === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getGenerationStatusFromDB(generationId));
  if (hasInvoke()) return invoke("veo3:getGenerationStatusFromDB", { generationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getMultipleGenerationStatusFromDB = (generationIds: string[]) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.veo3 &&
    typeof (window as any).electronAPI.veo3.getMultipleGenerationStatusFromDB === "function"
  )
    return safeCall(() => (window as any).electronAPI.veo3.getMultipleGenerationStatusFromDB(generationIds));
  if (hasInvoke()) return invoke("veo3:getMultipleGenerationStatusFromDB", { generationIds });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

// Lightweight polling methods for frequent UI updates (same as DB queries, but semantically for polling)
const pollGenerationStatusDB = (generationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.pollGenerationStatusDB === "function")
    return safeCall(() => (window as any).electronAPI.veo3.pollGenerationStatusDB(generationId));
  if (hasInvoke()) return invoke("veo3:pollGenerationStatusDB", { generationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const pollMultipleGenerationStatusDB = (generationIds: string[]) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.pollMultipleGenerationStatusDB === "function")
    return safeCall(() => (window as any).electronAPI.veo3.pollMultipleGenerationStatusDB(generationIds));
  if (hasInvoke()) return invoke("veo3:pollMultipleGenerationStatusDB", { generationIds });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

// Upscale methods
const startVideoUpscale = (sourceGenerationId: string, model?: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.startVideoUpscale === "function")
    return safeCall(() => (window as any).electronAPI.veo3.startVideoUpscale(sourceGenerationId, model));
  if (hasInvoke()) return invoke("veo3:upscale:start", { sourceGenerationId, model });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const checkUpscaleStatus = (upscaleId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.checkUpscaleStatus === "function")
    return safeCall(() => (window as any).electronAPI.veo3.checkUpscaleStatus(upscaleId));
  if (hasInvoke()) return invoke("veo3:upscale:checkStatus", { upscaleId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getUpscaleById = (upscaleId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getUpscaleById === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getUpscaleById(upscaleId));
  if (hasInvoke()) return invoke("veo3:upscale:getById", { upscaleId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getUpscalesBySourceGeneration = (sourceGenerationId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: "ipc-not-available" });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getUpscalesBySourceGeneration === "function")
    return safeCall(() => (window as any).electronAPI.veo3.getUpscalesBySourceGeneration(sourceGenerationId));
  if (hasInvoke()) return invoke("veo3:upscale:getBySourceGeneration", { sourceGenerationId });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

export default {
  fetchProjectsFromAPI,
  createProjectViaAPI,
  updateProjectTitleViaAPI,
  getAll,
  startVideoGeneration,
  checkGenerationStatus,
  listGenerations,
  listGenerationsByProfile,
  getGenerationById,
  refreshVideoStatus,
  generateMultipleVideosAsync,
  onMultipleVideosProgress,
  // New optimized methods
  getVideoHistory,
  getVideoHistoryGroupedByDate,
  getStatusCounts,
  // DB-only status queries (no API calls - worker thread handles API polling)
  getGenerationStatusFromDB,
  getMultipleGenerationStatusFromDB,
  // Lightweight polling methods for UI updates
  pollGenerationStatusDB,
  pollMultipleGenerationStatusDB,
  // Upscale methods
  startVideoUpscale,
  checkUpscaleStatus,
  getUpscaleById,
  getUpscalesBySourceGeneration,
};
