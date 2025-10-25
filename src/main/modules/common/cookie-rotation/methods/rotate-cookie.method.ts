/**
 * Rotate Cookie Method
 * Rotates the __Secure-1PSIDTS token using the existing rotation logic
 */

import { rotate1psidts } from "../helpers/cookie-rotation.helpers.js";
import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import type { RotationMethodExecutor, RotationMethodResult } from "../types/rotation-method.types.js";

export class RotateCookieMethod implements RotationMethodExecutor {
  name = "rotateCookie" as const;

  async execute(cookies: CookieCollection, options?: { proxy?: string }): Promise<RotationMethodResult> {
    const startTime = Date.now();

    try {
      const result = await rotate1psidts(cookies, {
        proxy: options?.proxy,
        skipCache: true,
      });

      if (result.success && result.newPSIDTS) {
        return {
          success: true,
          method: this.name,
          updatedCookies: {
            "__Secure-1PSIDTS": result.newPSIDTS,
          },
          duration: Date.now() - startTime,
          metadata: {
            rotatedToken: "1PSIDTS",
            oldPSIDTS: cookies["__Secure-1PSIDTS"]?.substring(0, 20) + "...",
            newPSIDTS: result.newPSIDTS?.substring(0, 20) + "...",
          },
        };
      }

      return {
        success: false,
        method: this.name,
        error: result.error || "Failed to rotate PSIDTS",
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        method: this.name,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }
}
