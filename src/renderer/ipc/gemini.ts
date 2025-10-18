import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";

interface ChatRequest {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
  stream?: boolean; // Enable streaming (default: false)
  requestId?: string; // Required if stream=true
}

interface ChatResponse {
  success: boolean;
  data?: string;
  error?: string;
  streaming?: boolean;
  channel?: string;
  message?: string;
}

const sendChatMessage = async (req: ChatRequest): Promise<ChatResponse> => {
  if (!hasWindow()) return { success: false, error: "ipc-not-available" };
  if (
    (window as any).electronAPI?.gemini?.chat?.send &&
    typeof (window as any).electronAPI.gemini.chat.send === "function"
  )
    return safeCall(() => (window as any).electronAPI.gemini.chat.send(req));
  if (hasInvoke()) return invoke("gemini:chat:send", req);
  return { success: false, error: "ipc-not-available" };
};

/**
 * Register listener for streaming chat events
 */
const onChatStream = (
  channel: string,
  callback: (data: any) => void
): (() => void) => {
  if (!hasWindow()) return () => {};

  const handler = (data: any) => {
    callback(data);
  };

  // Use electron's ipcRenderer if available
  if ((window as any).electronAPI?.on) {
    (window as any).electronAPI.on(channel, handler);
    // Return unsubscribe function
    return () => {
      if ((window as any).electronAPI?.removeListener) {
        (window as any).electronAPI.removeListener(channel, handler);
      }
    };
  }

  return () => {};
};

export default {
  chat: {
    send: sendChatMessage,
  },
  on: onChatStream,
};
