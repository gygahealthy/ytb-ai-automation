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
export type InstanceStatus = "launching" | "running" | "error" | "stopping" | "stopped";

import type { ChatMessage } from "../../main/modules/chat-automation/types";
import type {
  InstanceState,
  InstanceStats,
  LaunchInstanceRequest,
  LaunchInstanceResponse,
  WindowBounds,
  WindowPositioningConfig,
} from "../../main/modules/instance-management/types";

export type {
  ChatMessage,
  InstanceState,
  InstanceStats,
  LaunchInstanceRequest,
  LaunchInstanceResponse,
  WindowBounds,
  WindowPositioningConfig,
};
