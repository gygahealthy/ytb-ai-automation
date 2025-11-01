import { ApiResponse } from "../../../../../core/ipc/types";
import { diskSizeCalculatorService } from "../services/disk-size-calculator.service";

/**
 * Calculate total disk size for multiple files (non-blocking via worker)
 */
export async function handleCalculateTotalSize(req: {
  filePaths: string[];
}): Promise<ApiResponse<{ totalSize: number; fileCount: number; errors: number }>> {
  try {
    const result = await diskSizeCalculatorService.calculateTotalSize(req.filePaths);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `Failed to calculate total size: ${String(error)}` };
  }
}
