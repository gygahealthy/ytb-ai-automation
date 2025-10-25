# Feature Plan: Adaptive Cookie Rotation Method Execution (Phase 1)

**Status:** Foundation Phase - Must be completed before Phase 2  
**Next Phase:** [Auto-Start Cookie Rotation on Application Startup](./AUTO_START_ROTATION_ON_STARTUP.md)

This document outlines the implementation plan for making the cookie rotation worker respect and execute the configured rotation methods in the user-defined order. This is the foundational work required before implementing automatic startup workers.

## 1. Current State Analysis

### Database Schema Status

✅ **The columns DO exist** in the database through migration 024:

- `launch_worker_on_startup` (INTEGER, default 0)
- `enabled_rotation_methods` (TEXT, JSON array, default `["refreshCreds","rotateCookie"]`)
- `rotation_method_order` (TEXT, JSON array, default `["refreshCreds","rotateCookie","headless"]`)

**Why they're not visible in `schema.sql`:**

- `schema.sql` is a **bootstrap reference file** only used for initial DB creation
- Real schema changes go through **versioned migrations** (in `src/main/storage/migrations/modules/`)
- Migration 024 added these columns on 2024-10-25 (or whenever it was first run)
- The project follows the **modular migration pattern**, not one-shot schema updates

### Current Worker Limitations

The existing `CookieRotationWorker` class has these issues:

1. **Hard-coded to only rotate PSIDTS**: Only calls `rotate1psidts` and `startAutoRotation`
2. **Ignores user configuration**: Doesn't read `enabledRotationMethods` or `rotationMethodOrder`
3. **No method fallback logic**: Doesn't try alternative methods if one fails
4. **Missing method implementations**: No integration with `refreshCreds`, `rotateCookie`, or `headless` refresh

### Available Rotation Methods (from UI and config)

Based on `CookieConfigCard.tsx` and type definitions:

1. **`refreshCreds`**: Refresh credentials using existing session (likely a SIDCC refresh)
2. **`rotateCookie`**: Rotate the PSIDTS token (current implementation)
3. **`headless`**: Full headless browser refresh to get completely fresh cookies

## 2. Goal

Transform the cookie rotation worker to be **configuration-driven**, where:

1. Each cookie's rotation cycle **only attempts enabled methods** in the user-specified order
2. If a method fails, the worker moves to the next method in the priority list
3. The worker logs which method succeeded and updates monitoring data accordingly
4. The startup behavior (from previous plan) triggers headless first, then starts the scheduled rotation

## 3. Architecture Changes

### 3.1 Worker Refactoring

**File:** `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker.ts`

**Current Architecture:**

```
Worker → startAutoRotation (hardcoded PSIDTS rotation only)
```

**New Architecture:**

```
Worker → Fetch Config → Build Method Chain → Execute in Order → Update Monitor
```

The worker will:

1. Fetch the cookie's configuration from the database (via `CookieRotationConfigService`)
2. Build a method execution pipeline based on `enabledRotationMethods` and `rotationMethodOrder`
3. Execute methods in sequence until one succeeds
4. Log detailed results and update the monitoring table

### 3.2 Method Abstraction Layer

Create a unified interface for all rotation methods to make them interchangeable:

```typescript
// New file: src/main/modules/common/cookie-rotation/types/rotation-method.types.ts

export type RotationMethodType = "refreshCreds" | "rotateCookie" | "headless";

export interface RotationMethodResult {
  success: boolean;
  method: RotationMethodType;
  updatedCookies?: Partial<CookieCollection>;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface RotationMethodExecutor {
  name: RotationMethodType;
  execute(cookies: CookieCollection, options?: any): Promise<RotationMethodResult>;
}
```

### 3.3 Method Implementations

Each rotation method will be implemented as a separate executor:

**File Structure:**

```
src/main/modules/common/cookie-rotation/methods/
  ├── refresh-creds.method.ts      # SIDCC refresh logic
  ├── rotate-cookie.method.ts      # PSIDTS rotation (existing logic)
  ├── headless.method.ts           # Full browser-based refresh
  └── index.ts                      # Export all methods
```

## 4. Detailed Implementation Steps

### Step 1: Create Method Abstraction Types

**File:** `src/main/modules/common/cookie-rotation/types/rotation-method.types.ts`

Create the interface definitions for rotation methods as shown in section 3.2.

### Step 2: Implement Individual Rotation Methods

#### 2a. Rotate Cookie Method (refactor existing)

**File:** `src/main/modules/common/cookie-rotation/methods/rotate-cookie.method.ts`

```typescript
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
```

#### 2b. Refresh Creds Method

**File:** `src/main/modules/common/cookie-rotation/methods/refresh-creds.method.ts`

```typescript
import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import type { RotationMethodExecutor, RotationMethodResult } from "../types/rotation-method.types.js";
import { logger } from "../../../../utils/logger-backend.js";

/**
 * Refresh credentials method
 * Uses the existing SIDCC to refresh session tokens without full rotation
 * This is typically faster and less intrusive than full rotation
 */
export class RefreshCredsMethod implements RotationMethodExecutor {
  name = "refreshCreds" as const;

  async execute(cookies: CookieCollection, options?: { proxy?: string }): Promise<RotationMethodResult> {
    const startTime = Date.now();

    try {
      // TODO: Implement SIDCC-based credential refresh
      // This should use the gemini-apis/handlers/refresh-creds.ts logic
      // For now, this is a placeholder

      logger.warn("[RefreshCredsMethod] Not yet fully implemented - placeholder");

      // Expected implementation:
      // 1. Extract SIDCC from cookies
      // 2. Make refresh API call to Google
      // 3. Parse and return updated tokens
      // 4. Update cookies with new tokens

      return {
        success: false,
        method: this.name,
        error: "RefreshCreds method not yet implemented",
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
```

#### 2c. Headless Refresh Method

**File:** `src/main/modules/common/cookie-rotation/methods/headless.method.ts`

```typescript
import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import type { RotationMethodExecutor, RotationMethodResult } from "../types/rotation-method.types.js";
import { logger } from "../../../../utils/logger-backend.js";

/**
 * Headless browser refresh method
 * Launches a headless browser session to get completely fresh cookies
 * This is the most reliable but also the most resource-intensive method
 */
export class HeadlessMethod implements RotationMethodExecutor {
  name = "headless" as const;

  async execute(
    cookies: CookieCollection,
    options?: { proxy?: string; cookieId?: string; profileId?: string }
  ): Promise<RotationMethodResult> {
    const startTime = Date.now();

    try {
      // TODO: Implement headless browser refresh
      // This should integrate with existing gemini-apis handlers
      // Specifically: gemini-apis/handlers/refresh-creds.ts force-headless-refresh logic

      logger.warn("[HeadlessMethod] Not yet fully implemented - placeholder");

      // Expected implementation:
      // 1. Get profile from cookieId
      // 2. Launch headless Puppeteer/Playwright session
      // 3. Navigate to Gemini and restore cookies
      // 4. Wait for session to establish
      // 5. Extract all fresh cookies
      // 6. Parse and return updated cookie collection

      return {
        success: false,
        method: this.name,
        error: "Headless method not yet implemented",
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
```

#### 2d. Method Registry

**File:** `src/main/modules/common/cookie-rotation/methods/index.ts`

```typescript
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
}

// Singleton instance
export const rotationMethodRegistry = new RotationMethodRegistry();
```

### Step 3: Refactor Cookie Rotation Worker

**File:** `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker.ts`

The worker needs a complete overhaul to be config-driven:

```typescript
/**
 * MAJOR REFACTOR: Config-Driven Cookie Rotation Worker
 *
 * Changes:
 * 1. Remove hardcoded PSIDTS rotation
 * 2. Fetch and respect per-cookie rotation configuration
 * 3. Execute methods in user-defined order
 * 4. Fall back to next method on failure
 * 5. Support initial refresh on startup
 */

import type { CookieCollection } from "../../../gemini-apis/shared/types/index.js";
import { logger } from "../../../../utils/logger-backend.js";
import { rotationMethodRegistry } from "../methods/index.js";
import { cookieRotationConfigService } from "../services/cookie-rotation-config.service.js";
import type { RotationMethodResult } from "../types/rotation-method.types.js";

export interface CookieRotationWorkerOptions {
  performInitialRefresh?: boolean;
  proxy?: string;
  verbose?: boolean;
}

export class CookieRotationWorker {
  private cookieId: string;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private options: CookieRotationWorkerOptions;

  constructor(cookieId: string, options?: CookieRotationWorkerOptions) {
    this.cookieId = cookieId;
    this.options = {
      performInitialRefresh: false,
      verbose: false,
      ...options,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`[CookieRotationWorker] Worker for ${this.cookieId} is already running`);
      return;
    }

    this.isRunning = true;
    logger.info(`[CookieRotationWorker] Starting worker for cookie ${this.cookieId}`);

    // Perform initial refresh if requested (startup scenario)
    if (this.options.performInitialRefresh) {
      logger.info(`[CookieRotationWorker] Performing initial headless refresh for ${this.cookieId}`);
      await this.runRotationCycle({ forceHeadless: true });
    }

    // Fetch config to set up recurring interval
    const config = await cookieRotationConfigService.getCookieConfig(this.cookieId);
    if (!config) {
      logger.error(`[CookieRotationWorker] No config found for cookie ${this.cookieId}`);
      this.isRunning = false;
      return;
    }

    const intervalMs = config.rotationIntervalMinutes * 60 * 1000;
    this.timer = setInterval(() => this.runRotationCycle(), intervalMs);

    logger.info(`[CookieRotationWorker] Scheduled rotation every ${config.rotationIntervalMinutes} minutes`);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    logger.info(`[CookieRotationWorker] Stopped worker for cookie ${this.cookieId}`);
  }

  private async runRotationCycle(options?: { forceHeadless?: boolean }): Promise<void> {
    logger.info(`[CookieRotationWorker] Running rotation cycle for ${this.cookieId}`);

    try {
      // 1. Fetch current config
      const config = await cookieRotationConfigService.getCookieConfig(this.cookieId);
      if (!config) {
        logger.error(`[CookieRotationWorker] Config not found for ${this.cookieId}`);
        return;
      }

      // 2. Fetch current cookie data
      const { cookieRepository } = await import("../../cookie/repository/cookie.repository.js");
      const cookie = await cookieRepository.findById(this.cookieId);
      if (!cookie) {
        logger.error(`[CookieRotationWorker] Cookie ${this.cookieId} not found in DB`);
        return;
      }

      // 3. Parse cookies into CookieCollection
      const cookies = this.parseCookieString(cookie.rawCookieString || "");

      // 4. Determine method order
      let methodsToTry = config.enabledRotationMethods.filter((method) => config.rotationMethodOrder.includes(method));

      // Sort by the order specified in rotationMethodOrder
      methodsToTry.sort((a, b) => {
        return config.rotationMethodOrder.indexOf(a) - config.rotationMethodOrder.indexOf(b);
      });

      // If forceHeadless, put headless first
      if (options?.forceHeadless && methodsToTry.includes("headless")) {
        methodsToTry = ["headless", ...methodsToTry.filter((m) => m !== "headless")];
      }

      logger.info(`[CookieRotationWorker] Attempting methods in order: ${methodsToTry.join(" → ")}`);

      // 5. Try each method until one succeeds
      let lastResult: RotationMethodResult | null = null;

      for (const methodName of methodsToTry) {
        const method = rotationMethodRegistry.get(methodName);
        if (!method) {
          logger.warn(`[CookieRotationWorker] Method ${methodName} not found in registry`);
          continue;
        }

        logger.info(`[CookieRotationWorker] Trying method: ${methodName}`);
        const result = await method.execute(cookies, {
          proxy: this.options.proxy,
          cookieId: this.cookieId,
          profileId: cookie.profileId,
        });

        lastResult = result;

        if (result.success) {
          logger.info(`[CookieRotationWorker] ✅ Method ${methodName} succeeded in ${result.duration}ms`);

          // Update cookies in database
          if (result.updatedCookies) {
            const updatedCookieString = this.buildCookieString({
              ...cookies,
              ...result.updatedCookies,
            });
            await cookieRepository.update(this.cookieId, {
              rawCookieString: updatedCookieString,
              lastRotatedAt: new Date().toISOString(),
            });
          }

          // Update monitoring table
          await this.updateMonitor(methodName, true, result);
          return; // Success - exit early
        } else {
          logger.warn(`[CookieRotationWorker] ⚠️ Method ${methodName} failed: ${result.error}`);
        }
      }

      // All methods failed
      logger.error(`[CookieRotationWorker] ❌ All rotation methods failed for ${this.cookieId}`);
      if (lastResult) {
        await this.updateMonitor("unknown", false, lastResult);
      }
    } catch (error) {
      logger.error(`[CookieRotationWorker] Rotation cycle error for ${this.cookieId}:`, error);
    }
  }

  private async updateMonitor(method: string, success: boolean, result: RotationMethodResult): Promise<void> {
    // TODO: Update cookie_rotation_monitors table with attempt details
    // This should integrate with CookieRotationMonitorRepository
  }

  private parseCookieString(cookieString: string): CookieCollection {
    // Simple parser - split by semicolon, extract key=value pairs
    const cookies: CookieCollection = {};
    const pairs = cookieString.split(";").map((p) => p.trim());
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        cookies[key.trim()] = valueParts.join("=").trim();
      }
    }
    return cookies;
  }

  private buildCookieString(cookies: CookieCollection): string {
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }
}
```

### Step 4: Update Global Rotation Worker Manager

**File:** `src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts`

Update the `startWorker` method signature to accept the new options:

```typescript
async startWorker(cookieId: string, options?: { performInitialRefresh?: boolean }): Promise<void> {
  // Check if already running
  if (this.workers.has(cookieId)) {
    logger.warn(`[GlobalRotationWorkerManager] Worker already running for ${cookieId}`);
    return;
  }

  // Create new worker with options
  const worker = new CookieRotationWorker(cookieId, {
    performInitialRefresh: options?.performInitialRefresh ?? false,
    verbose: true, // or from config
  });

  this.workers.set(cookieId, worker);

  // Start the worker
  await worker.start();
}
```

### Step 5: Integration with Existing Handlers

**Files to Update:**

- `src/main/modules/gemini-apis/handlers/refresh-creds.ts` (if exists)
- `src/main/modules/common/cookie-rotation/handlers/registrations.ts`

Ensure the IPC handlers for manual refresh actions (`force-headless-refresh`, `force-visible-refresh`) integrate with the new method system.

### Step 6: Update Monitoring Repository

**File:** `src/main/modules/common/cookie-rotation/repository/cookie-rotation-monitor.repository.ts`

Add methods to track which rotation method was used:

```typescript
async recordRotationAttempt(
  cookieId: string,
  method: RotationMethodType,
  success: boolean,
  error?: string
): Promise<void> {
  // Update appropriate counters based on method
  // Update last_error_at and last_error_message if failed
  // Update session_health based on consecutive failures
}
```

### Step 7: Testing Strategy

1. **Unit Tests**: Create tests for each rotation method in isolation
2. **Integration Tests**: Test the full rotation cycle with various config combinations
3. **Manual Testing**:
   - Set up a cookie with only `refreshCreds` enabled → verify it only tries that method
   - Set up order as `["headless", "rotateCookie"]` → verify headless is tried first
   - Disable all methods → verify worker doesn't run
   - Enable startup with headless priority → verify initial headless refresh

## 5. Migration/Update Strategy

### Option A: Keep Existing Worker, Create New One

- Rename current `cookie-rotation-worker.ts` to `legacy-cookie-rotation-worker.ts`
- Create new `cookie-rotation-worker.ts` with config-driven logic
- Gradually migrate workers to new implementation

### Option B: In-Place Refactor (Recommended)

- Back up current worker implementation
- Refactor in place following the steps above
- Use feature flag to toggle between old/new behavior during transition

## 6. Why Columns Aren't in schema.sql

**Important Note**: The `schema.sql` file is a **bootstrap reference** only. It's used when creating a brand new database from scratch, but it does NOT reflect the current state of the database after migrations have run.

**The source of truth** for the database schema is:

1. `schema.sql` (initial bootstrap)
2. **Plus all migrations** in `src/main/storage/migrations/modules/` that have run

**Migration 024** successfully added:

- `launch_worker_on_startup`
- `enabled_rotation_methods`
- `rotation_method_order`

These columns exist in your running database, even though they're not in `schema.sql`.

**To verify**, you can:

```sql
PRAGMA table_info(cookies);
```

Or add a debug script:

```typescript
// scripts/check-cookie-schema.js
import { initializeDatabase } from "../src/main/storage/database.js";

async function checkSchema() {
  const db = await initializeDatabase();
  const columns = await db.all("PRAGMA table_info(cookies)");
  console.table(columns);
}

checkSchema();
```

## 7. Summary

This plan (Phase 1) transforms the cookie rotation system from a hard-coded PSIDTS rotator into a fully configurable, method-driven system that:

1. ✅ Respects user-defined enabled methods
2. ✅ Executes methods in user-defined priority order
3. ✅ Falls back to alternative methods on failure
4. ✅ Supports initial headless refresh capability (used by Phase 2)
5. ✅ Tracks which method succeeded in monitoring data
6. ✅ Maintains backward compatibility during transition

**Implementation Order:**

1. Create method abstraction layer (types + interface)
2. Implement individual method executors (rotateCookie, refreshCreds, headless)
3. Refactor worker to use method registry and respect config
4. Update global manager with options support (`performInitialRefresh`, etc.)
5. Add monitoring and logging infrastructure
6. Test each configuration scenario and method fallback logic
7. Document new behavior for users

**Once Phase 1 is complete and tested**, proceed to Phase 2: [Auto-Start Cookie Rotation on Application Startup](./AUTO_START_ROTATION_ON_STARTUP.md), which will leverage this config-driven infrastructure to automatically launch workers at app startup.
