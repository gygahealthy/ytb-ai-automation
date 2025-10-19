/**
 * Gemini Chat Mode Constants
 *
 * Use these constants when calling chat handlers to select behavior.
 * Values are intentionally capitalized friendly names related to Gemini chat.
 */

// Ephemeral / stateless mode: no conversation metadata preserved between requests
// --> Create new conversation each time
export const GEMINI_CHAT_NORMAL_MODE_EPHEMERAL = "EPHEMERAL";

// Persistent mode: conversation metadata is preserved per-profile (multi-turn)
export const GEMINI_CHAT_NORMAL_MODE_PERSISTENT = "PERSISTENT";

// Temporary mode: leaves no history in Gemini (temporary chat)
export const GEMINI_CHAT_TEMPORARY_MODE = "TEMPORARY";

export type GeminiChatMode =
  | typeof GEMINI_CHAT_NORMAL_MODE_EPHEMERAL
  | typeof GEMINI_CHAT_NORMAL_MODE_PERSISTENT
  | typeof GEMINI_CHAT_TEMPORARY_MODE;
