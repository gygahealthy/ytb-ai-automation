/**
 * Cookie check helpers for extraction
 * Provides utility functions to check for presence of cookies by name or pattern
 * Used during extraction validation and interactive wait logic
 *
 * Usage examples:
 *  - cookieMatches('*DTS', cookies) -> returns true if any cookie name contains 'DTS' (case-insensitive)
 *  - cookieMatches('SID', cookies) -> returns true if any cookie name equals 'SID'
 */

export type SimpleCookie = { name: string; value?: string; domain?: string };

/**
 * Check cookies for a match.
 * If query starts with '*' treat as substring check (case-insensitive).
 * Otherwise do exact (case-sensitive) match on cookie.name.
 */
export function cookieMatches(query: string, cookies: SimpleCookie[] | any[]): boolean {
  if (!query || !Array.isArray(cookies)) return false;

  // substring wildcard: starts with '*', e.g. '*DTS' -> match any cookie name containing 'DTS'
  if (query.startsWith("*")) {
    const needle = query.substring(1).toLowerCase();
    return cookies.some((c: any) => typeof c?.name === "string" && c.name.toLowerCase().includes(needle));
  }

  // exact match (case-sensitive by default to be strict)
  return cookies.some((c: any) => typeof c?.name === "string" && c.name === query);
}

/**
 * Convenience wrapper specifically for DTS detection (checks for 'DTS' substring, case-insensitive)
 * Used during extraction to detect if interactive login has completed
 */
export function containsDtsCookie(cookies: SimpleCookie[] | any[]): boolean {
  return cookieMatches("*DTS", cookies);
}

/**
 * Check if cookie array has changed by comparing name=value pairs
 * Used during interactive extraction polling to detect when user has logged in
 *
 * @param previousCookies - Previous cookie array
 * @param currentCookies - Current cookie array
 * @returns true if cookies have changed, false otherwise
 */
export function hasCookieChanged(previousCookies: SimpleCookie[] | any[], currentCookies: SimpleCookie[] | any[]): boolean {
  if (!Array.isArray(previousCookies) || !Array.isArray(currentCookies)) {
    return true;
  }

  // Create sets of "name=value" pairs for comparison
  const previousSet = new Set<string>(previousCookies.map((c: any) => `${c.name}=${c.value}`));
  const currentSet = new Set<string>(currentCookies.map((c: any) => `${c.name}=${c.value}`));

  // If sizes differ, cookies changed
  if (previousSet.size !== currentSet.size) {
    return true;
  }

  // If all items in currentSet are in previousSet, no change
  for (const item of currentSet) {
    if (!previousSet.has(item as string)) {
      return true;
    }
  }

  return false;
}
