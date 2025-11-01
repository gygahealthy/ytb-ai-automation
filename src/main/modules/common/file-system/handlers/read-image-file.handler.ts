/**
 * Read Image File Handler
 *
 * Reads an image file from disk and returns as base64 data URL.
 * Uses worker thread for non-blocking operation.
 */
import { diskSizeCalculatorService } from "../services/disk-size-calculator.service";
import { ApiResponse } from "../../../../../shared/types";

/**
 * Read image file and convert to base64 data URL
 * Non-blocking - uses worker thread
 */
export async function readImageFileHandler(req: { filePath: string }): Promise<ApiResponse<{ dataUrl: string }>> {
  try {
    const result = await diskSizeCalculatorService.readImageFile(req.filePath);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `Failed to read image file: ${String(error)}` };
  }
}
