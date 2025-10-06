import { CDPSession } from "puppeteer";
import { ChatMessage } from "../chat-automation.service";
import { chatGPTAdapter } from "./chatgpt.adapter";
import { BrowserWindow } from "electron";

export async function attachChatGPTCDP(
  client: CDPSession,
  sessionId: string,
  messageChunks: Map<string, string[]>,
  messageResolvers: Map<string, (msg: ChatMessage) => void>
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestUrlMap: Map<string, string> = new Map();

    client.on("Network.requestWillBeSent", (reqParams: any) => {
      try {
        if (reqParams && reqParams.requestId && reqParams.request && reqParams.request.url) {
          requestUrlMap.set(reqParams.requestId, reqParams.request.url as string);
        }
      } catch (e) {}
    });

    client.on("Network.dataReceived", async (params: any) => {
      try {
        const response = await client.send("Network.getResponseBody", {
          requestId: params.requestId,
        });

        if (response.body) {
          const chunks = messageChunks.get(sessionId) || [];
          const messages = response.body.split("\n").filter((line: string) => line.trim());

          for (const message of messages) {
            if (message.startsWith("data: ")) {
              const data = message.slice(6);
              chunks.push(data);

              // Emit partial
              try {
                const partial = chatGPTAdapter.processChunks(chunks).content;
                const win = BrowserWindow.getAllWindows()[0];
                if (win) win.webContents.send("chatAutomation:stream", { sessionId, provider: "chatgpt", partial });
              } catch (e) {}

              if (data.includes("[DONE]")) {
                const result = chatGPTAdapter.processChunks(chunks);
                // Content is already clean markdown - no formatting needed
                const resolver = messageResolvers.get(sessionId);
                if (resolver) {
                  resolver(result);
                  messageResolvers.delete(sessionId);
                }
                messageChunks.set(sessionId, []);
              }
            }
          }

          messageChunks.set(sessionId, chunks);
        }
      } catch (e) {
        // ignore
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
