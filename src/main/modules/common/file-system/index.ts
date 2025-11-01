/**
 * File System Module
 *
 * Provides file system operations including:
 * - Reading files
 * - Writing temporary files
 * - Getting file sizes
 * - Calculating total disk size (non-blocking via worker)
 */

export { fileSystemRegistrations } from "./handlers/registrations";
export { diskSizeCalculatorService } from "./services/disk-size-calculator.service";
