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
