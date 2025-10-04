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
    };
  };
}
