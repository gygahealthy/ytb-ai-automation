/**
 * Chat Module Types
 */

import type { Gem } from "./gem.types.js";

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
  gem?: Gem | string; // Gem object or gem ID for system prompt
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

/**
 * Image metadata from generation
 */
export interface ImageMetadata {
  filename: string;
  mimeType: string;
  timestamp: number;
  size: number;
  width: number;
  height: number;
}

/**
 * Generated image from image generation response
 */
export interface GeneratedImage {
  index: number;
  url: string;
  filename: string;
  metadata: ImageMetadata;
}

/**
 * Image generation context (same as conversation context)
 */
export type ImageGenerationContext = ConversationContext;

/**
 * Image generation request options
 */
export interface ImageGenerationOptions {
  conversationContext?: ConversationContext | null;
  stream?: boolean;
  dryRun?: boolean;
  timeout?: number;
  gem?: Gem | string; // Gem object or gem ID for system prompt
  modelId?: string; // Model identifier, defaults to Gemini 2.5 Pro
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  success: boolean;
  images: GeneratedImage[];
  status: string; // "completed", "generating", "error", "dry_run"
  timestamp: number;
  dryRun?: boolean;
  metadata?: ConversationMetadata;
}
