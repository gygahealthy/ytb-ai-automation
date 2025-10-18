/**
 * Conversation context for multi-turn chat
 */
export interface ConversationContext {
  chatId: string;
  replyId: string;
  rcId: string;
}

/**
 * Chat request options
 */
export interface ChatOptions {
  conversationContext?: ConversationContext | null;
  stream?: boolean;
  dryRun?: boolean;
  timeout?: number;
  model?: string; // Model selection (e.g., "unspecified", "gemini-2.5-pro", "gemini-2.5-flash")
}

/**
 * Chat message
 */
export interface ChatMessage {
  text: string;
  html: string;
  index: number;
}

/**
 * Chat response
 */
export interface ChatResponse {
  success: boolean;
  messages: ChatMessage[];
  fullText: string;
  timestamp: number;
  dryRun?: boolean;
  metadata?: ConversationMetadata;
}

/**
 * Conversation metadata for session continuity
 * Contains IDs needed to continue a conversation
 */
export interface ConversationMetadata {
  cid: string | null; // Chat ID
  rid: string | null; // Reply ID
  rcid: string | null; // Reply Candidate ID
}
