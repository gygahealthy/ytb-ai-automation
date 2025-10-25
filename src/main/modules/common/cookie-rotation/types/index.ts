export interface CookieRotationConfig {
  id: string;
  name: string;
  cron?: string;
  enabled: boolean;
}

export interface RotationMonitorRecord {
  id: string;
  cookieId: string;
  lastRunAt?: string;
}

export type { CookieRotationConfig as ICookieRotationConfig };

// Re-export rotation method types
export type { RotationMethodType, RotationMethodResult, RotationMethodExecutor } from "./rotation-method.types.js";

export default {} as unknown;
