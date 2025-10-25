/**
 * Cookie Rotation Worker Process Bootstrap
 * Runs a CookieRotationWorker in a separate Node.js process to avoid blocking
 * the Electron main process. Communication with parent via IPC (process.send/on).
 *
 * NOTE: This runs in a forked child process, so Electron APIs (like BrowserWindow)
 * are not available. Use console logging instead of the logger utility.
 */

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
  console.error("[cookie-rotation-worker-process] Uncaught exception:", err);
  // Inform parent
  if (process.send) {
    process.send({ type: "error", error: String(err) });
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[cookie-rotation-worker-process] Unhandled rejection:", reason);
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

      console.log(`[cookie-rotation-worker-process] Worker started for cookie ${cookieId}`);
    }

    if ((msg as StopMessage).cmd === "stop") {
      if (workerInstance) {
        try {
          await workerInstance.stop();
          console.log("[cookie-rotation-worker-process] Worker stopped");
        } catch (e) {
          console.warn("[cookie-rotation-worker-process] Error stopping worker:", e);
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
    console.error("[cookie-rotation-worker-process] Failed to handle message:", error);
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

console.log("[cookie-rotation-worker-process] Process initialized and waiting for commands");
