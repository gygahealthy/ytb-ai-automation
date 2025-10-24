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

export default {} as unknown;
