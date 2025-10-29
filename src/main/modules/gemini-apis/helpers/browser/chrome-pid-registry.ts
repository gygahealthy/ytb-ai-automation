/**
 * Chrome Process PID Registry
 *
 * Central registry for tracking all spawned Chrome processes across the application.
 * Provides garbage collection of orphaned Chrome processes on app shutdown or error.
 *
 * This singleton ensures that no Chrome processes are left running when the app exits,
 * even if they crash or fail to connect before being properly tracked by their launcher.
 */

import { logger } from "../../../../utils/logger-backend";
import { execSync } from "child_process";

/**
 * Global Chrome PID registry for cleanup on shutdown
 * Uses a Set to avoid duplicate PIDs and provide O(1) operations
 */
class ChromePIDRegistry {
  private spawnedPIDs = new Set<number>();

  /**
   * Register a Chrome PID for tracking and cleanup
   * Call this immediately after spawning a Chrome process
   *
   * @param pid - The process ID of the spawned Chrome process
   */
  register(pid: number): void {
    this.spawnedPIDs.add(pid);
    logger.debug("[chrome-pid-registry] Registered Chrome PID", {
      pid,
      totalTracked: this.spawnedPIDs.size,
    });
  }

  /**
   * Unregister a Chrome PID (after successful cleanup)
   * Call this after successfully killing a Chrome process
   *
   * @param pid - The process ID to unregister
   */
  unregister(pid: number): void {
    this.spawnedPIDs.delete(pid);
    logger.debug("[chrome-pid-registry] Unregistered Chrome PID", {
      pid,
      totalTracked: this.spawnedPIDs.size,
    });
  }

  /**
   * Get the current count of tracked PIDs
   * Useful for debugging and monitoring
   */
  getTrackedCount(): number {
    return this.spawnedPIDs.size;
  }

  /**
   * Get all tracked PIDs as an array
   * Useful for debugging and logging
   */
  getTrackedPIDs(): number[] {
    return Array.from(this.spawnedPIDs);
  }

  /**
   * Force kill all tracked Chrome PIDs
   * Called on app shutdown or emergency cleanup
   *
   * Uses Windows taskkill with /T flag to kill process trees (parent + all children)
   * On Unix/Mac, uses SIGKILL signal
   *
   * This is the "nuclear option" - it will forcefully terminate all Chrome processes
   * regardless of their state or what they're doing.
   */
  killAll(): void {
    if (this.spawnedPIDs.size === 0) {
      logger.debug("[chrome-pid-registry] No Chrome PIDs to kill");
      return;
    }

    logger.info("[chrome-pid-registry] Force killing all tracked Chrome processes", {
      count: this.spawnedPIDs.size,
      pids: this.getTrackedPIDs(),
    });

    const pidsToKill = this.getTrackedPIDs();
    let killedCount = 0;
    let failedCount = 0;

    for (const pid of pidsToKill) {
      try {
        if (process.platform === "win32") {
          // Use /T to kill process tree (parent + all children)
          // Use 2>nul to suppress "process not found" errors (process may have already exited)
          execSync(`taskkill /F /PID ${pid} /T 2>nul`, {
            timeout: 2000,
            windowsHide: true,
          });
        } else {
          // Unix/Mac: try to kill child processes first, then kill parent
          try {
            execSync(`pkill -P ${pid} 2>/dev/null || true`, { timeout: 2000 });
          } catch (_e) {
            // ignore
          }

          try {
            process.kill(pid, "SIGKILL");
          } catch (_e) {
            // ignore
          }
        }
        this.unregister(pid);
        killedCount++;
      } catch (err) {
        // Process may have already exited - this is fine
        this.unregister(pid);
        failedCount++;
      }
    }

    logger.info("[chrome-pid-registry] Cleanup complete", {
      killedCount,
      failedCount,
      remainingPIDs: this.spawnedPIDs.size,
    });
  }

  /**
   * Clear all tracked PIDs without killing them
   * Use this only for testing or if you want to stop tracking without killing
   */
  clear(): void {
    const count = this.spawnedPIDs.size;
    this.spawnedPIDs.clear();
    logger.debug("[chrome-pid-registry] Cleared all tracked PIDs", { count });
  }
}

/**
 * Singleton instance of the Chrome PID registry
 * Import this to register/unregister PIDs or trigger cleanup
 */
export const chromePIDRegistry = new ChromePIDRegistry();

/**
 * Convenience function for killing all tracked Chrome PIDs
 * Export this for use in shutdown handlers
 */
export function killAllTrackedChromePIDs(): void {
  chromePIDRegistry.killAll();
}
