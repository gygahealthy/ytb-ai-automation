import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Profile APIs
  profile: {
    getAll: () => ipcRenderer.invoke("profile:getAll"),
    getById: (id: string) => ipcRenderer.invoke("profile:getById", id),
    create: (input: any) => ipcRenderer.invoke("profile:create", input),
    update: (id: string, updates: any) => ipcRenderer.invoke("profile:update", id, updates),
    delete: (id: string) => ipcRenderer.invoke("profile:delete", id),
    updateCredit: (id: string, amount: number) => ipcRenderer.invoke("profile:updateCredit", id, amount),
    login: (id: string) => ipcRenderer.invoke("profile:login", id),
  },

  // Automation APIs
  automation: {
    getAll: () => ipcRenderer.invoke("automation:getAll"),
    getById: (id: string) => ipcRenderer.invoke("automation:getById", id),
    create: (input: any) => ipcRenderer.invoke("automation:create", input),
    start: (id: string) => ipcRenderer.invoke("automation:start", id),
    stop: (id: string) => ipcRenderer.invoke("automation:stop", id),
  },

  // VEO3 APIs
  veo3: {
    getAll: () => ipcRenderer.invoke("veo3:getAll"),
    getById: (id: string) => ipcRenderer.invoke("veo3:getById", id),
    create: (input: any) => ipcRenderer.invoke("veo3:create", input),
    updateStatus: (id: string, status: string) => ipcRenderer.invoke("veo3:updateStatus", id, status),
    addScene: (projectId: string, scene: any) => ipcRenderer.invoke("veo3:addScene", projectId, scene),
    removeScene: (projectId: string, sceneId: string) => ipcRenderer.invoke("veo3:removeScene", projectId, sceneId),
    updatePrompt: (projectId: string, jsonPrompt: any) => ipcRenderer.invoke("veo3:updatePrompt", projectId, jsonPrompt),
    delete: (id: string) => ipcRenderer.invoke("veo3:delete", id),
  },

  // YouTube APIs
  youtube: {
    getAllChannels: () => ipcRenderer.invoke("youtube:getAllChannels"),
    getChannelById: (id: string) => ipcRenderer.invoke("youtube:getChannelById", id),
    createChannel: (input: any) => ipcRenderer.invoke("youtube:createChannel", input),
    updateChannelMetrics: (id: string, metrics: any) => ipcRenderer.invoke("youtube:updateChannelMetrics", id, metrics),
    analyzeChannel: (id: string) => ipcRenderer.invoke("youtube:analyzeChannel", id),
    deleteChannel: (id: string) => ipcRenderer.invoke("youtube:deleteChannel", id),
    getAllVideos: () => ipcRenderer.invoke("youtube:getAllVideos"),
    getVideosByChannel: (channelId: string) => ipcRenderer.invoke("youtube:getVideosByChannel", channelId),
    analyzeVideo: (videoId: string, channelId: string) => ipcRenderer.invoke("youtube:analyzeVideo", videoId, channelId),
  },

  // Dialog APIs
  dialog: {
    selectFolder: (defaultPath?: string) => ipcRenderer.invoke("dialog:selectFolder", defaultPath),
    getDefaultProfilePath: () => ipcRenderer.invoke("dialog:getDefaultProfilePath"),
    generateUserAgent: () => ipcRenderer.invoke("dialog:generateUserAgent"),
    getDefaultChromePath: () => ipcRenderer.invoke("dialog:getDefaultChromePath"),
    selectBrowserExecutable: () => ipcRenderer.invoke("dialog:selectBrowserExecutable"),
  },
});

// Type declaration for TypeScript
declare global {
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
      };
    };
  }
}
