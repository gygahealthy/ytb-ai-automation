import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { ApiResponse } from "../../../core/ipc/types";

/**
 * Read a file and return its buffer
 */
async function handleReadFile(filePath: string): Promise<ApiResponse<Buffer>> {
  const buffer = await fs.readFile(filePath);
  return { success: true, data: buffer };
}

/**
 * Write data to a temporary file and return the path
 */
async function handleWriteTempFile(req: {
  data: ArrayBuffer;
  filename: string;
  customTempPath?: string;
}): Promise<ApiResponse<string>> {
  const { data, filename, customTempPath } = req;

  // Use custom temp path from settings, or fall back to OS temp directory
  const baseTempDir = customTempPath || tmpdir();

  // Create temp directory without UUID subdirectory
  const tempDir = join(baseTempDir, "veo3-image-upload");
  await fs.mkdir(tempDir, { recursive: true });

  // Add timestamp to filename to avoid collisions
  const timestamp = Date.now();
  const filenameParts = filename.split(".");
  const ext = filenameParts.pop() || "tmp";
  const baseName = filenameParts.join(".");
  const uniqueFilename = `${baseName}_${timestamp}.${ext}`;

  // Write the file
  const tempPath = join(tempDir, uniqueFilename);
  await fs.writeFile(tempPath, Buffer.from(data));

  return { success: true, data: tempPath };
}

/**
 * Get file size in bytes
 */
async function handleGetFileSize(filePath: string): Promise<ApiResponse<number>> {
  const stats = await fs.stat(filePath);
  return { success: true, data: stats.size };
}

export const fileSystemHandlers = [
  {
    channel: "fs:readFile",
    handler: handleReadFile,
  },
  {
    channel: "fs:writeTempFile",
    handler: handleWriteTempFile,
  },
  {
    channel: "fs:getFileSize",
    handler: handleGetFileSize,
  },
];
