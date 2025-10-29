/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    profile: {
      getAll: () => Promise<any>;
      getById: (id: string) => Promise<any>;
      create: (input: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<any>;
      updateCredit: (id: string, amount: number) => Promise<any>;
      login: (id: string) => Promise<any>;
    };
    automation: {
      getAll: () => Promise<any>;
      getById: (id: string) => Promise<any>;
      create: (input: any) => Promise<any>;
      start: (id: string) => Promise<any>;
      stop: (id: string) => Promise<any>;
      // Multi-instance automation APIs
      launch: (request: any) => Promise<any>;
      stopInstance: (instanceId: string) => Promise<any>;
      stopAll: () => Promise<any>;
      get: (instanceId: string) => Promise<any>;
      getInstances: () => Promise<any>;
      sendMessage: (instanceId: string, message: string) => Promise<any>;
      highlight: (instanceId: string) => Promise<any>;
      updateConfig: (config: any) => Promise<any>;
      getConfig: () => Promise<any>;
      repositionInstance: (instanceId: string) => Promise<any>;
      repositionAll: () => Promise<any>;
      applyPreset: (preset: string) => Promise<any>;
      onInstanceRegistered: (callback: (data: any) => void) => () => void;
      onInstanceUpdated: (callback: (data: any) => void) => () => void;
      onInstanceStatus: (callback: (data: any) => void) => () => void;
      onInstanceUnregistered: (callback: (data: any) => void) => () => void;
    };
    chatAutomation: {
      init: (profileId: string, provider: "chatgpt" | "gemini") => Promise<any>;
      sendMessage: (sessionId: string, message: string) => Promise<any>;
      closeSession: (sessionId: string) => Promise<any>;
      getActiveSessions: () => Promise<any>;
    };
    veo3: {
      getAll: () => Promise<any>;
      getById: (id: string) => Promise<any>;
      create: (input: any) => Promise<any>;
      updateStatus: (id: string, status: string) => Promise<any>;
      addScene: (projectId: string, scene: any) => Promise<any>;
      removeScene: (projectId: string, sceneId: string) => Promise<any>;
      updatePrompt: (projectId: string, jsonPrompt: any) => Promise<any>;
      delete: (id: string) => Promise<any>;
      downloadVideo: (videoUrl: string, filename?: string, downloadPath?: string) => Promise<any>;
      downloadMultipleVideos: (videos: Array<{ videoUrl: string; filename?: string }>, downloadPath?: string) => Promise<any>;
      downloadStatus: () => Promise<any>;
      onDownloadProgress: (callback: (result: any) => void) => () => void;
      // DB-only status queries (no API calls - worker thread handles API polling)
      getGenerationStatusFromDB: (generationId: string) => Promise<any>;
      getMultipleGenerationStatusFromDB: (generationIds: string[]) => Promise<any>;
      // Lightweight polling methods for frequent UI updates
      pollGenerationStatusDB: (generationId: string) => Promise<any>;
      pollMultipleGenerationStatusDB: (generationIds: string[]) => Promise<any>;
      // Upscale methods
      startVideoUpscale: (sourceGenerationId: string, model?: string) => Promise<any>;
      checkUpscaleStatus: (upscaleId: string) => Promise<any>;
      getUpscaleById: (upscaleId: string) => Promise<any>;
      getUpscalesBySourceGeneration: (sourceGenerationId: string) => Promise<any>;
    };
    youtube: {
      getAllChannels: () => Promise<any>;
      getChannelById: (id: string) => Promise<any>;
      createChannel: (input: any) => Promise<any>;
      updateChannelMetrics: (id: string, metrics: any) => Promise<any>;
      analyzeChannel: (id: string) => Promise<any>;
      deleteChannel: (id: string) => Promise<any>;
      getAllVideos: () => Promise<any>;
      getVideosByChannel: (channelId: string) => Promise<any>;
      analyzeVideo: (videoId: string, channelId: string) => Promise<any>;
    };
    dialog: {
      selectFolder: (defaultPath?: string) => Promise<any>;
      getDefaultProfilePath: () => Promise<any>;
      generateUserAgent: () => Promise<any>;
      getDefaultChromePath: () => Promise<any>;
      selectBrowserExecutable: () => Promise<any>;
      showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>;
    };
    masterPrompts: {
      getAll: () => Promise<any>;
      getById: (id: number) => Promise<any>;
      getByProvider: (provider: string) => Promise<any>;
      create: (prompt: any) => Promise<any>;
      update: (id: number, prompt: any) => Promise<any>;
      delete: (id: number) => Promise<any>;
    };
    aiPromptConf: {
      getConfig: (componentName: string) => Promise<any>;
      getAllConfigs: () => Promise<any>;
      saveConfig: (request: any) => Promise<any>;
      deleteConfig: (componentName: string) => Promise<any>;
      callAI: (request: any) => Promise<any>;
    };
    validateBrowserPath: (path: string) => Promise<{
      valid: boolean;
      error?: string;
      detectedName?: string;
      version?: string;
    }>;
    cookies: {
      getCookiesByProfile: (profileId: string) => Promise<any>;
      getCookie: (profileId: string, url: string) => Promise<any>;
      createCookie: (profileId: string, url: string, data: any) => Promise<any>;
      updateRotationInterval: (id: string, rotationIntervalMinutes: number) => Promise<any>;
      updateStatus: (id: string, status: string) => Promise<any>;
      deleteCookie: (id: string) => Promise<any>;
      deleteByProfile: (profileId: string) => Promise<any>;
      getDueForRotation: () => Promise<any>;
      getByStatus: (status: string) => Promise<any>;
      extractAndCreateCookie: (
        profileId: string,
        service: string,
        url: string,
        headless?: boolean,
        rotationConfig?: any
      ) => Promise<any>;
    };
    cookieRotation: {
      getStatus: () => Promise<any>;
      getProfiles: () => Promise<any>;
      // Returns ApiResponse-like shape: { success: boolean; data: ProfileWithCookieConfig[] }
      getProfilesConfig: () => Promise<{
        success: boolean;
        data: Array<{
          profileId: string;
          profileName?: string;
          cookies: Array<{
            cookieId: string;
            service: string;
            url: string;
            status: string;
            lastRotatedAt?: string;
            config?: any;
          }>;
        }>;
        error?: string;
      }>;
      updateCookieConfig: (cookieId: string, config: any) => Promise<any>;
      getCookieConfig: (cookieId: string) => Promise<any>;
      startWorker: (profileId: string, cookieId: string) => Promise<any>;
      restartWorker: (profileId: string, cookieId: string) => Promise<any>;
      stopWorker: (profileId: string, cookieId: string) => Promise<any>;
      stopAll: () => Promise<any>;
      startAll: () => Promise<any>;
      getWorkerLogs: (cookieId: string, options?: { tail?: number; profileId?: string }) => Promise<any>;
      clearWorkerLogs: (cookieId: string) => Promise<any>;
      listWorkerLogFiles: () => Promise<any>;
      onStatusUpdate: (callback: (data: any) => void) => () => void;
    };
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
  };
}
