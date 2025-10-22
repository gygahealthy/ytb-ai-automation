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
      showOpenDialog: (
        options: any
      ) => Promise<{ canceled: boolean; filePaths: string[] }>;
    };
    masterPrompts: {
      getAll: () => Promise<any>;
      getById: (id: number) => Promise<any>;
      getByProvider: (provider: string) => Promise<any>;
      create: (prompt: any) => Promise<any>;
      update: (id: number, prompt: any) => Promise<any>;
      delete: (id: number) => Promise<any>;
    };
    aiPrompt: {
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
    cookieRotation: {
      getStatus: () => Promise<any>;
      getProfiles: () => Promise<any>;
      startWorker: (profileId: string, cookieId: string) => Promise<any>;
      restartWorker: (profileId: string, cookieId: string) => Promise<any>;
      stopWorker: (profileId: string, cookieId: string) => Promise<any>;
      forceHeadlessRefresh: (
        profileId: string,
        cookieId: string
      ) => Promise<any>;
      forceVisibleRefresh: (
        profileId: string,
        cookieId: string
      ) => Promise<any>;
      stopAll: () => Promise<any>;
      startAll: () => Promise<any>;
      onStatusUpdate: (callback: (data: any) => void) => () => void;
    };
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
  };
}
