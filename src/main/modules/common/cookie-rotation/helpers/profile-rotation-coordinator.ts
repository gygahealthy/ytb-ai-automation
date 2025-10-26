/**
 * Profile Rotation Coordinator
 * Ensures cookies on the same profile don't rotate simultaneously
 * Coordinates full rotation cycles (not just browser launch) per profile
 */

import { logger } from "../../../../utils/logger-backend.js";

/**
 * Rotation lock for a specific profile
 * Tracks which cookie is currently rotating
 */
interface ProfileRotationLock {
  cookieId: string;
  startTime: number;
  profileId: string;
}

/**
 * Profile Rotation Coordinator
 * Serializes rotation cycles per profile to prevent Chrome conflicts
 */
export class ProfileRotationCoordinator {
  private static instance: ProfileRotationCoordinator;
  private locks = new Map<string, ProfileRotationLock>();
  private queues = new Map<
    string,
    Array<{ cookieId: string; operation: () => Promise<void>; resolve: () => void; reject: (error: Error) => void }>
  >();
  // Promise chain to serialize access per profile (prevents race condition)
  private chains = new Map<string, Promise<any>>();

  private constructor() {}

  static getInstance(): ProfileRotationCoordinator {
    if (!ProfileRotationCoordinator.instance) {
      ProfileRotationCoordinator.instance = new ProfileRotationCoordinator();
    }
    return ProfileRotationCoordinator.instance;
  }

  /**
   * Execute a rotation operation with profile-level coordination
   * Ensures only one cookie rotates per profile at a time
   * Uses promise chaining to prevent race conditions
   *
   * @param profileId - Profile identifier
   * @param cookieId - Cookie identifier
   * @param operation - Rotation operation to execute
   * @returns Promise that resolves when rotation completes
   */
  executeRotation<T>(profileId: string, cookieId: string, operation: () => Promise<T>): Promise<T> {
    const queueKey = profileId.toLowerCase();

    logger.debug(`[rotation-coordinator] executeRotation() called synchronously for cookie ${cookieId} on profile ${profileId}`);

    // CRITICAL: This function is NOT async - it builds the chain synchronously
    // Get the previous chain and build the new chain in a single synchronous block
    const previousChain = this.chains.get(queueKey) || Promise.resolve();
    const hasPreviousChain = this.chains.has(queueKey);

    logger.debug(
      `[rotation-coordinator] ${
        hasPreviousChain ? "Chaining to existing promise" : "Creating new promise chain"
      } for cookie ${cookieId} on profile ${profileId}`
    );

    // Build the new chain by chaining onto the previous one
    // This new chain IS the execution promise
    const newChain = previousChain
      .then(async () => {
        logger.debug(`[rotation-coordinator] Promise chain executing for cookie ${cookieId} on profile ${profileId}`);
        // Execute the rotation with locking
        return await this.executeRotationInternal(profileId, cookieId, operation);
      })
      .catch((error) => {
        // Log error but allow chain to continue
        logger.error(`[rotation-coordinator] Rotation error for cookie ${cookieId}:`, error);
        throw error;
      });

    // Store the new chain BEFORE returning it
    // This is synchronous and happens in the same tick as reading previousChain
    this.chains.set(queueKey, newChain);

    logger.debug(`[rotation-coordinator] Stored new chain for cookie ${cookieId} on profile ${profileId}, returning promise`);

    // Return the chain (which will resolve when this rotation completes)
    return newChain;
  }

  /**
   * Internal rotation execution with locking
   */
  private async executeRotationInternal<T>(profileId: string, cookieId: string, operation: () => Promise<T>): Promise<T> {
    const queueKey = profileId.toLowerCase();

    // Check if another cookie is currently holding the lock
    const existingLock = this.locks.get(queueKey);
    if (existingLock && existingLock.cookieId !== cookieId) {
      logger.debug(
        `[rotation-coordinator] Cookie ${cookieId} waiting for ${existingLock.cookieId} to complete on profile ${profileId}`
      );
    }

    // Acquire lock
    this.locks.set(queueKey, {
      cookieId,
      startTime: Date.now(),
      profileId,
    });

    logger.debug(`[rotation-coordinator] Lock acquired for cookie ${cookieId} on profile ${profileId}`);

    try {
      // Execute the rotation
      const result = await operation();

      // CRITICAL: Add cleanup delay BEFORE releasing lock
      // Ensures Chrome process fully terminates before next cookie tries to launch
      // 4000ms gives Chrome enough time to release profile lock files and exit cleanly
      logger.debug(`[rotation-coordinator] Waiting 4000ms for Chrome cleanup before releasing lock...`);
      await new Promise((resolve) => setTimeout(resolve, 4000));

      return result;
    } finally {
      // Release lock
      this.locks.delete(queueKey);
      logger.debug(`[rotation-coordinator] Lock released for cookie ${cookieId} on profile ${profileId}`);
    }
  }

  /**
   * Check if a profile is currently locked
   */
  isProfileLocked(profileId: string): boolean {
    const queueKey = profileId.toLowerCase();
    return this.locks.has(queueKey);
  }

  /**
   * Get current lock info for a profile
   */
  getProfileLock(profileId: string): ProfileRotationLock | undefined {
    const queueKey = profileId.toLowerCase();
    return this.locks.get(queueKey);
  }

  /**
   * Get queue length for a profile
   */
  getQueueLength(profileId: string): number {
    const queueKey = profileId.toLowerCase();
    const queue = this.queues.get(queueKey);
    return queue ? queue.length : 0;
  }
}

// Export singleton instance
export const profileRotationCoordinator = ProfileRotationCoordinator.getInstance();
