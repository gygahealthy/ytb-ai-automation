/**
 * Core type definitions for Gemini Chat API
 */

/**
 * Cookie collection used for authentication
 */
export interface CookieCollection {
  "__Secure-1PSID": string;
  "__Secure-1PSIDTS"?: string;
  "__Secure-3PSID"?: string;
  "__Secure-1PSIDCC"?: string;
  "__Secure-3PSIDCC"?: string;
  SIDCC?: string;
  NID?: string;
  HSID?: string;
  SSID?: string;
  APISID?: string;
  SAPISID?: string;
  "__Secure-1PAPISID"?: string;
  "__Secure-3PAPISID"?: string;
  [key: string]: string | undefined;
}

/**
 * Cookie manager configuration options
 */
export interface CookieManagerOptions {
  autoRotate?: boolean;
  rotationInterval?: number;
  verbose?: boolean;
  cacheDir?: string;
  proxy?: string;
}

/**
 * Cookie rotation result
 */
export interface RotationResult {
  success: boolean;
  newPSIDTS?: string;
  newSIDCC?: string;
  newSecure1PSIDCC?: string;
  newSecure3PSIDCC?: string;
  status?: number;
  error?: string;
  timestamp: number;
}

/**
 * Cookie validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Cached cookie metadata
 */
export interface CachedCookieMetadata {
  cookies: CookieCollection;
  cachedAt: string;
  expiresAt?: string;
  lastRotation?: string;
}

/**
 * Cookie entity for database storage
 */
export interface Cookie {
  id: string;
  profileId: string;
  url: string;
  service: string; // e.g., 'flow', 'gemini'
  geminiToken?: string;
  rawCookieString?: string;
  lastRotatedAt?: string;
  spidExpiration?: string;
  rotationData?: string; // JSON string
  rotationIntervalMinutes: number;
  status: "active" | "expired" | "renewal_failed";
  // Rotation configuration fields
  launchWorkerOnStartup: number; // 0 = false, 1 = true
  enabledRotationMethods: string; // JSON array: ["refreshCreds", "rotateCookie", "headless"]
  rotationMethodOrder: string; // JSON array: ["refreshCreds", "rotateCookie", "headless"]
  createdAt: string;
  updatedAt: string;
}

/**
 * Cookie database row (snake_case for SQL)
 */
export interface CookieRow {
  id: string;
  profile_id: string;
  url: string;
  service: string;
  gemini_token?: string;
  raw_cookie_string?: string;
  last_rotated_at?: string;
  spid_expiration?: string;
  rotation_data?: string;
  rotation_interval_minutes: number;
  status: "active" | "expired" | "renewal_failed";
  // Rotation configuration fields
  launch_worker_on_startup: number; // 0 = false, 1 = true
  enabled_rotation_methods: string; // JSON array
  rotation_method_order: string; // JSON array
  created_at: string;
  updated_at: string;
}
