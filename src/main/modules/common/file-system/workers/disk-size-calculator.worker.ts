/**
 * File System Worker
 *
 * Background worker for file operations without blocking the main process:
 * - Calculate total disk size of files
 * - Read image files and convert to base64 data URLs
 * Communicates with parent via message passing.
 */
import { parentPort } from "worker_threads";
import * as fs from "fs/promises";

interface CalculateSizeMessage {
  type: "calculate";
  filePaths: string[];
}

interface ReadImageFileMessage {
  type: "readImageFile";
  filePath: string;
}

interface ReadFileMessage {
  type: "readFile";
  filePath: string;
}

interface ResultMessage {
  type: "result";
  totalSize: number;
  fileCount: number;
  errors: number;
}

interface ImageResultMessage {
  type: "imageResult";
  dataUrl: string;
  filePath: string; // Include filePath to match request
}

interface FileResultMessage {
  type: "fileResult";
  buffer: Buffer;
  filePath: string;
}

interface ErrorMessage {
  type: "error";
  error: string;
}

type WorkerMessage = CalculateSizeMessage | ReadImageFileMessage | ReadFileMessage;

/**
 * Calculate total disk size for given file paths
 */
async function calculateTotalSize(filePaths: string[]): Promise<ResultMessage> {
  let totalSize = 0;
  let fileCount = 0;
  let errors = 0;

  for (const filePath of filePaths) {
    if (!filePath) {
      continue; // Skip undefined/null paths
    }

    try {
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
      fileCount++;
    } catch (error) {
      errors++;
      // Silently skip files that can't be read (may have been deleted)
    }
  }

  return {
    type: "result",
    totalSize,
    fileCount,
    errors,
  };
}

/**
 * Read image file and convert to base64 data URL
 */
async function readImageFile(filePath: string): Promise<ImageResultMessage> {
  const fileBuffer = await fs.readFile(filePath);
  const base64 = fileBuffer.toString("base64");

  // Determine mime type from file extension
  const ext = filePath.toLowerCase().split(".").pop() || "jpg";
  const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    type: "imageResult",
    dataUrl,
    filePath, // Include filePath for matching
  };
}

/**
 * Read file and return raw buffer
 */
async function readFile(filePath: string): Promise<FileResultMessage> {
  const buffer = await fs.readFile(filePath);

  return {
    type: "fileResult",
    buffer,
    filePath,
  };
}

/**
 * Handle messages from parent process
 */
if (parentPort) {
  parentPort.on("message", async (message: WorkerMessage) => {
    try {
      if (message.type === "calculate") {
        const result = await calculateTotalSize(message.filePaths);
        parentPort!.postMessage(result);
      } else if (message.type === "readImageFile") {
        const result = await readImageFile(message.filePath);
        parentPort!.postMessage(result);
      } else if (message.type === "readFile") {
        const result = await readFile(message.filePath);
        parentPort!.postMessage(result);
      }
    } catch (error) {
      const errorMessage: ErrorMessage = {
        type: "error",
        error: String(error),
      };
      parentPort!.postMessage(errorMessage);
    }
  });

  // Signal ready
  parentPort.postMessage({ type: "ready" });
}
