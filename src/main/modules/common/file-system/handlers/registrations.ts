import { IpcRegistration } from "../../../../../core/ipc/types";
import { handleReadFile } from "./read-file.handler";
import { handleWriteTempFile } from "./write-temp-file.handler";
import { handleGetFileSize } from "./get-file-size.handler";
import { handleCalculateTotalSize } from "./calculate-total-size.handler";
import { readImageFileHandler } from "./read-image-file.handler";

export const fileSystemRegistrations: IpcRegistration[] = [
  {
    channel: "fs:readFile",
    description: "Read a file and return its buffer",
    handler: handleReadFile,
  },
  {
    channel: "fs:writeTempFile",
    description: "Write data to a temporary file and return the path",
    handler: handleWriteTempFile,
  },
  {
    channel: "fs:getFileSize",
    description: "Get file size in bytes for a single file",
    handler: handleGetFileSize,
  },
  {
    channel: "fs:calculateTotalSize",
    description: "Calculate total disk size for multiple files (non-blocking worker)",
    handler: handleCalculateTotalSize,
  },
  {
    channel: "fs:readImageFile",
    description: "Read image file and convert to base64 data URL (non-blocking worker)",
    handler: readImageFileHandler,
  },
];
