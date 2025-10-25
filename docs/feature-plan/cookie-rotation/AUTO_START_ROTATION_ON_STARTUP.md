# Feature Plan: Auto-Start Cookie Rotation on Application Startup (Phase 2)

**Status:** Depends on Phase 1 completion  
**Prerequisites:** [Adaptive Cookie Rotation Method Execution](./ADAPTIVE_ROTATION_METHOD_EXECUTION.md) must be fully implemented and tested

This document outlines the implementation plan for automatically starting cookie rotation workers for all cookies configured to "Launch on Startup". This builds upon the config-driven rotation system established in Phase 1.

## 1. Prerequisites from Phase 1

**Before implementing Phase 2, ensure Phase 1 is complete:**

- ✅ Method abstraction layer (`RotationMethodExecutor` interface) is implemented
- ✅ All three rotation methods (`rotateCookie`, `refreshCreds`, `headless`) are implemented and working
- ✅ `CookieRotationWorker` has been refactored to be config-driven
- ✅ Worker constructor accepts `CookieRotationWorkerOptions` including `performInitialRefresh`
- ✅ Worker's `runRotationCycle` method supports `forceHeadless` option
- ✅ `GlobalRotationWorkerManager.startWorker()` accepts options parameter
- ✅ Rotation config service can fetch and parse cookie configurations
- ✅ Method fallback logic is tested and working

**If any of the above are not complete, return to Phase 1 first.**

## 2. Goal

The primary goal is to ensure that cookie rotation processes, which are essential for maintaining session validity, are automatically initiated when the application starts. This removes the need for manual intervention from the user to start each worker after a restart.

The flow for each designated cookie will be:

1. On application startup, identify cookies marked for auto-start (`launch_worker_on_startup = 1`)
2. For each cookie, immediately trigger a **headless refresh** to ensure the cookie is fresh (using Phase 1's `performInitialRefresh` option)
3. After the initial refresh, begin the regular, scheduled rotation based on the cookie's specific configuration (respecting `enabledRotationMethods` and `rotationMethodOrder` from Phase 1)

## 3. High-Level Architecture

The implementation will be centered around the `cookie-rotation` module, with specific responsibilities delegated to the repository and service layers. **This phase leverages the config-driven worker infrastructure built in Phase 1.**

1.  **Main Process (`main.ts`)**: Will be the trigger point. After the application is ready and the database is initialized, it will call the orchestration service to begin the startup process.
2.  **Cookie Repository (`cookie.repository.ts`)**: A new method `findWithRotationEnabledOnStartup()` will be added to efficiently query the database for all cookies that have the `launch_worker_on_startup` flag enabled.
3.  **Global Rotation Worker Manager (`global-rotation-worker-manager.service.ts`)**: A new method `initializeStartupWorkers()` will orchestrate the entire process. It will fetch the relevant cookies from the repository and then delegate to the **Phase 1-enhanced** `startWorker()` method for each one.
4.  **Cookie Rotation Worker (`cookie-rotation-worker.ts`)**: **Already enhanced in Phase 1** to accept `CookieRotationWorkerOptions` with `performInitialRefresh`. This phase simply uses that capability by passing `{ performInitialRefresh: true }` when starting workers at app launch.

## 4. Detailed Implementation Steps

### Step 1: Verify Phase 1 Prerequisites

**Before writing any Phase 2 code:**

1. Verify that `CookieRotationWorker` has been refactored per Phase 1 and accepts `CookieRotationWorkerOptions`
2. Test that passing `{ performInitialRefresh: true }` successfully triggers an immediate rotation with headless priority
3. Verify that `GlobalRotationWorkerManager.startWorker()` accepts an options parameter
4. Confirm all three rotation methods are implemented and the method registry is working

**If any of the above fail, complete Phase 1 first.**

### Step 2: Database Access Layer (Repository)

**File:** `src/main/modules/common/cookie/repository/cookie.repository.ts`

- **Action:** Create a new method `findWithRotationEnabledOnStartup`.
- **Description:** This method will query the `cookies` table to find all entries where the `launch_worker_on_startup` column is set to `1`. It should return an array of `Cookie` objects, fully populated with their rotation configuration.
- **Note:** The database columns already exist (added in migration 024), so this is purely a query method.

```typescript
// In src/main/modules/common/cookie/repository/cookie.repository.ts

export class CookieRepository extends BaseRepository<Cookie> {
  // ... existing methods

  /**
   * Finds all cookies that are configured to have their rotation
   * worker launched on application startup.
   * @returns A promise that resolves to an array of Cookie objects.
   */
  async findWithRotationEnabledOnStartup(): Promise<Cookie[]> {
    const rows = await this.db.all("SELECT * FROM cookies WHERE launch_worker_on_startup = 1");
    return rows.map(this.toEntity); // Assuming toEntity handles data mapping
  }
}
```

### Step 3: Orchestration Logic (Service Layer)

**File:** `src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts`

- **Action:** Create a new public method `initializeStartupWorkers`.
- **Description:** This method will be the main orchestrator. It will use the `cookieRepository` to get the list of cookies and then loop through them, calling the **Phase 1-enhanced** `startWorker` method for each.
- **Note:** `startWorker` already accepts options parameter from Phase 1. No modification needed to that method; we simply use it with `{ performInitialRefresh: true }`.

```typescript
// In src/main/modules/common/cookie-rotation/services/global-rotation-worker-manager.service.ts

import { cookieRepository } from "@modules/common/cookie/repository/cookie.repository";
// ... other imports

export class GlobalRotationWorkerManager {
  // ... existing properties and methods from Phase 1

  /**
   * NEW METHOD FOR PHASE 2
   * Identifies all cookies marked for startup and launches their rotation workers.
   * Each worker will be instructed to perform an immediate initial refresh.
   */
  async initializeStartupWorkers(): Promise<void> {
    this.logger.info("Initializing startup cookie rotation workers...");
    try {
      const startupCookies = await cookieRepository.findWithRotationEnabledOnStartup();
      if (startupCookies.length === 0) {
        this.logger.info("No cookies are configured for startup rotation.");
        return;
      }

      this.logger.info(`Found ${startupCookies.length} cookie(s) to start on launch.`);

      for (const cookie of startupCookies) {
        this.logger.info(`Starting worker for cookie: ${cookie.id} (${cookie.service})`);
        // Use Phase 1's enhanced startWorker with performInitialRefresh option
        await this.startWorker(cookie.id, { performInitialRefresh: true });
      }
    } catch (error) {
      this.logger.error("Failed to initialize startup cookie workers.", error);
    }
  }

  // NOTE: startWorker() method already accepts options from Phase 1
  // No modification needed - it already supports { performInitialRefresh?: boolean }
}
```

### Step 4: Verify Worker Enhancement (from Phase 1)

**File:** `src/main/modules/common/cookie-rotation/workers/cookie-rotation-worker.ts`

- **Action:** **VERIFY ONLY** - No changes needed if Phase 1 is complete.
- **Description:** The worker should already accept `CookieRotationWorkerOptions` with `performInitialRefresh` from Phase 1. In its `start` method, it should check for this flag. If true, it immediately executes a rotation cycle with `{ forceHeadless: true }` before setting up the recurring interval timer.

**Expected implementation from Phase 1:**

```typescript
// This should ALREADY EXIST from Phase 1 - DO NOT REWRITE

export interface CookieRotationWorkerOptions {
  performInitialRefresh?: boolean;
  proxy?: string;
  verbose?: boolean;
}

export class CookieRotationWorker {
  private options: CookieRotationWorkerOptions;

  constructor(cookieId: string, options?: CookieRotationWorkerOptions) {
    this.cookieId = cookieId;
    this.options = { performInitialRefresh: false, verbose: false, ...options };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`Worker for ${this.cookieId} is already running`);
      return;
    }
    this.isRunning = true;
    logger.info(`Starting worker for cookie ${this.cookieId}`);

    // Phase 1 implementation: perform initial refresh if requested
    if (this.options.performInitialRefresh) {
      logger.info(`Performing initial headless refresh for ${this.cookieId}`);
      await this.runRotationCycle({ forceHeadless: true });
    }

    // Set up recurring interval based on config
    const config = await cookieRotationConfigService.getCookieConfig(this.cookieId);
    const intervalMs = config.rotationIntervalMinutes * 60 * 1000;
    this.timer = setInterval(() => this.runRotationCycle(), intervalMs);
    logger.info(`Scheduled rotation every ${config.rotationIntervalMinutes} minutes`);
  }

  private async runRotationCycle(options?: { forceHeadless?: boolean }): Promise<void> {
    // Phase 1 implementation: config-driven method execution
    // If forceHeadless is true, headless method is prioritized
  }
}
```

**If the above is NOT implemented, go back to Phase 1.**

### Step 5: Application Startup Integration

**File:** `src/main/main.ts`

- **Action:** Call the new service method after the app is ready.
- **Description:** In the main application entry point, after the database has been successfully initialized, we will get the instance of the `GlobalRotationWorkerManager` and call `initializeStartupWorkers`.

```typescript
// In src/main/main.ts

// ... imports, including globalRotationWorkerManager

app.on("ready", async () => {
  // ... other startup logic like createWindow(), etc.

  try {
    // Ensure DB is initialized before proceeding
    await initializeDatabase();
    logger.info("Database initialized successfully.");

    // Initialize modules, which should instantiate services
    await loadModules();
    logger.info("IPC handlers and modules loaded.");

    // Start cookie rotation for workers marked for startup
    // This should be one of the last steps
    await globalRotationWorkerManager.initializeStartupWorkers();
  } catch (error) {
    logger.error("Failed during application startup sequence:", error);
  }
});
```

## 5. Testing and Validation

### Phase 1 Prerequisite Testing

Before testing Phase 2, verify Phase 1 works:

1. Manually start a worker with `{ performInitialRefresh: true }` via IPC
2. Verify it immediately performs a rotation cycle with headless priority
3. Verify it then starts the regular interval-based rotation
4. Verify the rotation respects `enabledRotationMethods` and `rotationMethodOrder`

### Phase 2 Testing

1.  **Manual Testing**:

    - Go to the Profiles page and configure 2-3 cookies with "Launch on Startup" enabled.
    - Set different rotation intervals and method orders for them.
    - Close and restart the application.
    - **Expected:**
      - The application logs should show `initializeStartupWorkers` was called
      - For each configured cookie, logs should show:
        - "Performing initial headless refresh" (from Phase 1 worker logic)
        - "Attempting methods in order: [headless → ...]" (headless prioritized)
        - "Method headless succeeded"
        - "Scheduled rotation every X minutes"
      - The UI should reflect that these workers are "running"

2.  **Verification**:

    - Check the "Last Rotated" timestamp on the `CookieConfigCard`. It should update shortly after startup (within ~10-30 seconds depending on headless browser startup time).
    - Disable the "Launch on Startup" toggle for a cookie, restart the app, and confirm its worker does not start automatically.
    - Enable startup for a cookie with only `refreshCreds` enabled (no headless). Verify it attempts `refreshCreds` first on startup (respecting config even during initial refresh).

3.  **Edge Cases**:
    - Restart app with no cookies marked for startup → should log "No cookies are configured for startup rotation"
    - Restart app with a cookie marked for startup but deleted from DB → should handle gracefully
    - Restart app while a worker is already running (unlikely but possible) → should not create duplicate workers

## 6. Implementation Checklist

**Phase 1 Prerequisites (must be complete):**

- [ ] Method abstraction layer implemented
- [ ] All three rotation methods implemented and tested
- [ ] Worker refactored to be config-driven
- [ ] Worker accepts and respects `performInitialRefresh` option
- [ ] `GlobalRotationWorkerManager.startWorker()` accepts options
- [ ] Manual testing of Phase 1 features passes

**Phase 2 Implementation:**

- [ ] `CookieRepository.findWithRotationEnabledOnStartup()` implemented
- [ ] `GlobalRotationWorkerManager.initializeStartupWorkers()` implemented
- [ ] `main.ts` calls `initializeStartupWorkers()` after DB init and module load
- [ ] Integration testing: app startup with 0, 1, and multiple startup cookies
- [ ] Edge case testing complete
- [ ] User documentation updated

## 7. Summary

Phase 2 is a **lightweight addition** that leverages the heavy lifting done in Phase 1. The core work is:

1. Add one repository query method
2. Add one orchestrator method to loop through startup cookies
3. Call the orchestrator from `main.ts` at the right point in the startup sequence

The actual rotation logic, config-driven behavior, method fallbacks, and initial refresh capability all come from Phase 1. This keeps Phase 2 simple and focused on the startup orchestration concern.

**Estimated Implementation Time:**

- Phase 1 complete: 2-3 hours for Phase 2 (mostly testing)
- Phase 1 incomplete: Must complete Phase 1 first (8-12 hours)

This plan provides a clear path to implementing the feature while respecting the existing modular architecture of the application and building on the solid foundation of Phase 1's config-driven rotation system.
