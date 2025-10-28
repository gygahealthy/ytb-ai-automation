import { IpcRegistration } from "../../../../../core/ipc/types";
import { videoGenerationRegistrations } from "./video-generation";
import { videoBatchGenerationRegistrations } from "./video-batch-generation";
import { downloadRegistrations } from "./download";
import { videoUpscaleRegistrations } from "./video-upscale";
import { videoBatchUpscaleRegistrations } from "./video-batch-upscale";

// Merge all handler registrations
export const flowVeo3ApiRegistrations: IpcRegistration[] = [
  ...videoGenerationRegistrations,
  ...videoBatchGenerationRegistrations,
  ...downloadRegistrations,
  ...videoUpscaleRegistrations,
  ...videoBatchUpscaleRegistrations,
];
