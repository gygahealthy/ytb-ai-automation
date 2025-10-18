export interface ChatMessage {
  id: number | string;
  from: 'user' | 'bot' | 'system';
  text: string;
  ts?: string; // ISO or display
  messageId?: string; // provider message id
  conversationId?: string;
}
