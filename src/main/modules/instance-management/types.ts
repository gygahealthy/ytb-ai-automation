export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowPositioningConfig {
  strategy: 'grid' | 'cascade' | 'manual';
  grid: {
    columns: number;
    rows: number;
    direction: 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top';
    startCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    gap: { x: number; y: number };
    fullscreenEach?: boolean;
    compact?: boolean;
    padding: { top: number; left: number; right: number; bottom: number };
  };
  cascade: {
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  };
  defaultSize: { width: number; height: number };
  preferredDisplay: 'primary' | 'secondary' | number;
  maxConcurrent: number;
}

export interface LaunchInstanceRequest {
  profileId: string;
  automationType: 'chat' | 'veo3' | 'youtube' | 'custom';
  provider?: 'chatgpt' | 'gemini';
  config?: any;
}

export interface LaunchInstanceResponse {
  success: boolean;
  data?: {
    instanceId: string;
    sessionId?: string;
    debugPort: number;
    status?: 'launching' | 'running' | 'error' | 'stopping' | 'stopped';
  };
  error?: string;
}

export interface InstanceStats {
  messagesProcessed: number;
  errorsCount: number;
  uptime: number; // milliseconds
  lastActivity: Date;
}

export interface InstanceState {
  instanceId: string;
  profileId: string;
  profileName?: string;
  automationType: 'chat' | 'veo3' | 'youtube' | 'custom';
  provider?: 'chatgpt' | 'gemini';
  status: 'launching' | 'running' | 'error' | 'stopping' | 'stopped';
  
  // Browser info
  debugPort: number;
  chromePid?: number;
  windowHandle?: number;
  sessionId?: string;
  
  // Positioning
  windowBounds?: WindowBounds;
  screenSlot: number;
  
  // Runtime info
  currentUrl: string;
  startedAt: Date;
  errorMessage?: string;
  
  // Optional chat history for chat automation instances
  chatHistory?: import('../chat-automation/types').ChatMessage[];
  // Stats
  stats: InstanceStats;
}
