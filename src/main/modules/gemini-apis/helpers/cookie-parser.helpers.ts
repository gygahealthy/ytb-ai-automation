/**
 * Cookie parsing and manipulation utilities
 */

import type {
  CookieCollection,
  ValidationResult,
} from "../shared/types/index.js";

/**
 * Parse a cookie header string into an object
 * @param header - Cookie header string (e.g., "a=1; b=2; c=3")
 * @returns Parsed cookie object
 */
export function parseCookieHeader(header: string): CookieCollection {
  const cookies: CookieCollection = {} as CookieCollection;

  if (!header || typeof header !== "string") {
    return cookies;
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const name = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();

    if (name && value) {
      cookies[name] = value;
    }
  }

  return cookies;
}

/**
 * Convert cookie object to header string
 * @param cookies - Cookie object
 * @returns Cookie header string
 */
export function cookiesToHeader(cookies: CookieCollection): string {
  return Object.entries(cookies)
    .filter(([_, value]) => value !== undefined && value !== "")
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/**
 * Extract specific cookies by name
 * @param cookies - Full cookie collection
 * @param names - Cookie names to extract
 * @returns Filtered cookie object
 */
export function extractCookies(
  cookies: CookieCollection,
  names: string[]
): Partial<CookieCollection> {
  const result: Partial<CookieCollection> = {};

  for (const name of names) {
    if (cookies[name]) {
      result[name] = cookies[name];
    }
  }

  return result;
}

/**
 * Validate that required cookies are present
 * @param cookies - Cookie collection to validate
 * @param required - Required cookie names
 * @returns Validation result with status and error message if invalid
 */
export function validateRequiredCookies(
  cookies: CookieCollection,
  required: string[] = ["__Secure-1PSID"]
): ValidationResult {
  const missing: string[] = [];

  for (const name of required) {
    const value = cookies[name];
    if (value === undefined || value === "" || value.includes("PASTE_YOUR")) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing or invalid cookies: ${missing.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Merge cookie objects, with newer values overwriting older ones
 * @param base - Base cookie collection
 * @param updates - Cookie updates to apply
 * @returns Merged cookie collection
 */
export function mergeCookies(
  base: CookieCollection,
  updates: Partial<CookieCollection>
): CookieCollection {
  return { ...base, ...updates } as CookieCollection;
}
