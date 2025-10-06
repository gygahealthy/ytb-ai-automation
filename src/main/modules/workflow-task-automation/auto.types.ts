import { ID } from "../../../types";

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
