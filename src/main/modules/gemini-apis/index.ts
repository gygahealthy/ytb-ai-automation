import { ipcMain } from "electron";
import { IpcRegistration } from "../../../core/ipc/types";
import {
  cookieRegistrations,
  chatRegistrations,
} from "./handlers/registrations";

// Export IPC registrations
export {
  cookieRegistrations,
  chatRegistrations,
} from "./handlers/registrations";

// Export services
export { ChatService } from "./services/chat.service";
export { CookieService } from "./services/cookie.service";
export { cookieService } from "./services/cookie.service";
export {
  getOrCreateCookieManager,
  getOrCreateChatService,
  resetChatService,
  resetCookieManager,
  clearAll,
  getStats,
} from "./services/chat.registry";
export type { Cookie } from "./types/cookies.types";
export type {
  ChatResponse,
  ChatMessage,
  ConversationContext,
} from "./types/gemini-chat.types";

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
} from "./helpers/cookie-parser.helpers";
export {
  refreshCreds,
  rotate1psidts,
  startAutoRotation,
  type RotationControl,
} from "./helpers/cookie-rotation.helpers";
export {
  createHttpCommonHeaders,
  createGeminiHeaders,
  createGetHeaders,
  normalizeHeaders,
  getHeader,
  getStatusMessage,
} from "./helpers/http.helpers";
export {
  extractTokens,
  validateToken,
  type TokenData,
} from "./helpers/token.helpers";

export function registerModule(
  registrar?: (regs: IpcRegistration[]) => void
): void {
  const allRegistrations = [...cookieRegistrations, ...chatRegistrations];

  if (registrar) {
    registrar(allRegistrations);
    return;
  }

  for (const reg of allRegistrations) {
    ipcMain.handle(reg.channel, async (_event, ...args) => {
      const req = args.length <= 1 ? args[0] : args;
      return await reg.handler(req as any);
    });
  }
}
