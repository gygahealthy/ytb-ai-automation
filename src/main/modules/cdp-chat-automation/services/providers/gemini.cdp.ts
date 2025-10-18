import { CDPSession } from "puppeteer";
import { ChatMessage } from "../chat-automation.service";
import { geminiAdapter } from "./gemini.adapter";
import { BrowserWindow } from "electron";

export async function attachGeminiCDP(
  client: CDPSession,
  sessionId: string,
  messageChunks: Map<string, string[]>,
  messageResolvers: Map<string, (msg: ChatMessage) => void>,
  requestUrlMap: Map<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    client.on("Network.dataReceived", async (params: any) => {
      try {
        const url = requestUrlMap.get(params.requestId) || "";
        if (!url.includes("StreamGenerate") && !url.includes("BardFrontendService")) return;

        const response = await client.send("Network.getResponseBody", { requestId: params.requestId });
        if (!response.body) return;

        const chunks = messageChunks.get(sessionId) || [];
        const lines = response.body.split("\n").filter((line: string) => line.trim());

        for (const line of lines) {
          if (/^\d+$/.test(line) || line === ")]}'" || line === "'" || line === "]") continue;
          chunks.push(line);
        }

        // Emit partial
        try {
          const partial = geminiAdapter.processChunks(chunks).content;
          const win = BrowserWindow.getAllWindows()[0];
          if (win) win.webContents.send("chatAutomation:stream", { sessionId, provider: "gemini", partial });
        } catch (e) {}

        if (response.body.includes('"af.httprm"') || response.body.includes('"e",31')) {
          const result = geminiAdapter.processChunks(chunks);
          // Content is already clean markdown - no formatting needed
          const resolver = messageResolvers.get(sessionId);
          if (resolver) {
            resolver(result);
            messageResolvers.delete(sessionId);
          }
          messageChunks.set(sessionId, []);
        }

        messageChunks.set(sessionId, chunks);
      } catch (e) {}
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
