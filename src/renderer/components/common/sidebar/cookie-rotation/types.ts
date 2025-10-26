export type RotationMethod = "refreshCreds" | "rotateCookie" | "headless";

export interface RotationProfile {
  id: string;
  profileName: string;
  rotationUrl: string;
  requiredCookies: string; // JSON string
  rotationIntervalMinutes: number;
  enabledRotationMethods: string; // JSON string
  rotationMethodOrder: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

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
