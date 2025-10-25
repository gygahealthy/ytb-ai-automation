/**
 * Rotation Method Registry
 * Central registry for all available rotation methods
 */

import { RotateCookieMethod } from "./rotate-cookie.method.js";
import { RefreshCredsMethod } from "./refresh-creds.method.js";
import { HeadlessMethod } from "./headless.method.js";
import type { RotationMethodExecutor, RotationMethodType } from "../types/rotation-method.types.js";

export class RotationMethodRegistry {
  private methods = new Map<RotationMethodType, RotationMethodExecutor>();

  constructor() {
    // Register all available methods
    this.register(new RotateCookieMethod());
    this.register(new RefreshCredsMethod());
    this.register(new HeadlessMethod());
  }

  private register(method: RotationMethodExecutor): void {
    this.methods.set(method.name, method);
  }

  get(methodName: RotationMethodType): RotationMethodExecutor | undefined {
    return this.methods.get(methodName);
  }

  getAll(): RotationMethodExecutor[] {
    return Array.from(this.methods.values());
  }

  has(methodName: RotationMethodType): boolean {
    return this.methods.has(methodName);
  }
}

// Singleton instance
export const rotationMethodRegistry = new RotationMethodRegistry();

// Re-export types for convenience
export type { RotationMethodType, RotationMethodExecutor, RotationMethodResult } from "../types/rotation-method.types.js";
