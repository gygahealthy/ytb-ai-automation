import { IpcRegistration } from "../../../../../core/ipc/types";
import { videoGenerationRegistrations } from "./video-generation";
import { videoBatchGenerationRegistrations } from "./video-batch-generation";
import { downloadRegistrations } from "./download";
import { videoUpscaleRegistrations } from "./video-upscale";
import { videoBatchUpscaleRegistrations } from "./video-batch-upscale";
import { modelsRegistrations } from "./models";
import { videoDownloadEventListenerService } from "../services/video-download-event-listener.service";

// Initialize video download event listener on module load
console.log("[flow-veo3-apis/registrations] Initializing video download event listener...");
videoDownloadEventListenerService.initialize();
console.log("[flow-veo3-apis/registrations] Video download event listener initialized");

// Merge all handler registrations
export const flowVeo3ApiRegistrations: IpcRegistration[] = [
  ...videoGenerationRegistrations,
  ...videoBatchGenerationRegistrations,
  ...downloadRegistrations,
  ...videoUpscaleRegistrations,
  ...videoBatchUpscaleRegistrations,
  ...modelsRegistrations,
];
