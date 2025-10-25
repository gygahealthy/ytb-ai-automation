import { ipcMain } from "electron";
import { IpcRegistration } from "../../../core/ipc/types";
import { chatRegistrations } from "./handlers/registrations";

// Export IPC registrations for module-loader to collect
// Cookie registrations are now handled by common/cookie module
export { chatRegistrations } from "./handlers/registrations";

// Export combined registrations array (only chat now, cookies handled elsewhere)
export const registrations: IpcRegistration[] = [...chatRegistrations];

// Export services
export { ChatService } from "./services/chat.service";
export { CookieService } from "../common/cookie/services/cookie.service";
export { cookieService } from "../common/cookie/services/cookie.service";
export {
  getOrCreateCookieManager,
  getOrCreateChatService,
  resetChatService,
  resetCookieManager,
  clearAll,
  getStats,
} from "./services/chat.registry";
export type { Cookie } from "../common/cookie/types/cookies.types";
export type { ChatResponse, ChatMessage, ConversationContext } from "./types/gemini-chat.types";

// Export helpers
export {
  buildChatPayload,
  createConversationContext,
  createEmptyMetadata,
  extractConversationContext,
  htmlToText,
  extractMessages,
  extractMetadata,
  sendChatRequest,
} from "./helpers/chat.helpers";
export {
  parseCookieHeader,
  cookiesToHeader,
  extractCookies,
  validateRequiredCookies,
  mergeCookies,
} from "../common/cookie/helpers/cookie-parser.helpers";
export {
  rotate1psidts,
  startAutoRotation,
  type RotationControl,
} from "../common/cookie-rotation/helpers/cookie-rotation.helpers";
export {
  createHttpCommonHeaders,
  createGeminiHeaders,
  createGetHeaders,
  normalizeHeaders,
  getHeader,
  getStatusMessage,
} from "./helpers/http.helpers";
export { extractTokens, validateToken, type TokenData } from "../common/cookie/helpers/token.helpers";

export function registerModule(registrar?: (regs: IpcRegistration[]) => void): void {
  // Only register chat handlers here; cookie handlers are registered by common/cookie module
  const allRegistrations = [...chatRegistrations];

  if (registrar) {
    registrar(allRegistrations);
    return;
  }

  // Register handlers directly when called without a registrar (fallback)
  for (const reg of allRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }

  console.log("✅ Gemini APIs module registered (src/main/modules/gemini-apis/index.ts)");
}
