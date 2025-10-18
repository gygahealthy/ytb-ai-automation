// Removed unused child_process, path and app imports (workers not implemented yet)
import {
  InstanceState,
  LaunchInstanceRequest,
  LaunchInstanceResponse,
} from "../../../../shared/types";
import { instanceManager } from "./instance-manager";
import { ScreenPositioner, DEFAULT_WINDOW_CONFIG } from "./screen-positioner";
import { browserManager } from "./browser-manager";
import { moveWindowByPid } from "../../../../platform/windows/windows.util";
import { Logger } from "../../../../shared/utils/logger";

const logger = new Logger("AutomationCoordinator");

/**
 * Coordinates automation workers and manages their lifecycle
 */
export class AutomationCoordinator {
  private static instance: AutomationCoordinator;
  // workers map reserved for future worker process implementation
  // private workers: Map<string, ChildProcess> = new Map();
  private positioner: ScreenPositioner;
  private applyingPreset: boolean = false;

  private constructor() {
    this.positioner = new ScreenPositioner(DEFAULT_WINDOW_CONFIG);
    this.setupEventListeners();
  }

  /**
   * Send a chat message to a running instance and persist chat history
   */
  // sendMessageToInstance moved to chatAutomationService

  /**
   * Move an instance to a slot and reposition affected instances
   */
  async moveInstanceToSlot(instanceId: string, slot: number): Promise<any> {
    try {
      const positioner = this.getPositioner();
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) return { success: false, error: "Instance not found" };

      const activeCount = instanceManager.getAllInstances().length;
      const moveResult = positioner.moveInstanceToSlot(
        instance.screenSlot,
        slot,
        activeCount > 1 ? activeCount : undefined
      );

      // Update moved instance
      instanceManager.updateInstanceState(instanceId, {
        screenSlot: moveResult.moved.slot,
        windowBounds: moveResult.moved.bounds,
      });

      // If someone was displaced, find which instance was at target and update it
      if (moveResult.displaced) {
        const displaced = moveResult.displaced;
        const displacedInst = instanceManager
          .getAllInstances()
          .find(
            (i) =>
              i.instanceId !== instanceId && i.screenSlot === displaced.slot
          );
        if (displacedInst) {
          instanceManager.updateInstanceState(displacedInst.instanceId, {
            screenSlot: displaced.slot,
            windowBounds: displaced.bounds,
          });
          await Promise.all([
            this.repositionInstance(instanceId),
            this.repositionInstance(displacedInst.instanceId),
          ]);
          return { success: true };
        }
      }

      await this.repositionInstance(instanceId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Reposition a single instance window according to its assigned slot
   */
  async repositionInstance(instanceId: string): Promise<boolean> {
    try {
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) return false;

      const bounds = instance.windowBounds;
      if (!bounds) return false;

      // Try to use browserManager to set bounds via CDP if available
      const browserInst = browserManager.getBrowser(instance.sessionId || "");
      if (browserInst && browserInst.browser) {
        let cdpSuccess = false;
        const maxCdpAttempts = 3;
        for (let attempt = 1; attempt <= maxCdpAttempts; attempt++) {
          try {
            const pages = await browserInst.browser.pages();
            const page = pages.length > 0 ? pages[0] : null;
            if (page) {
              const client = await page.target().createCDPSession();
              const winForTarget = await client.send(
                "Browser.getWindowForTarget"
              );
              const windowId =
                (winForTarget && (winForTarget as any).windowId) ||
                (winForTarget as any).windowId;
              await client.send("Browser.setWindowBounds", {
                windowId,
                bounds: {
                  left: bounds.x,
                  top: bounds.y,
                  width: bounds.width,
                  height: bounds.height,
                  windowState: "normal" as any,
                },
              });
              try {
                await client.detach();
              } catch (e) {
                /* ignore */
              }
              logger.info(
                `CDP setWindowBounds success for instance ${instanceId} (attempt ${attempt})`
              );
              cdpSuccess = true;
              break;
            }
          } catch (err) {
            logger.warn(
              `CDP attempt ${attempt} failed for instance ${instanceId}`,
              err
            );
            // small backoff before retrying
            await new Promise((r) => setTimeout(r, 200 * attempt));
          }
        }

        if (!cdpSuccess) {
          logger.warn(
            `CDP failed for instance ${instanceId} after ${maxCdpAttempts} attempts, trying native fallback`
          );
          try {
            const pid =
              browserInst.process && (browserInst.process.pid as number);
            if (pid && process.platform === "win32") {
              logger.info(
                `Attempting native fallback moveWindowByPid for pid=${pid} bounds=${JSON.stringify(
                  bounds
                )}`
              );
              const ok = moveWindowByPid(
                pid,
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height
              );
              if (!ok) logger.warn("Windows fallback failed to move window");
              else
                logger.info(`Native moveWindowByPid succeeded for pid ${pid}`);
            } else {
              logger.warn(
                "No PID available for native fallback or platform not supported"
              );
            }
          } catch (e) {
            logger.error("Windows fallback failed", e);
          }
        }
      } else {
        logger.warn(
          `No browser instance available for ${instanceId}, cannot reposition via CDP`
        );
      }

      return true;
    } catch (error) {
      logger.error("Failed to reposition instance", error);
      return false;
    }
  }

  /**
   * Reposition all running instances according to current positioner config
   */
  /**
   * Reposition all running instances according to current positioner config
   * @param forceFullGrid when true, calculate bounds using the full configured grid (ignore activeCount)
   */
  async repositionAll(forceFullGrid: boolean = false): Promise<void> {
    // If a preset is being applied and this call is not forcing full-grid, skip to avoid
    // overriding the preset's full-grid sizing with active-count sizing.
    if (this.applyingPreset && !forceFullGrid) {
      logger.info(
        "repositionAll skipped because a preset is being applied (non-forced call)"
      );
      return;
    }

    const instances = instanceManager.getAllInstances();
    const activeCount = instances.length;
    const mode = forceFullGrid ? "full-grid" : `active-count=${activeCount}`;
    logger.info(`Repositioning all (${instances.length}) using mode: ${mode}`);

    for (let idx = 0; idx < instances.length; idx++) {
      const inst = instances[idx];
      // Recalculate window bounds. If forcing full-grid, pass undefined for activeCount so
      // calculateWindowBounds uses the configured columns/rows. Otherwise pass actual activeCount.
      const bounds = this.positioner.calculateWindowBounds(
        inst.screenSlot,
        undefined,
        forceFullGrid ? undefined : activeCount
      );
      instanceManager.updateInstanceState(inst.instanceId, {
        windowBounds: bounds,
      });
      // Attempt to apply via CDP/native fallback
      try {
        await this.repositionInstance(inst.instanceId);
      } catch (err) {
        // continue
      }
    }
  }

  /**
   * Apply a named grid preset (e.g., "2x2", "4x4", "8x8") and reassign/reposition windows
   */
  async applyPreset(preset: string): Promise<void> {
    // Guard: if preset is undefined/null/empty, log error and skip
    if (!preset || typeof preset !== "string" || preset.trim() === "") {
      logger.error(
        `applyPreset called with invalid preset: ${JSON.stringify(preset)}`
      );
      return;
    }

    // handle presets (grid, fullscreen each, cascade, and 1x2)
    const current = this.positioner.getConfig();

    if (preset === "1x1") {
      // each window occupies full screen
      this.positioner.updateConfig({
        strategy: "grid",
        grid: { ...current.grid, columns: 1, rows: 1, fullscreenEach: true },
      });
    } else if (preset === "1x2-vertical") {
      // two vertical split
      this.positioner.updateConfig({
        strategy: "grid",
        grid: { ...current.grid, columns: 1, rows: 2, fullscreenEach: false },
      });
    } else if (preset === "1x2-horizontal") {
      // two horizontal split
      this.positioner.updateConfig({
        strategy: "grid",
        grid: { ...current.grid, columns: 2, rows: 1, fullscreenEach: false },
      });
    } else if (preset === "cascade") {
      this.positioner.updateConfig({ strategy: "cascade" });
    } else {
      // map preset to columns/rows for other grid presets
      const map: Record<string, { columns: number; rows: number }> = {
        "2x2": { columns: 2, rows: 2 },
        "4x4": { columns: 4, rows: 4 },
      };

      const settings = map[preset];
      if (!settings) {
        logger.warn(`Unknown preset ${preset}`);
        return;
      }

      // Update positioner config and ensure we switch back to grid strategy
      const currentGrid = current.grid;
      logger.info(
        `Applying preset ${preset} => columns=${settings.columns} rows=${
          settings.rows
        } currentGrid=${JSON.stringify(currentGrid)}`
      );
      this.positioner.updateConfig({
        strategy: "grid",
        grid: {
          ...currentGrid,
          columns: settings.columns,
          rows: settings.rows,
          fullscreenEach: false,
        },
      });
      logger.info(
        "New grid config: " + JSON.stringify(this.positioner.getConfig().grid)
      );
    }

    // Reset slots and reassign sequentially
    this.positioner.reset();
    const instances = instanceManager.getAllInstances();
    // Assign slots using the configured full grid so the layout reflects the preset
    for (let idx = 0; idx < instances.length; idx++) {
      const inst = instances[idx];
      const newSlot = this.positioner.getNextAvailableSlot();
      const bounds = this.positioner.calculateWindowBounds(
        newSlot,
        undefined /* full-grid calc */
      );
      instanceManager.updateInstanceState(inst.instanceId, {
        screenSlot: newSlot,
        windowBounds: bounds,
      });
    }

    // Give the browser a short moment to settle (some Chrome windows may be opened maximized)
    await new Promise((r) => setTimeout(r, 250));

    // Mark that we're applying a preset so transient repositionAll calls (non-forced)
    // do not override the full-grid reposition we are about to run.
    this.applyingPreset = true;
    try {
      await this.repositionAll(true);
    } catch (e) {
      logger.warn("repositionAll(full-grid) failed after applyPreset", e);
    } finally {
      this.applyingPreset = false;
    }
  }

  static getInstance(): AutomationCoordinator {
    if (!AutomationCoordinator.instance) {
      AutomationCoordinator.instance = new AutomationCoordinator();
    }
    return AutomationCoordinator.instance;
  }

  /**
   * Launch a new automation instance
   */
  async launchInstance(
    request: LaunchInstanceRequest
  ): Promise<LaunchInstanceResponse> {
    try {
      // If a profile already has an instance, return its info so the renderer
      // can connect to the existing remote debug/session instead of trying
      // to launch a duplicate instance.
      const existingInstance = instanceManager.getInstanceByProfileId(
        request.profileId
      );
      if (existingInstance) {
        logger.info(
          `Profile ${request.profileId} already running in instance ${existingInstance.instanceId}; returning existing session info`
        );
        return {
          success: true,
          data: {
            instanceId: existingInstance.instanceId,
            sessionId: existingInstance.sessionId,
            debugPort: existingInstance.debugPort || 0,
            status: existingInstance.status,
          },
        };
      }

      // If there's no registered instance but a chat session exists (e.g., created by
      // chatAutomationService directly), register a new instance that points to that
      // existing session so the UI can connect instead of launching a duplicate.
      try {
        const { chatAutomationService } = await import(
          // @ts-ignore
          "../../chat-automation/services/chat-automation.service"
        );
        const existingSession = chatAutomationService.getSessionByProfileId?.(
          request.profileId
        );
        if (existingSession) {
          logger.info(
            `Found existing chat session for profile ${request.profileId} (session ${existingSession.sessionId}), registering instance`
          );

          // Generate instance and assign slot
          const instanceId = instanceManager.generateInstanceId(
            request.profileId,
            request.automationType
          );
          const screenSlot = this.positioner.getNextAvailableSlot();

          const initialState: InstanceState = {
            instanceId,
            profileId: request.profileId,
            automationType: request.automationType,
            provider: request.provider,
            status: "running",
            debugPort: existingSession.debugPort || 0,
            sessionId: existingSession.sessionId,
            screenSlot,
            windowBounds: { x: 0, y: 0, width: 0, height: 0 },
            currentUrl: "",
            startedAt: new Date(),
            stats: {
              messagesProcessed: 0,
              errorsCount: 0,
              uptime: 0,
              lastActivity: new Date(),
            },
          };

          instanceManager.registerInstance(initialState);

          // Recalculate bounds and update
          const activeCount = instanceManager.getAllInstances().length;
          const useActiveCount = activeCount > 1 ? activeCount : undefined;
          const recalculatedBounds = this.positioner.calculateWindowBounds(
            screenSlot,
            undefined,
            useActiveCount
          );
          instanceManager.updateInstanceState(instanceId, {
            windowBounds: recalculatedBounds,
          });

          return {
            success: true,
            data: {
              instanceId,
              sessionId: existingSession.sessionId,
              debugPort: existingSession.debugPort || 0,
              status: "running",
            },
          };
        }
      } catch (e) {
        // ignore — proceed with normal launch checks below
      }

      // Fallback: if profile is locked but no instance found, prevent launch
      if (!instanceManager.canLaunchProfile(request.profileId)) {
        return {
          success: false,
          error: "Profile is locked and cannot be launched at this time",
        };
      }

      // Check max concurrent limit
      const config = this.positioner.getConfig();
      if (instanceManager.hasReachedMaxConcurrent(config.maxConcurrent)) {
        return {
          success: false,
          error: `Maximum ${config.maxConcurrent} concurrent instances reached`,
        };
      }

      // Generate instance ID
      const instanceId = instanceManager.generateInstanceId(
        request.profileId,
        request.automationType
      );

      // Assign screen slot
      const screenSlot = this.positioner.getNextAvailableSlot();

      // Create initial state (bounds will be recalculated after registration to account for activeCount)
      const initialState: InstanceState = {
        instanceId,
        profileId: request.profileId,
        automationType: request.automationType,
        provider: request.provider,
        status: "launching",
        debugPort: 0, // will be set by worker
        screenSlot,
        windowBounds: { x: 0, y: 0, width: 0, height: 0 },
        currentUrl: "",
        startedAt: new Date(),
        stats: {
          messagesProcessed: 0,
          errorsCount: 0,
          uptime: 0,
          lastActivity: new Date(),
        },
      };

      // Register instance
      instanceManager.registerInstance(initialState);

      // Recalculate window bounds. For the very first instance, prefer full-grid calculation
      // so that an explicitly applied preset (e.g., 1x2-vertical) is respected instead of
      // collapsing to an active-count-based 1x1 layout.
      const activeCount = instanceManager.getAllInstances().length;
      const useActiveCount = activeCount > 1 ? activeCount : undefined;
      const recalculatedBounds = this.positioner.calculateWindowBounds(
        screenSlot,
        undefined,
        useActiveCount
      );
      instanceManager.updateInstanceState(instanceId, {
        windowBounds: recalculatedBounds,
      });

      // For now, use direct service calls instead of worker processes
      // (Worker process implementation can be added later)
      const result = await this.launchDirect(
        instanceId,
        request,
        recalculatedBounds
      );

      if (!result.success) {
        instanceManager.unregisterInstance(instanceId);
        this.positioner.releaseSlot(screenSlot);
        return result;
      }

      // Update instance with session info
      instanceManager.updateInstanceState(instanceId, {
        sessionId: result.data?.sessionId,
        debugPort: result.data?.debugPort || 0,
        status: "running",
      });

      logger.info(`Instance ${instanceId} launched successfully`);

      return {
        success: true,
        data: {
          instanceId,
          sessionId: result.data?.sessionId,
          debugPort: result.data?.debugPort || 0,
          status: "running",
        },
      };
    } catch (error) {
      logger.error("Failed to launch instance:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Launch instance directly (without worker process)
   * Uses existing automation services
   */
  private async launchDirect(
    instanceId: string,
    request: LaunchInstanceRequest,
    windowBounds: any
  ): Promise<LaunchInstanceResponse> {
    try {
      // Import automation service based on type
      if (request.automationType === "chat") {
        const { chatAutomationService } = await import(
          // @ts-ignore
          "../../chat-automation/services/chat-automation.service"
        );

        // If the chatAutomationService already has an active session for this profile,
        // reuse that session instead of creating a new browser/page.
        try {
          const existing = chatAutomationService.getSessionByProfileId(
            request.profileId
          );
          if (existing) {
            logger.info(
              `Reusing existing chat session ${existing.sessionId} for profile ${request.profileId}`
            );
            return {
              success: true,
              data: {
                instanceId,
                sessionId: existing.sessionId,
                debugPort: existing.debugPort || 0,
              },
            };
          }
        } catch (e) {
          // If the helper isn't available or throws, continue to init a session
          logger.debug(
            "getSessionByProfileId check failed, proceeding to initSession",
            e
          );
        }

        const result = await chatAutomationService.initSession(
          request.profileId,
          request.provider || "gemini"
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to initialize session",
          };
        }

        // Position window (if possible via CDP)
        if (result.data && windowBounds) {
          // TODO: Position window using CDP Browser.setWindowBounds
          // This requires accessing the browser instance from the service
        }

        return {
          success: true,
          data: {
            instanceId,
            sessionId: result.data?.sessionId || "",
            debugPort: result.data?.debugPort || 0,
          },
        };
      }

      // TODO: Add other automation types (veo3, youtube)
      return {
        success: false,
        error: `Automation type ${request.automationType} not yet implemented`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Stop an automation instance
   */
  async stopInstance(instanceId: string): Promise<boolean> {
    try {
      const instance = instanceManager.getInstance(instanceId);
      if (!instance) {
        logger.warn(`Instance ${instanceId} not found`);
        return false;
      }

      instanceManager.updateInstanceStatus(instanceId, "stopping");

      // Stop based on automation type
      if (instance.automationType === "chat" && instance.sessionId) {
        try {
          logger.info(`Stopping chat session ${instance.sessionId}`);
          const { chatAutomationService } = await import(
            // @ts-ignore
            "../../chat-automation/services/chat-automation.service"
          );
          const res = await chatAutomationService.closeSession(
            instance.sessionId
          );
          if (!res.success) {
            logger.error(
              `Failed to close chat session ${instance.sessionId}: ${res.error}`
            );
            instanceManager.updateInstanceStatus(instanceId, "error");
            // continue to release resources, but surface failure
          }
        } catch (err) {
          logger.error(
            `Error while closing session ${instance.sessionId}:`,
            err
          );
          instanceManager.updateInstanceStatus(instanceId, "error");
        }
      }

      // Release resources
      this.positioner.releaseSlot(instance.screenSlot);
      instanceManager.unregisterInstance(instanceId);

      logger.info(`Instance ${instanceId} stopped`);
      return true;
    } catch (error) {
      logger.error(`Failed to stop instance ${instanceId}:`, error);
      return false;
    }
  }

  /**
   * Stop all instances
   */
  async stopAll(): Promise<void> {
    const instances = instanceManager.getAllInstances();
    logger.info(`Stopping ${instances.length} instances...`);

    await Promise.all(
      instances.map((instance) => this.stopInstance(instance.instanceId))
    );
  }

  /**
   * Get positioner for configuration updates
   */
  getPositioner(): ScreenPositioner {
    return this.positioner;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to instance manager events and forward to renderer
    instanceManager.on("instance:registered", (state: InstanceState) => {
      this.broadcastToRenderer("automation:instance:registered", state);
    });

    instanceManager.on("instance:updated", (state: InstanceState) => {
      this.broadcastToRenderer("automation:instance:updated", state);
    });

    instanceManager.on("instance:status", (data: any) => {
      this.broadcastToRenderer("automation:instance:status", data);
    });

    instanceManager.on("instance:unregistered", (instanceId: string) => {
      this.broadcastToRenderer("automation:instance:unregistered", instanceId);
    });
  }

  /**
   * Broadcast event to all renderer windows
   */
  private broadcastToRenderer(channel: string, data: any): void {
    const { BrowserWindow } = require("electron");
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win: any) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  }
}

// Export singleton
export const automationCoordinator = AutomationCoordinator.getInstance();
