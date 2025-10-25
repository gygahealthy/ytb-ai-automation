import { IpcRegistration } from "../../../../core/ipc/types";
import { sendChatMessage } from "./chat/sendChatMessage";
import { cookieRegistrations } from "../../common/cookie/handlers/registrations";

// cookie-rotation handlers moved to separate module: src/main/modules/cookie-rotation
// cookie handlers now managed by common/cookie module

export { cookieRegistrations };

export const chatRegistrations: IpcRegistration[] = [
  {
    channel: "gemini:chat:send",
    description: "Send a message to Gemini chat API",
    handler: async (req: any) => {
      return await sendChatMessage(req);
    },
  },
];

// cookie-rotation handlers have been moved into `src/main/modules/cookie-rotation`
