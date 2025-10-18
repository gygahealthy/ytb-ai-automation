/**
 * Token and response type definitions
 */

/**
 * Extracted token data
 */
export interface TokenData {
  snlm0e: string;
  originalSnlm0e: string;
  htmlSaved: boolean;
  timestamp: number;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  message: string;
  conversationId?: string;
  responseId?: string;
  choiceId?: string;
  token: string;
}

// Extended request for IPC between renderer and main for Gemini chat
export interface GeminiChatRequest {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  stream?: boolean;
  requestId?: string;
  mode?: string; // EPHEMERAL | PERSISTENT | TEMPORARY (string for flexibility)
  model?: string; // unspecified | gemini-2.5-pro | gemini-2.5-flash | etc
  resetContext?: boolean;
}

/**
 * Chat response data
 */
export interface ChatResponse {
  text: string;
  conversationId: string;
  responseId: string;
  choices: string[];
  images?: ImageData[];
  raw?: unknown;
}
