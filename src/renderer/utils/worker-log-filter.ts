/**
 * Worker Log Filter Utility
 * Filters logs by worker/cookie ID from the global log stream
 */

import type { LogEntry } from "../store/log.store";

/**
 * Extract worker/cookie identifiers from log messages
 * Matches patterns like:
 * - [CookieRotationWorker] ... for cookie {cookieId}
 * - [rotation-manager] ... for {profileId}-{cookieId}
 * - Worker for {profileId}-{cookieId}
 */
export function extractWorkerIdentifiers(log: LogEntry): {
  cookieId?: string;
  workerKey?: string;
  profileId?: string;
} {
  const fullText = `${log.message} ${log.args.join(" ")}`;

  // Pattern 1: [CookieRotationWorker] for cookie {cookieId}
  const cookieMatch = fullText.match(/for cookie ([a-f0-9-]+)/i);
  if (cookieMatch) {
    return { cookieId: cookieMatch[1] };
  }

  // Pattern 2: [rotation-manager] for {profileId}-{cookieId}
  const workerKeyMatch = fullText.match(/for ([a-f0-9-]+)-([a-f0-9-]+)/i);
  if (workerKeyMatch) {
    return {
      profileId: workerKeyMatch[1],
      cookieId: workerKeyMatch[2],
      workerKey: `${workerKeyMatch[1]}-${workerKeyMatch[2]}`,
    };
  }

  // Pattern 3: Worker {profileId}-{cookieId}
  const workerMatch = fullText.match(/Worker ([a-f0-9-]+)-([a-f0-9-]+)/i);
  if (workerMatch) {
    return {
      profileId: workerMatch[1],
      cookieId: workerMatch[2],
      workerKey: `${workerMatch[1]}-${workerMatch[2]}`,
    };
  }

  // Pattern 4: cookie ${cookieId}
  const cookieIdMatch = fullText.match(/cookie ([a-f0-9-]{36})/i);
  if (cookieIdMatch) {
    return { cookieId: cookieIdMatch[1] };
  }

  return {};
}

/**
 * Filter logs by worker identifiers
 */
export function filterWorkerLogs(
  logs: LogEntry[],
  options: {
    cookieId?: string;
    profileId?: string;
    workerKey?: string;
  }
): LogEntry[] {
  if (!options.cookieId && !options.profileId && !options.workerKey) {
    return [];
  }

  return logs.filter((log) => {
    const identifiers = extractWorkerIdentifiers(log);

    // Match by cookie ID
    if (options.cookieId && identifiers.cookieId === options.cookieId) {
      return true;
    }

    // Match by worker key
    if (options.workerKey && identifiers.workerKey === options.workerKey) {
      return true;
    }

    // Match by profile ID and cookie ID
    if (
      options.profileId &&
      options.cookieId &&
      identifiers.profileId === options.profileId &&
      identifiers.cookieId === options.cookieId
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Get worker-related log patterns for search
 */
export function getWorkerLogPatterns(cookieId: string, profileId?: string): RegExp[] {
  const patterns: RegExp[] = [new RegExp(`cookie ${cookieId}`, "i"), new RegExp(`\\[CookieRotationWorker\\].*${cookieId}`, "i")];

  if (profileId) {
    patterns.push(new RegExp(`${profileId}-${cookieId}`, "i"), new RegExp(`Worker ${profileId}-${cookieId}`, "i"));
  }

  return patterns;
}

/**
 * Check if a log entry is related to a worker
 */
export function isWorkerLog(log: LogEntry): boolean {
  const fullText = `${log.message} ${log.args.join(" ")}`;

  const workerKeywords = [
    "[CookieRotationWorker]",
    "[rotation-manager]",
    "rotation cycle",
    "rotation success",
    "rotation error",
    "Worker for",
    "Worker started",
    "Worker stopped",
    "cookie rotation",
    "PSIDTS",
    "__Secure-1PSIDTS",
  ];

  return workerKeywords.some((keyword) => fullText.toLowerCase().includes(keyword.toLowerCase()));
}
