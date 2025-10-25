/**
 * Rotation Method Types
 * Defines the abstraction layer for all cookie rotation methods
 */

import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";

/**
 * Available rotation method types
 */
export type RotationMethodType = "refreshCreds" | "rotateCookie" | "headless";

/**
 * Result returned by a rotation method execution
 */
export interface RotationMethodResult {
  /** Whether the rotation was successful */
  success: boolean;

  /** The method that was attempted */
  method: RotationMethodType;

  /** Updated cookies to merge into the cookie collection */
  updatedCookies?: Partial<CookieCollection>;

  /** Error message if the rotation failed */
  error?: string;

  /** Duration of the rotation in milliseconds */
  duration?: number;

  /** Additional metadata about the rotation */
  metadata?: Record<string, any>;
}

/**
 * Interface that all rotation method executors must implement
 */
export interface RotationMethodExecutor {
  /** The name of this rotation method */
  name: RotationMethodType;

  /**
   * Execute the rotation method
   * @param cookies The current cookie collection
   * @param options Method-specific options
   * @returns Promise resolving to the rotation result
   */
  execute(cookies: CookieCollection, options?: any): Promise<RotationMethodResult>;
}
