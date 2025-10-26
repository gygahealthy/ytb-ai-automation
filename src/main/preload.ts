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
    getProfilesConfig: () => ipcRenderer.invoke("cookie-rotation:get-profiles-config"),
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
