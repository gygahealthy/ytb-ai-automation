export type RotationMethod = "refreshCreds" | "rotateCookie" | "headless";

export interface CookieRotationConfig {
  cookieId: string;
  launchWorkerOnStartup: boolean;
  enabledRotationMethods: RotationMethod[];
  rotationMethodOrder: RotationMethod[];
  rotationIntervalMinutes: number;
}

export interface ProfileWithCookies {
  profileId: string;
  profileName?: string;
  cookies: Array<{
    cookieId: string;
    service: string;
    url: string;
    status: string;
    workerStatus?: string;
    sessionHealth?: string;
    lastRotatedAt?: string;
    config?: CookieRotationConfig;
  }>;
}

export interface RotationStatus {
  isRunning: boolean;
  workersCount: number;
  headlessAvailable: boolean;
  total: number;
  running: number;
  stopped: number;
  error: number;
  healthy: number;
  degraded: number;
  expired: number;
  requiresHeadless: number;
  profiles?: ProfileWithCookies[];
}

export type HealthState = "critical" | "warning" | "healthy" | "unknown";
