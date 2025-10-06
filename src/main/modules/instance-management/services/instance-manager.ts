import { EventEmitter } from 'events';
import { InstanceState, InstanceStatus } from '../../../../types/automation.types';
import { Logger } from '../../../../utils/logger.util';
import { StringUtil } from '../../../../utils/string.util';

const logger = new Logger('AutomationInstanceManager');

/**
 * Singleton manager for all automation instances
 * Handles instance registry, profile locking, and lifecycle events
 */
export class AutomationInstanceManager extends EventEmitter {
  private static instance: AutomationInstanceManager;
  private registry: Map<string, InstanceState> = new Map();
  private profileLocks: Set<string> = new Set();

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AutomationInstanceManager {
    if (!AutomationInstanceManager.instance) {
      AutomationInstanceManager.instance = new AutomationInstanceManager();
    }
    return AutomationInstanceManager.instance;
  }

  /**
   * Check if a profile can be launched (not locked)
   */
  canLaunchProfile(profileId: string): boolean {
    return !this.profileLocks.has(profileId);
  }

  /**
   * Lock a profile to prevent duplicate launches
   */
  lockProfile(profileId: string): void {
    this.profileLocks.add(profileId);
    logger.info(`Profile ${profileId} locked`);
  }

  /**
   * Unlock a profile
   */
  unlockProfile(profileId: string): void {
    this.profileLocks.delete(profileId);
    logger.info(`Profile ${profileId} unlocked`);
  }

  /**
   * Register a new instance
   */
  registerInstance(state: InstanceState): void {
    // If instance already exists, treat this as an update instead of a fresh registration
    if (this.registry.has(state.instanceId)) {
      Object.assign(this.registry.get(state.instanceId)!, state);
      logger.info(`Instance ${state.instanceId} already exists — emitting updated event`);
      this.emit('instance:updated', this.registry.get(state.instanceId));
      return;
    }

    this.registry.set(state.instanceId, state);
    this.lockProfile(state.profileId);

    logger.info(`Instance ${state.instanceId} registered for profile ${state.profileId}`);
    this.emit('instance:registered', state);
  }

  /**
   * Unregister an instance and unlock its profile
   */
  unregisterInstance(instanceId: string): void {
    const state = this.registry.get(instanceId);
    if (state) {
      this.unlockProfile(state.profileId);
      this.registry.delete(instanceId);
      
      logger.info(`Instance ${instanceId} unregistered`);
      this.emit('instance:unregistered', instanceId);
    }
  }

  /**
   * Update instance state
   */
  updateInstanceState(instanceId: string, updates: Partial<InstanceState>): void {
    const state = this.registry.get(instanceId);
    if (state) {
      Object.assign(state, updates);
      
      // Update last activity
      if (state.stats) {
        state.stats.lastActivity = new Date();
      }
      
      this.emit('instance:updated', state);
    }
  }

  /**
   * Update instance status
   */
  updateInstanceStatus(instanceId: string, status: InstanceStatus, errorMessage?: string): void {
    const state = this.registry.get(instanceId);
    if (state) {
      state.status = status;
      if (errorMessage) {
        state.errorMessage = errorMessage;
      }
      
      logger.info(`Instance ${instanceId} status updated to ${status}`);
      this.emit('instance:status', { instanceId, status, errorMessage });
    }
  }

  /**
   * Update instance stats
   */
  updateInstanceStats(instanceId: string, stats: Partial<InstanceState['stats']>): void {
    const state = this.registry.get(instanceId);
    if (state && state.stats) {
      Object.assign(state.stats, stats);
      this.emit('instance:stats', { instanceId, stats: state.stats });
    }
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): InstanceState | undefined {
    return this.registry.get(instanceId);
  }

  /**
   * Get instance by profile ID
   */
  getInstanceByProfileId(profileId: string): InstanceState | undefined {
    return Array.from(this.registry.values()).find(s => s.profileId === profileId);
  }

  /**
   * Get all instances
   */
  getAllInstances(): InstanceState[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get instances by automation type
   */
  getInstancesByType(automationType: string): InstanceState[] {
    return Array.from(this.registry.values()).filter(s => s.automationType === automationType);
  }

  /**
   * Get running instances count
   */
  getRunningCount(): number {
    return Array.from(this.registry.values()).filter(s => s.status === 'running').length;
  }

  /**
   * Check if max concurrent instances reached
   */
  hasReachedMaxConcurrent(maxConcurrent: number): boolean {
    return this.getRunningCount() >= maxConcurrent;
  }

  /**
   * Generate unique instance ID
   */
  generateInstanceId(profileId: string, automationType: string): string {
    const timestamp = Date.now();
    const random = StringUtil.generateRandomString(8);
    return `${automationType}-${profileId}-${timestamp}-${random}`;
  }

  /**
   * Clear all instances (for cleanup/reset)
   */
  clearAll(): void {
    const instanceIds = Array.from(this.registry.keys());
    instanceIds.forEach(id => this.unregisterInstance(id));
    this.profileLocks.clear();
    logger.info('All instances cleared');
  }

  /**
   * Get registry size
   */
  size(): number {
    return this.registry.size;
  }

  /**
   * Stop all instances gracefully
   */
  async stopAll(): Promise<void> {
    const instances = this.getAllInstances();
    logger.info(`Stopping ${instances.length} instances...`);
    
    // Mark all as stopping
    instances.forEach(instance => {
      this.updateInstanceStatus(instance.instanceId, 'stopping');
    });
    
    // Emit stop events
    instances.forEach(instance => {
      this.emit('instance:stop-requested', instance.instanceId);
    });
  }
}

// Export singleton instance
export const instanceManager = AutomationInstanceManager.getInstance();
