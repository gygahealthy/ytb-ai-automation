// ============= Common Types =============
export type ID = string;

// ============= Profile Types =============
export interface Profile {
  id: ID;
  name: string;
  browserPath?: string;
  userDataDir: string;
  proxy?: ProxyConfig;
  creditRemaining: number;
  cookies?: Record<string, string>;
  cookieExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProxyConfig {
  server: string; // host:port
  username?: string;
  password?: string;
}

export interface CreateProfileInput {
  name: string;
  browserPath?: string;
  userDataDir: string;
  proxy?: ProxyConfig;
  creditRemaining?: number;
}

// ============= Automation Types =============
export interface AutomationTask {
  id: ID;
  profileId: ID;
  name: string;
  targetUrl: string;
  actions: AutomationAction[];
  status: "pending" | "running" | "completed" | "failed" | "stopped";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationAction {
  type: "click" | "type" | "wait" | "navigate" | "screenshot" | "scroll" | "http-request" | "cookie";
  selector?: string;
  value?: string;
  timeout?: number;
  // HTTP Request specific fields
  httpMethod?: "GET" | "POST" | "PUT" | "DELETE";
  url?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
  // Cookie specific fields
  cookieAction?: "import" | "export";
  cookiePath?: string; // file path for import/export
  cookieData?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
}

export interface CreateAutomationTaskInput {
  profileId: ID;
  name: string;
  targetUrl: string;
  actions: AutomationAction[];
}

// ============= VEO3 Types =============
export interface VEO3Project {
  id: ID;
  projectId: string;
  profileId: ID;
  name: string;
  status: "draft" | "processing" | "completed" | "failed";
  scenes: VideoScene[];
  jsonPrompt?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoScene {
  id: ID;
  scene: string;
  segment: string;
  image?: string;
}

export interface CreateVEO3ProjectInput {
  projectId: string;
  profileId: ID;
  name: string;
  scenes: Omit<VideoScene, "id">[];
  jsonPrompt?: Record<string, any>;
}

// ============= YouTube Types =============
export interface YoutubeChannel {
  id: ID;
  channelId: string;
  channelName: string;
  channelUrl: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAnalysis {
  id: ID;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  channelId: string;
  views: number;
  likes: number;
  comments: number;
  duration: number; // seconds
  publishedAt: Date;
  analyzedAt: Date;
  createdAt: Date;
}

export interface CreateChannelInput {
  channelId: string;
  channelName: string;
  channelUrl: string;
}

// ============= API Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
