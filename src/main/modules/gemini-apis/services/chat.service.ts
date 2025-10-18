/**
 * Chat Service
 * Handles chat requests to Gemini API using shared services
 */

import type {
  ChatOptions,
  ChatResponse,
  ConversationMetadata,
} from "../types/gemini-chat.types.js";
import { CookieManagerDB } from "./cookie-manager-db.js";
import {
  sendChatRequest,
  createEmptyMetadata,
  extractConversationContext,
} from "../helpers/chat.helpers.js";

/**
 * ChatService class for managing Gemini API chat operations
 * Handles both single-turn and multi-turn conversations
 */
export class ChatService {
  private metadata: ConversationMetadata;
  private lastResponse: ChatResponse | null = null;

  constructor(private cookieManager: CookieManagerDB) {
    // Initialize with empty state
    this.metadata = createEmptyMetadata();
  }

  /**
   * Send a chat request
   * @param prompt - The prompt to send
   * @param options - Optional chat options
   * @returns The chat response
   */
  async sendMessage(
    prompt: string,
    options: Omit<ChatOptions, "conversationContext"> = {}
  ): Promise<ChatResponse> {
    // Extract conversation context from metadata if available
    const conversationContext = extractConversationContext(this.metadata);

    // Send the request
    const response = await sendChatRequest(this.cookieManager, prompt, {
      ...options,
      conversationContext,
    });

    // Update session state
    this.lastResponse = response;

    // Update metadata from response if available
    if (response.metadata) {
      this.metadata = response.metadata;
    }

    return response;
  }

  /**
   * Send a message without updating session metadata
   * Useful for one-off requests
   */
  async sendRequestOnce(
    prompt: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    return sendChatRequest(this.cookieManager, prompt, options);
  }

  /**
   * Get current conversation metadata
   * Can be saved and used to restore the session later
   */
  getMetadata(): ConversationMetadata {
    return { ...this.metadata };
  }

  /**
   * Load a previous conversation metadata to continue a session
   */
  loadMetadata(metadata: ConversationMetadata): void {
    this.metadata = { ...metadata };
  }

  /**
   * Get the last response in this session
   */
  getLastResponse(): ChatResponse | null {
    return this.lastResponse;
  }

  /**
   * Clear the session and start a new conversation
   */
  reset(): void {
    this.metadata = createEmptyMetadata();
    this.lastResponse = null;
  }
}
