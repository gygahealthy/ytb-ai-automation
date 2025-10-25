import { IpcRegistration } from "../../../../core/ipc/types";
import { sendChatMessage } from "./chat/sendChatMessage";

// Cookie handlers are now managed by common/cookie module
// No need to re-export them here to avoid duplicate registrations

export const chatRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:chat:send",
    description: "Send a message to Gemini chat API",
    handler: async (req: any) => {
      return await sendChatMessage(req);
    },
  },
];

// Note: cookie-rotation handlers have been moved into `src/main/modules/common/cookie-rotation`
