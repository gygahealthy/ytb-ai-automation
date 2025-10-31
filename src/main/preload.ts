import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Profile APIs
  profile: {
    getAll: () => ipcRenderer.invoke("profile:getAll"),
    getById: (id: string) => ipcRenderer.invoke("profile:getById", { id }),
    create: (input: any) => ipcRenderer.invoke("profile:create", input),
    update: (id: string, updates: any) => ipcRenderer.invoke("profile:update", { id, updates }),
    delete: (id: string) => ipcRenderer.invoke("profile:delete", { id }),
    updateCredit: (id: string, amount: number) => ipcRenderer.invoke("profile:updateCredit", { id, amount }),
  },

  // Automation APIs
  automation: {
    getAll: () => ipcRenderer.invoke("automation:getAll"),
    getById: (id: string) => ipcRenderer.invoke("automation:getById", { id }),
    create: (input: any) => ipcRenderer.invoke("automation:create", input),
    start: (id: string) => ipcRenderer.invoke("automation:start", { id }),
    stop: (id: string) => ipcRenderer.invoke("automation:stop", { id }),
    // Multi-instance automation
    launch: (request: any) => ipcRenderer.invoke("automation:launch", request),
    stopInstance: (instanceId: string) => ipcRenderer.invoke("automation:stopInstance", { instanceId }),
    stopAll: () => ipcRenderer.invoke("automation:stopAll"),
    // Multi-instance getters
    get: (instanceId: string) => ipcRenderer.invoke("automation:getInstance", { instanceId }),
    getInstances: () => ipcRenderer.invoke("automation:getInstances"),
    sendMessage: (instanceId: string, message: string) => ipcRenderer.invoke("automation:sendMessage", { instanceId, message }),
    highlight: (instanceId: string) => ipcRenderer.invoke("automation:highlight", { instanceId }),
    updateConfig: (config: any) => ipcRenderer.invoke("automation:updateConfig", config),
    getConfig: () => ipcRenderer.invoke("automation:getConfig"),
    applyPreset: (preset: string) => ipcRenderer.invoke("automation:applyPreset", { preset }),
    repositionInstance: (instanceId: string) => ipcRenderer.invoke("automation:repositionInstance", { instanceId }),
    repositionAll: () => ipcRenderer.invoke("automation:repositionAll"),
    moveInstanceToSlot: (instanceId: string, slot: number) =>
      ipcRenderer.invoke("automation:moveInstanceToSlot", { instanceId, slot }),
    // Event listeners
    onInstanceRegistered: (callback: (data: any) => void) => {
      const channel = "automation:instance:registered";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    onInstanceUpdated: (callback: (data: any) => void) => {
      const channel = "automation:instance:updated";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    onInstanceStatus: (callback: (data: any) => void) => {
      const channel = "automation:instance:status";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    onInstanceUnregistered: (callback: (data: any) => void) => {
      const channel = "automation:instance:unregistered";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
  },

  // Chat Automation APIs
  chatAutomation: {
    init: (profileId: string, provider: "chatgpt" | "gemini") =>
      ipcRenderer.invoke("chatAutomation:init", { profileId, provider }),
    closeSession: (sessionId: string) => ipcRenderer.invoke("chatAutomation:closeSession", { sessionId }),
    getActiveSessions: () => ipcRenderer.invoke("chatAutomation:getActiveSessions"),
  },

  // VEO3 APIs
  veo3: {
    getAll: () => ipcRenderer.invoke("veo3:getAll"),
    getById: (id: string) => ipcRenderer.invoke("veo3:getById", { id }),
    create: (input: any) => ipcRenderer.invoke("veo3:create", input),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke("veo3:updateStatus", { id, status }),
    addScene: (projectId: string, scene: any) => ipcRenderer.invoke("veo3:addScene", { projectId, scene }),
    removeScene: (projectId: string, sceneId: string) => ipcRenderer.invoke("veo3:removeScene", { projectId, sceneId }),
    updatePrompt: (projectId: string, jsonPrompt: any) => ipcRenderer.invoke("veo3:updatePrompt", { projectId, jsonPrompt }),
    delete: (id: string) => ipcRenderer.invoke("veo3:delete", { id }),
    // Download APIs now delegated to common/video-download module
    downloadVideo: (
      videoUrl: string,
      filename?: string,
      downloadPath?: string,
      videoIndex?: number,
      settings?: { autoCreateDateFolder?: boolean; autoIndexFilename?: boolean; addEpochTimeToFilename?: boolean }
    ) => ipcRenderer.invoke("video:download:single", { videoUrl, filename, downloadPath, videoIndex, settings }),
    downloadMultipleVideos: (
      videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }>,
      downloadPath?: string,
      settings?: { autoCreateDateFolder?: boolean; autoIndexFilename?: boolean; addEpochTimeToFilename?: boolean }
    ) => ipcRenderer.invoke("video:download:batch", { videos, downloadPath, settings }),
    downloadStatus: () => ipcRenderer.invoke("video:download:status"),
    onDownloadProgress: (callback: (result: any) => void) => {
      const channel = "video:downloadProgress";
      const listener = (_event: any, result: any) => callback(result);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    // DB-only status queries (no API calls - worker thread handles API polling)
    getGenerationStatusFromDB: (generationId: string) => ipcRenderer.invoke("veo3:getGenerationStatusFromDB", { generationId }),
    getMultipleGenerationStatusFromDB: (generationIds: string[]) =>
      ipcRenderer.invoke("veo3:getMultipleGenerationStatusFromDB", { generationIds }),
    // Lightweight polling methods for frequent UI updates
    pollGenerationStatusDB: (generationId: string) => ipcRenderer.invoke("veo3:pollGenerationStatusDB", { generationId }),
    pollMultipleGenerationStatusDB: (generationIds: string[]) =>
      ipcRenderer.invoke("veo3:pollMultipleGenerationStatusDB", { generationIds }),
    // Upscale methods
    startVideoUpscale: (sourceGenerationId: string, model?: string) =>
      ipcRenderer.invoke("veo3:upscale:start", { sourceGenerationId, model }),
    checkUpscaleStatus: (upscaleId: string) => ipcRenderer.invoke("veo3:upscale:checkStatus", { upscaleId }),
    getUpscaleById: (upscaleId: string) => ipcRenderer.invoke("veo3:upscale:getById", { upscaleId }),
    getUpscalesBySourceGeneration: (sourceGenerationId: string) =>
      ipcRenderer.invoke("veo3:upscale:getBySourceGeneration", { sourceGenerationId }),
    // Project API methods
    fetchProjectsFromAPI: (profileId: string) => ipcRenderer.invoke("veo3:fetchProjectsFromAPI", { profileId }),
    createProjectViaAPI: (profileId: string, projectTitle: string) =>
      ipcRenderer.invoke("veo3:createProjectViaAPI", { profileId, projectTitle }),
    updateProjectTitleViaAPI: (profileId: string, projectId: string, projectTitle: string) =>
      ipcRenderer.invoke("veo3:updateProjectTitleViaAPI", { profileId, projectId, projectTitle }),
    // Models API methods
    syncModels: (profileId: string) => ipcRenderer.invoke("veo3:syncModels", { profileId }),
  },

  // YouTube APIs
  youtube: {
    getAllChannels: () => ipcRenderer.invoke("youtube:getAllChannels"),
    getChannelById: (id: string) => ipcRenderer.invoke("youtube:getChannelById", { id }),
    createChannel: (input: any) => ipcRenderer.invoke("youtube:createChannel", input),
    updateChannelMetrics: (id: string, metrics: any) => ipcRenderer.invoke("youtube:updateChannelMetrics", { id, metrics }),
    analyzeChannel: (id: string) => ipcRenderer.invoke("youtube:analyzeChannel", { id }),
    deleteChannel: (id: string) => ipcRenderer.invoke("youtube:deleteChannel", { id }),
    getAllVideos: () => ipcRenderer.invoke("youtube:getAllVideos"),
    getVideosByChannel: (channelId: string) => ipcRenderer.invoke("youtube:getVideosByChannel", { channelId }),
    analyzeVideo: (videoId: string, channelId: string) => ipcRenderer.invoke("youtube:analyzeVideo", { videoId, channelId }),
  },

  // Dialog APIs
  dialog: {
    selectFolder: (defaultPath?: string) => ipcRenderer.invoke("dialog:selectFolder", defaultPath),
    getDefaultProfilePath: () => ipcRenderer.invoke("dialog:getDefaultProfilePath"),
    generateUserAgent: () => ipcRenderer.invoke("dialog:generateUserAgent"),
    getDefaultChromePath: () => ipcRenderer.invoke("dialog:getDefaultChromePath"),
    selectBrowserExecutable: () => ipcRenderer.invoke("dialog:selectBrowserExecutable"),
    showOpenDialog: (options: any) => ipcRenderer.invoke("dialog:showOpenDialog", options),
  },

  // DevTools APIs
  devtools: {
    toggle: () => ipcRenderer.send("devtools:toggle"),
    open: () => ipcRenderer.send("devtools:open"),
    close: () => ipcRenderer.send("devtools:close"),
  },

  // Browser validation API
  validateBrowserPath: (path: string) => ipcRenderer.invoke("validateBrowserPath", path),

  // Master Prompts APIs
  masterPrompts: {
    getAll: () => ipcRenderer.invoke("master-prompts:getAll"),
    getById: (id: number) => ipcRenderer.invoke("master-prompts:getById", id),
    getByProvider: (provider: string) => ipcRenderer.invoke("master-prompts:getByProvider", provider),
    create: (prompt: any) => ipcRenderer.invoke("master-prompts:create", prompt),
    update: (id: number, prompt: any) => ipcRenderer.invoke("master-prompts:update", { id, updates: prompt }),
    delete: (id: number) => ipcRenderer.invoke("master-prompts:delete", id),
  },

  // AI Prompt Config APIs
  aiPromptConf: {
    getConfig: (componentName: string) => ipcRenderer.invoke("aiPromptConf:getConfig", componentName),
    getAllConfigs: () => ipcRenderer.invoke("aiPromptConf:getAllConfigs"),
    saveConfig: (request: any) => ipcRenderer.invoke("aiPromptConf:saveConfig", request),
    deleteConfig: (componentName: string) => ipcRenderer.invoke("aiPromptConf:deleteConfig", componentName),
    callAI: (request: any) => ipcRenderer.invoke("aiPromptChat:callAI", request),
  },

  // Component Discovery APIs
  componentDiscovery: {
    getComponentTreeForUI: () => ipcRenderer.invoke("componentDiscovery:getComponentTreeForUI"),
  },

  // Logger APIs
  logger: {
    onLog: (callback: (data: any) => void) => {
      const channel = "logger:log";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
  },

  // Cookies APIs
  cookies: {
    getCookiesByProfile: (profileId: string) => ipcRenderer.invoke("gemini:cookies:list", { profileId }),
    getCookie: (profileId: string, url: string) => ipcRenderer.invoke("gemini:cookies:get", { profileId, url }),
    createCookie: (profileId: string, url: string, data: any) =>
      ipcRenderer.invoke("gemini:cookies:create", {
        profileId,
        url,
        service: data.service,
        data,
      }),
    updateRotationInterval: (id: string, rotationIntervalMinutes: number) =>
      ipcRenderer.invoke("gemini:cookies:updateRotationInterval", {
        id,
        rotationIntervalMinutes,
      }),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke("gemini:cookies:updateStatus", { id, status }),
    deleteCookie: (id: string) => ipcRenderer.invoke("gemini:cookies:delete", { id }),
    deleteByProfile: (profileId: string) => ipcRenderer.invoke("gemini:cookies:deleteByProfile", { profileId }),
    getDueForRotation: () => ipcRenderer.invoke("gemini:cookies:getDueForRotation"),
    getByStatus: (status: string) => ipcRenderer.invoke("gemini:cookies:getByStatus", { status }),
    extractAndCreateCookie: (profileId: string, service: string, url: string, headless: boolean = true, rotationConfig?: any) =>
      ipcRenderer.invoke("gemini:cookies:extractAndCreate", {
        profileId,
        service,
        url,
        headless,
        rotationConfig,
      }),
  },

  // Gemini Chat APIs
  gemini: {
    chat: {
      send: (request: any) => ipcRenderer.invoke("gemini:chat:send", request),
    },
  },

  // Cookie Rotation APIs
  cookieRotation: {
    getStatus: () => ipcRenderer.invoke("cookie-rotation:get-status"),
    getProfiles: () => ipcRenderer.invoke("cookie-rotation:get-profiles"),
    // Resilient wrapper: try cookie-rotation:get-profiles-config first; if it
    // returns no data, fall back to listing all profiles so the renderer can
    // render per-profile empty states and Add Cookie actions.
    getProfilesConfig: async () => {
      try {
        const result = await ipcRenderer.invoke("cookie-rotation:get-profiles-config");
        // If the handler returned a shape like { success: true, data: [...] }, use it
        if (result && typeof result === "object" && (result.success === true || result.success === false)) {
          // If success but empty data, attempt to fall back
          if (result.success && Array.isArray(result.data) && result.data.length === 0) {
            try {
              const profiles = await ipcRenderer.invoke("profile:getAll");
              if (profiles && Array.isArray(profiles) && profiles.length > 0) {
                const mapped = profiles.map((p: any) => ({ profileId: p.id, profileName: p.name, cookies: [] }));
                return { success: true, data: mapped };
              }
            } catch (_e) {
              // ignore fallback errors
            }
          }
          return result;
        }

        // Otherwise if the direct invoke returned array (legacy), use it or fall back
        if (Array.isArray(result) && result.length === 0) {
          try {
            const profiles = await ipcRenderer.invoke("profile:getAll");
            if (profiles && Array.isArray(profiles)) {
              const mapped = profiles.map((p: any) => ({ profileId: p.id, profileName: p.name, cookies: [] }));
              return { success: true, data: mapped };
            }
          } catch (_e) {
            // ignore
          }
        }

        return { success: true, data: result };
      } catch (err) {
        // On error, attempt fallback to profile:getAll
        try {
          const profiles = await ipcRenderer.invoke("profile:getAll");
          if (profiles && Array.isArray(profiles)) {
            const mapped = profiles.map((p: any) => ({ profileId: p.id, profileName: p.name, cookies: [] }));
            return { success: true, data: mapped };
          }
        } catch (_e) {
          // final fallback - return empty
        }
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
    updateCookieConfig: (cookieId: string, config: any) =>
      ipcRenderer.invoke("cookie-rotation:update-cookie-config", cookieId, config),
    getCookieConfig: (cookieId: string) => ipcRenderer.invoke("cookie-rotation:get-cookie-config", cookieId),
    startWorker: (profileId: string, cookieId: string) => ipcRenderer.invoke("cookie-rotation:start-worker", profileId, cookieId),
    restartWorker: (profileId: string, cookieId: string) =>
      ipcRenderer.invoke("cookie-rotation:restart-worker", profileId, cookieId),
    stopWorker: (profileId: string, cookieId: string) => ipcRenderer.invoke("cookie-rotation:stop-worker", profileId, cookieId),
    stopAll: () => ipcRenderer.invoke("cookie-rotation:stop-all"),
    startAll: () => ipcRenderer.invoke("cookie-rotation:start-all"),
    // Worker log APIs
    getWorkerLogs: (cookieId: string, options?: { tail?: number; profileId?: string }) =>
      ipcRenderer.invoke("cookie-rotation:get-worker-logs", cookieId, options),
    clearWorkerLogs: (cookieId: string) => ipcRenderer.invoke("cookie-rotation:clear-worker-logs", cookieId),
    listWorkerLogFiles: () => ipcRenderer.invoke("cookie-rotation:list-worker-log-files"),
    onStatusUpdate: (callback: (data: any) => void) => {
      const channel = "cookie-rotation:status-update";
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
  },

  // Video Download APIs (common module)
  video: {
    download: {
      single: (
        videoUrl: string,
        filename?: string,
        downloadPath?: string,
        videoIndex?: number,
        settings?: { autoCreateDateFolder?: boolean; autoIndexFilename?: boolean; addEpochTimeToFilename?: boolean }
      ) => ipcRenderer.invoke("video:download:single", { videoUrl, filename, downloadPath, videoIndex, settings }),
      batch: (
        videos: Array<{ videoUrl: string; filename?: string; videoIndex?: number }>,
        downloadPath?: string,
        settings?: { autoCreateDateFolder?: boolean; autoIndexFilename?: boolean; addEpochTimeToFilename?: boolean }
      ) => ipcRenderer.invoke("video:download:batch", { videos, downloadPath, settings }),
      status: () => ipcRenderer.invoke("video:download:status"),
    },
  },

  // Image VEO3 APIs (image gallery)
  imageVeo3: {
    upload: (profileId: string, imagePath: string, localStoragePath: string, aspectRatio?: string) =>
      ipcRenderer.invoke("image-veo3:upload", { profileId, imagePath, localStoragePath, aspectRatio }),
    fetchUserImages: (profileId: string, pageSize?: number, cursor?: string | null) =>
      ipcRenderer.invoke("image-veo3:fetch-user-images", { profileId, pageSize, cursor }),
    syncMetadata: (profileId: string) => ipcRenderer.invoke("image-veo3:sync-metadata", { profileId }),
    forceRefresh: (profileId: string) => ipcRenderer.invoke("image-veo3:force-refresh", { profileId }),
    downloadSingle: (profileId: string, imageName: string, localStoragePath: string) =>
      ipcRenderer.invoke("image-veo3:download-single", { profileId, imageName, localStoragePath }),
    downloadBatch: (profileId: string, imageNames: string[], localStoragePath: string) =>
      ipcRenderer.invoke("image-veo3:download-batch", { profileId, imageNames, localStoragePath }),
    getLocalImages: (profileId: string) => ipcRenderer.invoke("image-veo3:get-local-images", { profileId }),
    deleteImage: (imageId: string, profileId: string) => ipcRenderer.invoke("image-veo3:delete", { imageId, profileId }),
    readImageFile: (filePath: string) => ipcRenderer.invoke("image-veo3:read-image-file", { filePath }),
    getFileSize: (filePath: string) => ipcRenderer.invoke("image-veo3:get-file-size", { filePath }),
    // Deprecated - use syncMetadata + downloadBatch instead
    syncFromFlow: (profileId: string, localStoragePath: string) =>
      ipcRenderer.invoke("image-veo3:sync-metadata", { profileId }).then(async (metadataResult: any) => {
        if (!metadataResult.success) return metadataResult;
        // Auto-download all synced images for backward compatibility
        const images = await ipcRenderer.invoke("image-veo3:get-local-images", { profileId });
        if (!images.success)
          return { success: true, data: { synced: metadataResult.data.synced, skipped: metadataResult.data.skipped } };
        const pendingImages = images.data.filter((img: any) => !img.localPath).map((img: any) => img.name);
        if (pendingImages.length === 0)
          return { success: true, data: { synced: metadataResult.data.synced, skipped: metadataResult.data.skipped } };
        const downloadResult = await ipcRenderer.invoke("image-veo3:download-batch", {
          profileId,
          imageNames: pendingImages,
          localStoragePath,
        });
        return {
          success: true,
          data: { synced: downloadResult.data?.downloaded || 0, skipped: metadataResult.data.skipped },
        };
      }),
  },

  // Generic invoke for other channels
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),

  // Generic event listener methods for IPC events
  on: (channel: string, callback: (...args: any[]) => void) => {
    const listener = (_event: any, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },
});
