/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    automation: {
      start: (config: any) => Promise<any>;
      stop: (taskId: string) => Promise<any>;
      status: (taskId: string) => Promise<any>;
      list: () => Promise<any>;
    };
    settings: {
      get: () => Promise<any>;
      save: (settings: any) => Promise<any>;
    };
  };
}

