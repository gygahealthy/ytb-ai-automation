/**
 * VEO3 Polling Worker (Worker Thread)
 *
 * Runs video generation and upscale polling in a dedicated worker thread
 * to prevent blocking the main Electron process during high-volume operations.
 *
 * Features:
 * - Isolated execution environment (no blocking main process)
 * - Handles 100+ concurrent polling jobs efficiently
 * - Self-throttling to respect API rate limits
 * - Automatic retry with exponential backoff
 * - Lightweight communication via postMessage
 */

import { parentPort } from "worker_threads";

// Import necessary modules (compiled .js at runtime)
let veo3ApiClient: any;
let videoGenerationRepository: any;
let videoUpscaleRepository: any;
let cookieService: any;
let profileRepository: any;
let SQLiteDatabase: any;
let database: any; // Initialize worker environment
async function initializeWorker() {
  try {
    // Get database path from environment variable (set by parent)
    const dbPath = process.env.DB_PATH;
    if (!dbPath) {
      throw new Error("DB_PATH environment variable not set");
    }

    // Dynamically import modules
    const apiModule = await import("../apis/veo3-api.client.js");
    veo3ApiClient = apiModule.veo3ApiClient;

    // @ts-ignore - Path resolved at runtime after compilation
    const cookieModule = await import("../../../common/cookie/services/cookie.service.js");
    cookieService = cookieModule.cookieService;

    // Initialize database connection first (worker needs its own connection)
    // @ts-ignore - Path resolved at runtime after compilation
    const dbModule = await import("../../../../storage/sqlite-database.js");
    SQLiteDatabase = dbModule.SQLiteDatabase;
    database = new SQLiteDatabase(dbPath);
    await database.waitForInit();

    // Create repository instances with worker's database (don't import singletons)
    const genRepoModule = await import("../repository/video-generation.repository.js");
    const VideoGenerationRepositoryClass = genRepoModule.VideoGenerationRepository;
    videoGenerationRepository = new VideoGenerationRepositoryClass(database);

    const upscaleRepoModule = await import("../repository/video-upscale.repository.js");
    const VideoUpscaleRepositoryClass = upscaleRepoModule.VideoUpscaleRepository;
    videoUpscaleRepository = new VideoUpscaleRepositoryClass(database);

    // Initialize profileRepository with worker's database instance
    // @ts-ignore - Path resolved at runtime after compilation
    const ProfileRepositoryModule = await import("../../../profile-management/repository/profile.repository.js");
    const ProfileRepositoryClass = ProfileRepositoryModule.ProfileRepository;
    profileRepository = new ProfileRepositoryClass(database);

    sendMessage({ type: "initialized" });
  } catch (error) {
    sendMessage({ type: "error", error: String(error) });
  }
}

// Message types
type AddJobMessage = {
  cmd: "add";
  id: string;
  type: "generation" | "upscale";
  promptId?: string;
  profileId: string;
  operationName: string;
  sceneId: string;
};

type RemoveJobMessage = {
  cmd: "remove";
  id: string;
};

type GetQueueMessage = {
  cmd: "getQueue";
};

type ShutdownMessage = {
  cmd: "shutdown";
};

interface PollingJob {
  id: string;
  type: "generation" | "upscale";
  promptId?: string;
  profileId: string;
  operationName: string;
  sceneId: string;
  attempts: number;
  lastChecked: number;
  backoffMs: number; // Exponential backoff delay
}

// Polling configuration
const POLL_INTERVAL_MS = 1000; // Poll every 1 second (10x faster cycles)
const MAX_ATTEMPTS = 3600; // 1 hour max (3600 * 1s) - adjusted for 1s intervals
const MAX_CONCURRENT_CHECKS = 10; // Check max 10 items per cycle (10 req/s = 100 req/10s)
const BACKOFF_MULTIPLIER = 1.5; // Exponential backoff multiplier
const MAX_BACKOFF_MS = 60000; // Max 60 seconds backoff

// Polling queue
const pollingJobs = new Map<string, PollingJob>();
let isPolling = false;
let pollingTimer: NodeJS.Timeout | null = null;

/**
 * Send message to parent process
 */
function sendMessage(message: any) {
  if (parentPort) {
    parentPort.postMessage(message);
  }
}

/**
 * Log with worker prefix
 */
function log(level: "info" | "warn" | "error", ...args: any[]) {
  const timestamp = new Date().toISOString();
  const prefix = `[VEO3PollingWorker] [${timestamp}]`;

  if (level === "error") {
    console.error(prefix, ...args);
  } else if (level === "warn") {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

/**
 * Add job to polling queue
 */
function addJob(job: AddJobMessage) {
  if (pollingJobs.has(job.id)) {
    log("info", `${job.type} ${job.id} already in queue`);
    return;
  }

  pollingJobs.set(job.id, {
    id: job.id,
    type: job.type,
    promptId: job.promptId,
    profileId: job.profileId,
    operationName: job.operationName,
    sceneId: job.sceneId,
    attempts: 0,
    lastChecked: 0,
    backoffMs: POLL_INTERVAL_MS, // Start with 1s interval
  });

  log("info", `Added ${job.type} ${job.id} to queue (total: ${pollingJobs.size})`);

  // Start polling if not already running
  if (!isPolling) {
    startPolling();
  }
}

/**
 * Remove job from polling queue
 */
function removeJob(id: string) {
  const removed = pollingJobs.delete(id);
  if (removed) {
    log("info", `Removed ${id} from queue (remaining: ${pollingJobs.size})`);
  }

  // Stop polling if queue is empty
  if (pollingJobs.size === 0 && isPolling) {
    stopPolling();
  }
}

/**
 * Get queue status
 */
function getQueueStatus() {
  return {
    size: pollingJobs.size,
    jobs: Array.from(pollingJobs.values()).map((job) => ({
      id: job.id,
      type: job.type,
      attempts: job.attempts,
      backoffMs: job.backoffMs,
    })),
  };
}

/**
 * Start polling loop
 */
function startPolling() {
  if (isPolling) {
    return;
  }

  isPolling = true;
  log("info", "Starting polling loop");

  pollingTimer = setInterval(async () => {
    await pollNextBatch();
  }, POLL_INTERVAL_MS);
}

/**
 * Stop polling loop
 */
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  isPolling = false;
  log("info", "Stopped polling loop");
}

/**
 * Poll next batch of jobs (throttled)
 */
async function pollNextBatch() {
  if (pollingJobs.size === 0) {
    return;
  }

  const now = Date.now();

  // Get jobs ready to be checked (based on backoff delay)
  const jobsToCheck = Array.from(pollingJobs.values())
    .filter((job) => now - job.lastChecked >= job.backoffMs)
    .slice(0, MAX_CONCURRENT_CHECKS); // Limit concurrent checks

  if (jobsToCheck.length === 0) {
    return;
  }

  log("info", `Checking ${jobsToCheck.length} job(s) (queue: ${pollingJobs.size})`);

  // Process jobs in parallel (but throttled by MAX_CONCURRENT_CHECKS)
  await Promise.allSettled(jobsToCheck.map((job) => checkJobStatus(job)));
}

/**
 * Check status of a single job
 */
async function checkJobStatus(job: PollingJob) {
  const { id, type, profileId, operationName, sceneId } = job;

  job.attempts++;
  job.lastChecked = Date.now();

  try {
    log("info", `[${job.attempts}/${MAX_ATTEMPTS}] Checking ${type} ${id}`);

    // Get profile cookies
    const profile = await profileRepository.findById(profileId);
    if (!profile || !profile.isLoggedIn) {
      throw new Error("Profile not found or not logged in");
    }

    const cookieResult = await cookieService.getCookiesByProfile(profileId);
    if (!cookieResult.success || !cookieResult.data || cookieResult.data.length === 0) {
      throw new Error("No cookies found for profile");
    }

    const COOKIE_SERVICES = { FLOW: "flow" }; // Simplified constant
    const flowCookie = cookieResult.data.find((c: any) => c.service === COOKIE_SERVICES.FLOW && c.status === "active");

    if (!flowCookie || !flowCookie.rawCookieString) {
      throw new Error("No active flow cookie found");
    }

    // Extract bearer token
    const tokenResult = await veo3ApiClient.extractBearerToken(flowCookie.rawCookieString);
    if (!tokenResult.success || !tokenResult.token) {
      throw new Error("Failed to extract bearer token");
    }

    // Check status based on type
    let statusResult: any;
    if (type === "upscale") {
      statusResult = await veo3ApiClient.checkUpscaleStatus(tokenResult.token, operationName, sceneId);
    } else {
      statusResult = await veo3ApiClient.checkGenerationStatus(tokenResult.token, operationName, sceneId);
    }

    if (!statusResult.success || !statusResult.data) {
      throw new Error(statusResult.error || "Failed to check status");
    }

    // Extract status from response
    const rawData = statusResult.data;
    const operations = Array.isArray(rawData.operations)
      ? rawData.operations
      : Array.isArray(rawData.raw?.operations)
      ? rawData.raw.operations
      : [];

    const operation = operations[0];
    if (!operation) {
      throw new Error("No operation data in response");
    }

    const apiStatus = operation.status || "UNKNOWN";
    const metadata = operation.operation?.metadata;
    const video = metadata?.video;

    log("info", `${type} ${id} status: ${apiStatus}`);

    // Map API status to database status
    let dbStatus: "pending" | "processing" | "completed" | "failed" = "processing";
    if (apiStatus === "MEDIA_GENERATION_STATUS_SUCCESSFUL") {
      dbStatus = "completed";
    } else if (apiStatus === "MEDIA_GENERATION_STATUS_FAILED") {
      dbStatus = "failed";
    } else if (apiStatus === "MEDIA_GENERATION_STATUS_PENDING") {
      dbStatus = "pending";
    } else if (apiStatus === "MEDIA_GENERATION_STATUS_ACTIVE") {
      dbStatus = "processing";
    }

    // Extract video metadata
    const mediaGenerationId = video?.mediaGenerationId || operation.mediaGenerationId;
    const fifeUrl = video?.fifeUrl;
    const servingBaseUri = video?.servingBaseUri;
    const videoUrl = fifeUrl || servingBaseUri || video?.url || operation.videoUrl || "";

    // Update database
    if (type === "upscale") {
      await videoUpscaleRepository.updateStatus(id, dbStatus, {
        mediaGenerationId,
        fifeUrl,
        servingBaseUri,
        videoUrl,
        seed: video?.seed,
        aspectRatio: video?.aspectRatio,
        rawResponse: JSON.stringify(rawData),
        errorMessage: dbStatus === "failed" ? "Upscale generation failed" : undefined,
      });
    } else {
      await videoGenerationRepository.updateStatus(id, dbStatus, {
        mediaGenerationId,
        fifeUrl,
        servingBaseUri,
        videoUrl,
        rawResponse: JSON.stringify(rawData),
        errorMessage: dbStatus === "failed" ? "Video generation failed" : undefined,
      });
    }

    // Send status update to parent
    const estimatedProgress = Math.min(95, Math.floor((job.attempts / MAX_ATTEMPTS) * 100));
    sendMessage({
      type: "statusUpdate",
      jobType: type,
      data: {
        id,
        promptId: job.promptId,
        status: dbStatus,
        videoUrl: dbStatus === "completed" ? videoUrl : undefined,
        completedAt: dbStatus === "completed" ? new Date().toISOString() : undefined,
        progress: dbStatus === "completed" ? 100 : estimatedProgress,
        error: dbStatus === "failed" ? "Generation failed" : undefined,
      },
    });

    // Handle terminal states
    if (dbStatus === "completed" || dbStatus === "failed") {
      log("info", `${type} ${id} reached terminal state: ${dbStatus}`);
      removeJob(id);
      job.backoffMs = POLL_INTERVAL_MS; // Reset backoff
    } else {
      // Increase backoff for next attempt (exponential backoff)
      job.backoffMs = Math.min(job.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      log("info", `Next check for ${id} in ${job.backoffMs}ms`);
    }

    // Check if max attempts reached
    if (job.attempts >= MAX_ATTEMPTS) {
      log("error", `Max attempts reached for ${type} ${id}`);
      removeJob(id);

      sendMessage({
        type: "statusUpdate",
        jobType: type,
        data: {
          id,
          promptId: job.promptId,
          status: "failed",
          error: "Max polling attempts reached",
          progress: 0,
        },
      });
    }
  } catch (error) {
    log("error", `Error checking ${type} ${id}:`, error);

    // Increase backoff on error
    job.backoffMs = Math.min(job.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);

    // Remove if max attempts reached
    if (job.attempts >= MAX_ATTEMPTS) {
      log("error", `Max attempts reached for ${type} ${id}, removing from queue`);
      removeJob(id);

      sendMessage({
        type: "statusUpdate",
        jobType: type,
        data: {
          id,
          promptId: job.promptId,
          status: "failed",
          error: String(error),
          progress: 0,
        },
      });
    }
  }
}

/**
 * Handle shutdown
 */
function handleShutdown() {
  log("info", "Shutting down worker...");
  stopPolling();
  pollingJobs.clear();
  sendMessage({ type: "shutdown" });
  process.exit(0);
}

// Initialize worker on startup
initializeWorker();

// Listen for messages from parent
if (parentPort) {
  parentPort.on("message", (message: AddJobMessage | RemoveJobMessage | GetQueueMessage | ShutdownMessage) => {
    try {
      if (message.cmd === "add") {
        addJob(message);
      } else if (message.cmd === "remove") {
        removeJob(message.id);
      } else if (message.cmd === "getQueue") {
        sendMessage({ type: "queueStatus", data: getQueueStatus() });
      } else if (message.cmd === "shutdown") {
        handleShutdown();
      }
    } catch (error) {
      log("error", "Error handling message:", error);
      sendMessage({ type: "error", error: String(error) });
    }
  });
}

// Handle worker thread termination
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);
