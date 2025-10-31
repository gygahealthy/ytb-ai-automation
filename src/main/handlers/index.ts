import { collectModuleRegistrations } from "./module-loader";
import { registerAll } from "../../core/ipc/registry";
import { logger } from "../utils/logger-backend";
import { IpcRegistration } from "../../core/ipc/types";
import { registerDevToolsHandlers } from "../modules/common/devtools";
import { shellRegistrations } from "../modules/common/shell";
import { fileSystemHandlers } from "../modules/common/file-system";

/**
 * Register all IPC handlers
 * This is the bridge between renderer process and services
 */
export function registerIPCHandlers(): void {
  // Collect registrations from modules
  const allRegistrations = collectModuleRegistrations();
  console.log(`[Handler Registry] Collected ${allRegistrations.length} registrations from modules`);

  // Add core shell utility handlers
  allRegistrations.push(...shellRegistrations);
  console.log(`[Handler Registry] Total registrations (including shell): ${allRegistrations.length}`);

  // Add file system handlers
  allRegistrations.push(...fileSystemHandlers);
  console.log(`[Handler Registry] Total registrations (including file system): ${allRegistrations.length}`);

  // Log image-veo3 handlers specifically for debugging
  const imageVeo3Handlers = allRegistrations.filter((r) => r.channel.includes("image-veo3"));
  if (imageVeo3Handlers.length > 0) {
    console.log(
      `[Handler Registry] Found ${imageVeo3Handlers.length} image-veo3 handlers:`,
      imageVeo3Handlers.map((r) => r.channel)
    );
  } else {
    console.warn(`[Handler Registry] ⚠️ NO image-veo3 handlers found!`);
  }

  // Deduplicate registrations by channel to avoid "second handler" errors
  const uniqueMap = new Map<string, IpcRegistration>();
  for (const reg of allRegistrations) {
    if (!uniqueMap.has(reg.channel)) {
      uniqueMap.set(reg.channel, reg);
    } else {
      console.warn(`Duplicate IPC registration for channel '${reg.channel}' detected — ignoring subsequent registration`);
    }
  }

  const uniqueRegistrations = Array.from(uniqueMap.values());
  console.log(`[Handler Registry] After deduplication: ${uniqueRegistrations.length} unique registrations`);

  // Verify image-veo3 still present after dedup
  const uniqueImageVeo3 = uniqueRegistrations.filter((r) => r.channel.includes("image-veo3"));
  if (uniqueImageVeo3.length > 0) {
    console.log(
      `[Handler Registry] Image-veo3 handlers after dedup:`,
      uniqueImageVeo3.map((r) => r.channel)
    );
  } else {
    console.warn(`[Handler Registry] ⚠️ image-veo3 handlers REMOVED during deduplication!`);
  }

  // Register core ipc handlers via centralized registry
  registerAll(uniqueRegistrations, logger);

  // Register devtools handlers
  registerDevToolsHandlers();

  // master-prompts handlers are provided by the prompt-management module

  console.log("✅ All IPC handlers registered");
}
