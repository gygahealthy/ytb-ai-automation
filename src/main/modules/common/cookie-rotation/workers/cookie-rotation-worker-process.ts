/**
 * Cookie Rotation Worker Process Bootstrap
 * Runs a CookieRotationWorker in a separate Node.js process to avoid blocking
 * the Electron main process. Communication with parent via IPC (process.send/on).
 */

import { logger } from "../../../../utils/logger-backend.js";

type StartMessage = {
  cmd: "start";
  cookieId: string;
  options?: {
    performInitialRefresh?: boolean;
    verbose?: boolean;
    proxy?: string;
  };
};

type StopMessage = {
  cmd: "stop";
};

type ForceRotationMessage = {
  cmd: "forceRotation";
};

let workerInstance: any = null;

// Handle uncaught exceptions gracefully
process.on("uncaughtException", (err) => {
  try {
    logger.error("[cookie-rotation-worker-process] Uncaught exception:", err);
  } catch (e) {
    // logger might not be available
    console.error("[cookie-rotation-worker-process] Uncaught exception:", err);
  }
  // Inform parent
  if (process.send) {
    process.send({ type: "error", error: String(err) });
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  try {
    logger.error("[cookie-rotation-worker-process] Unhandled rejection:", reason);
  } catch (e) {
    console.error("[cookie-rotation-worker-process] Unhandled rejection:", reason);
  }
  if (process.send) {
    process.send({ type: "error", error: String(reason) });
  }
});

// Handle messages from parent process
process.on("message", async (msg: StartMessage | StopMessage | ForceRotationMessage) => {
  try {
    if ((msg as StartMessage).cmd === "start") {
      const { cookieId, options } = msg as StartMessage;

      // Dynamically import the worker class (compiled .js at runtime)
      const mod = await import("./cookie-rotation-worker.js");
      const CookieRotationWorker = mod.CookieRotationWorker;

      if (!CookieRotationWorker) {
        throw new Error("CookieRotationWorker class not found in module");
      }

      // Instantiate the worker
      workerInstance = new CookieRotationWorker(cookieId, options);

      // Relay worker events back to parent process
      workerInstance.on("statusChanged", (status: string) => {
        if (process.send) {
          process.send({ type: "status", status });
        }
      });

      workerInstance.on("rotationSuccess", (result: any) => {
        if (process.send) {
          process.send({ type: "rotationSuccess", result });
        }
      });

      workerInstance.on("rotationError", (err: any) => {
        if (process.send) {
          process.send({ type: "rotationError", error: String(err) });
        }
      });

      // Start the worker
      await workerInstance.start();

      // Notify parent that worker has started
      if (process.send) {
        process.send({ type: "started", cookieId });
      }

      logger.info(`[cookie-rotation-worker-process] Worker started for cookie ${cookieId}`);
    }

    if ((msg as StopMessage).cmd === "stop") {
      if (workerInstance) {
        try {
          await workerInstance.stop();
          logger.info("[cookie-rotation-worker-process] Worker stopped");
        } catch (e) {
          logger.warn("[cookie-rotation-worker-process] Error stopping worker:", e);
        }
      }
      if (process.send) {
        process.send({ type: "stopped" });
      }
      // Give time for message to send, then exit
      setTimeout(() => process.exit(0), 100);
    }

    if ((msg as ForceRotationMessage).cmd === "forceRotation") {
      if (workerInstance && typeof workerInstance.forceRotation === "function") {
        await workerInstance.forceRotation();
        if (process.send) {
          process.send({ type: "forceRotationComplete" });
        }
      } else {
        if (process.send) {
          process.send({ type: "error", error: "Worker not running or forceRotation not available" });
        }
      }
    }
  } catch (error) {
    logger.error("[cookie-rotation-worker-process] Failed to handle message:", error);
    if (process.send) {
      process.send({ type: "error", error: String(error) });
    }
    process.exit(1);
  }
});

// Notify parent that the process is ready
if (process.send) {
  process.send({ type: "ready" });
}

logger.info("[cookie-rotation-worker-process] Process initialized and waiting for commands");
