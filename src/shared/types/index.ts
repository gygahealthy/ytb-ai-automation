// ============= Common Types =============
export type ID = string;

// ============= API Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============= Automation Shared Types =============
export type AutomationType = "chat" | "veo3" | "youtube" | "custom";
export type InstanceStatus =
  | "launching"
  | "running"
  | "error"
  | "stopping"
  | "stopped";

import type { ChatMessage } from "../../main/modules/cdp-chat-automation/types";
import type {
  InstanceState,
  InstanceStats,
  LaunchInstanceRequest,
  LaunchInstanceResponse,
  WindowBounds,
  WindowPositioningConfig,
} from "../../main/modules/instance-management/types";
import type { Cookie } from "../../main/modules/gemini-apis/shared/types";

export type {
  ChatMessage,
  InstanceState,
  InstanceStats,
  LaunchInstanceRequest,
  LaunchInstanceResponse,
  WindowBounds,
  WindowPositioningConfig,
  Cookie,
};

// ============= AI Prompt Config Types =============
export interface ComponentPromptConfig {
  id: string;
  componentName: string;
  profileId: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIPromptCallRequest {
  componentName: string;
  profileId: string;
  data: Record<string, any>; // Dynamic data for placeholder replacement
  stream?: boolean;
  requestId?: string;
}

export interface AIPromptCallResponse {
  success: boolean;
  data?: string;
  error?: string;
  streaming?: boolean;
}

export interface SaveConfigRequest {
  componentName: string;
  profileId: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
}
