// ============= Common Types =============
export type ID = string;



// ============= API Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============= Automation Shared Types =============
export type AutomationType = 'chat' | 'veo3' | 'youtube' | 'custom';
export type InstanceStatus = 'launching' | 'running' | 'error' | 'stopping' | 'stopped';

import type { WindowBounds, WindowPositioningConfig, LaunchInstanceRequest, LaunchInstanceResponse, InstanceStats, InstanceState } from '../../main/modules/instance-management/types';
import type { ChatMessage } from '../../main/modules/chat-automation/types';

export type { WindowBounds, WindowPositioningConfig, LaunchInstanceRequest, LaunchInstanceResponse, InstanceStats, InstanceState };
export type { ChatMessage };
