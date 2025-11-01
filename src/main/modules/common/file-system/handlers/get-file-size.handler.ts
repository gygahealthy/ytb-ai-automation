import { promises as fs } from "fs";
import { ApiResponse } from "../../../../../core/ipc/types";

/**
 * Get file size in bytes for a single file
 */
export async function handleGetFileSize(req: { filePath: string }): Promise<ApiResponse<number>> {
  const stats = await fs.stat(req.filePath);
  return { success: true, data: stats.size };
}
