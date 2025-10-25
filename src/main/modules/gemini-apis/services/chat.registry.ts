/**
 * Chat Service Registry
 * Manages per-profile singleton instances of ChatService and CookieManagerDB
 * Preserves conversation context and metadata across multiple requests
 *
 * Usage:
 *   - Use this registry when you need multi-turn conversations with context preservation
 *   - Perfect for long-running chat sessions where conversation state matters
 *
 * Alternative:
 *   - Use sendChatMessageNonStreaming/sendChatMessageStreaming for stateless per-request calls
 */

import { ChatService } from "./chat.service.js";
import { CookieManagerDB } from "../../common/cookie/services/cookie-manager-db.js";
import { database } from "../../../storage/database.js";
import { CookieRepository } from "../../common/cookie/repository/cookie.repository.js";
import { logger } from "../../../utils/logger-backend.js";
import { parseCookieHeader } from "../../common/cookie/helpers/cookie-parser.helpers.js";

interface CookieManagerEntry {
  manager: CookieManagerDB;
  cookieString: string;
  lastAccessed: Date;
}

interface ChatServiceEntry {
  service: ChatService;
  profileId: string;
  lastAccessed: Date;
}

/**
 * Global registries for singleton instances
 */
const cookieManagers = new Map<string, CookieManagerEntry>();
const chatServices = new Map<string, ChatServiceEntry>();

/**
 * Get or create a CookieManagerDB for a profile
 * Returns existing manager if cookie string hasn't changed
 * Creates new manager if cookies were updated
 */
export async function getOrCreateCookieManager(
  profileId: string,
  rawCookieString: string | null | undefined
): Promise<CookieManagerDB> {
  const cacheKey = profileId;
  const existing = cookieManagers.get(cacheKey);

  // Return existing if cookie string hasn't changed
  if (existing && existing.cookieString === (rawCookieString || "")) {
    existing.lastAccessed = new Date();
    logger.debug(`[chat.registry] Reusing CookieManager for profile ${profileId}`);
    return existing.manager;
  }

  logger.info(`[chat.registry] Creating new CookieManager for profile ${profileId}`, {
    rawCookieStringLength: rawCookieString?.length || 0,
  });

  // Parse cookies into CookieCollection
  const cookieCollection = parseCookieHeader(rawCookieString || "");

  // Log what cookies were parsed
  const cookieNames = Object.keys(cookieCollection);
  const hasRequiredPSID = "__Secure-1PSID" in cookieCollection;
  const hasPSIDTS = "__Secure-1PSIDTS" in cookieCollection;

  logger.info(`[chat.registry] Parsed cookies for profile ${profileId}`, {
    totalCookies: cookieNames.length,
    cookieNames,
    hasRequiredPSID,
    hasPSIDTS,
    psidValue: cookieCollection["__Secure-1PSID"] ? `${cookieCollection["__Secure-1PSID"].substring(0, 20)}...` : "MISSING",
    psidtsValue: cookieCollection["__Secure-1PSIDTS"] ? `${cookieCollection["__Secure-1PSIDTS"].substring(0, 20)}...` : "MISSING",
  });

  // Create repository and manager
  const db = database.getSQLiteDatabase();
  const cookieRepository = new CookieRepository(db);

  const manager = new CookieManagerDB(cookieCollection, cookieRepository, profileId, "gemini.google.com", {
    autoValidate: false,
    validateOnInit: false,
    verbose: false,
  });

  // Initialize manager
  try {
    await manager.init();
    logger.info(`[chat.registry] CookieManager initialized for profile ${profileId}`);
  } catch (err) {
    logger.error(`[chat.registry] CookieManager init failed for profile ${profileId}: ${err}`, {
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    // Continue even if init fails - but log the error for debugging
  }

  // Store in registry
  cookieManagers.set(cacheKey, {
    manager,
    cookieString: rawCookieString || "",
    lastAccessed: new Date(),
  });

  // If ChatService exists for this profile, reset it so it uses new manager
  if (chatServices.has(profileId)) {
    logger.info(`[chat.registry] Resetting ChatService for profile ${profileId} due to cookie change`);
    chatServices.delete(profileId);
  }

  return manager;
}

/**
 * Get or create a ChatService for a profile
 * Uses singleton pattern - same instance handles all requests for a profile
 * Preserves conversation metadata across multiple calls
 */
export function getOrCreateChatService(profileId: string, cookieManager: CookieManagerDB): ChatService {
  const existing = chatServices.get(profileId);

  if (existing) {
    existing.lastAccessed = new Date();
    logger.debug(`[chat.registry] Reusing ChatService for profile ${profileId}`);
    return existing.service;
  }

  logger.info(`[chat.registry] Creating new ChatService singleton for profile ${profileId}`);

  const service = new ChatService(cookieManager);

  chatServices.set(profileId, {
    service,
    profileId,
    lastAccessed: new Date(),
  });

  return service;
}

/**
 * Reset ChatService for a profile
 * Clears conversation metadata and starts fresh
 */
export function resetChatService(profileId: string): void {
  if (chatServices.has(profileId)) {
    logger.info(`[chat.registry] Resetting ChatService for profile ${profileId}`);
    chatServices.delete(profileId);
  }
}

/**
 * Reset CookieManager for a profile
 * Forces re-initialization on next use
 * Also resets associated ChatService
 */
export function resetCookieManager(profileId: string): void {
  if (cookieManagers.has(profileId)) {
    logger.info(`[chat.registry] Resetting CookieManager for profile ${profileId}`);
    cookieManagers.delete(profileId);
  }
  resetChatService(profileId);
}

/**
 * Clear all cached instances
 * Useful for cleanup or testing
 */
export function clearAll(): void {
  logger.info(`[chat.registry] Clearing all registries (${cookieManagers.size} managers, ${chatServices.size} services)`);
  cookieManagers.clear();
  chatServices.clear();
}

/**
 * Get registry statistics for monitoring and debugging
 */
export function getStats() {
  return {
    cookieManagers: cookieManagers.size,
    chatServices: chatServices.size,
    managers: Array.from(cookieManagers.entries()).map(([key, entry]) => ({
      profileId: key,
      lastAccessed: entry.lastAccessed.toISOString(),
    })),
    services: Array.from(chatServices.entries()).map(([key, entry]) => ({
      profileId: key,
      lastAccessed: entry.lastAccessed.toISOString(),
    })),
  };
}
