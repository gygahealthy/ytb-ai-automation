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
