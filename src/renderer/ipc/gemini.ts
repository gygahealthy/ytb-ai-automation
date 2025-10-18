import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";

interface ChatRequest {
  profileId: string;
  prompt: string;
  conversationContext?: {
    chatId: string;
    replyId: string;
    rcId: string;
  };
}

interface ChatResponse {
  success: boolean;
  data?: string;
  error?: string;
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

export default {
  chat: {
    send: sendChatMessage,
  },
};
