/**
 * Core types for multi-instance automation system
 */

export type AutomationType = 'chat' | 'veo3' | 'youtube' | 'custom';
export type InstanceStatus = 'launching' | 'running' | 'error' | 'stopping' | 'stopped';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InstanceStats {
  messagesProcessed: number;
  errorsCount: number;
  uptime: number; // milliseconds
  lastActivity: Date;
}

export interface ChatMessage {
  id: number | string;
  from: 'user' | 'bot' | 'system';
  text: string;
  ts?: string; // ISO or display
  messageId?: string; // provider message id
  conversationId?: string;
}

export interface InstanceState {
  instanceId: string;
  profileId: string;
  profileName?: string;
  automationType: AutomationType;
  provider?: 'chatgpt' | 'gemini';
  status: InstanceStatus;
  
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
  chatHistory?: ChatMessage[];
  // Stats
  stats: InstanceStats;
}

export interface WindowPositioningConfig {
  strategy: 'grid' | 'cascade' | 'manual';
  
  grid: {
    columns: number;
    rows: number;
    direction: 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top';
    startCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    gap: { x: number; y: number };
    // If true, each window will be resized to occupy the full work area (ignores grid sizing)
    fullscreenEach?: boolean;
    // If true, removes gaps/padding to make a compact tight layout
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
  automationType: AutomationType;
  provider?: 'chatgpt' | 'gemini';
  config?: any;
}

export interface LaunchInstanceResponse {
  success: boolean;
  data?: {
    instanceId: string;
    sessionId?: string;
    debugPort: number;
    status?: InstanceStatus;
  };
  error?: string;
}
