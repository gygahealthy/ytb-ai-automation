import { ApiResponse } from "../../../../../core/ipc/types";
import { diskSizeCalculatorService } from "../services/disk-size-calculator.service";

/**
 * Read a file and return its buffer
 * Uses worker thread to avoid blocking the main process
 */
export async function handleReadFile(req: { filePath: string }): Promise<ApiResponse<Buffer>> {
  try {
    const result = await diskSizeCalculatorService.readFile(req.filePath);
    return { success: true, data: result.buffer };
  } catch (error) {
    return { success: false, error: `Failed to read file: ${String(error)}` };
  }
}
