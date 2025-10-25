/**
 * Cookie storage and manipulation utilities
 * Handles storage-related cookie operations (NOT extraction - see cookie-extraction module)
 *
 * For extraction-related helpers (parsing, checking, validation), see:
 *  - src/main/modules/common/cookie-extraction/helpers/
 */

import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";

/**
 * Extract specific cookies by name
 * Used for storage operations to filter cookies by name
 * @param cookies - Full cookie collection
 * @param names - Cookie names to extract
 * @returns Filtered cookie object
 */
export function extractCookies(cookies: CookieCollection, names: string[]): Partial<CookieCollection> {
  const result: Partial<CookieCollection> = {};

  for (const name of names) {
    if (cookies[name]) {
      result[name] = cookies[name];
    }
  }

  return result;
}

/**
 * Merge cookie objects, with newer values overwriting older ones
 * Used for storage operations to combine cookie updates
 * @param base - Base cookie collection
 * @param updates - Cookie updates to apply
 * @returns Merged cookie collection
 */
export function mergeCookies(base: CookieCollection, updates: Partial<CookieCollection>): CookieCollection {
  return { ...base, ...updates } as CookieCollection;
}

// Re-export extraction helpers for backward compatibility
// These are NOW located in cookie-extraction module but kept here for compatibility
export {
  parseCookieHeader,
  cookiesToHeader,
  validateRequiredCookies,
} from "../../cookie-extraction/helpers/cookie-parser.helpers";
