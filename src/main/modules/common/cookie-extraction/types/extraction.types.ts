/**
 * Cookie extraction types and interfaces
 */

/**
 * Options for cookie extraction
 */
export interface ExtractOptions {
  /** Target URL to extract cookies from (default: https://gemini.google.com) */
  targetUrl?: string;

  /** Run browser in headless mode (default: false - visible) */
  headless?: boolean;

  /** Array of required cookie names to validate (e.g., ['__Secure-1PSID', '__Secure-1PSIDTS']) */
  requiredCookies?: string[];

  /** Maximum time to wait for interactive login in non-headless mode (ms) */
  maxWaitMs?: number;

  /** Inactivity threshold - if no cookie changes for this duration, proceed (ms) */
  inactivityThresholdMs?: number;

  /** Skip interactive wait in visible mode - extract immediately if cookies found (used for rotation) */
  skipInteractiveWait?: boolean;
}

/**
 * Cookie validation result
 */
export interface CookieValidation {
  /** Whether all required cookies are present */
  valid: boolean;

  /** Array of missing required cookie names */
  missing: string[];
}

/**
 * Result of cookie extraction
 */
export interface ExtractResult {
  /** Formatted cookie string: "name=value; name2=value2" */
  cookieString: string;

  /** Raw Puppeteer cookie objects */
  cookies: any[];

  /** Validation result against required cookies */
  validation: CookieValidation;

  /** Earliest expiry date (ISO string) among cookies with expiry */
  earliestExpiry?: string;

  /** Unique domains from which cookies were extracted */
  domains: string[];
}

/**
 * Converted cookies for database storage
 */
export interface CookiesForDb {
  /** Formatted cookie string */
  cookieString: string;

  /** Earliest expiry date (ISO string) */
  earliestExpiry?: string;

  /** Unique domains */
  domains: string[];
}
