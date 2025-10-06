import { Page } from "puppeteer";
import { ChatMessage } from "../chat-automation.service";

export class ChatGPTAdapter {
  async sendMessage(page: Page, message: string): Promise<void> {
    await page.waitForSelector("#prompt-textarea", { timeout: 5000 });
    await page.click("#prompt-textarea");
    await new Promise((r) => setTimeout(r, 500));

    await page.evaluate(() => {
      const editor = document.querySelector("#prompt-textarea");
      if (editor) {
        try {
          while (editor.firstChild) {
            editor.removeChild(editor.firstChild);
          }
        } catch (e) {
          (editor as HTMLElement).textContent = "";
        }
      }
    });

    await new Promise((r) => setTimeout(r, 300));

    for (const char of message) {
      await page.type("#prompt-textarea", char, { delay: 20 });
    }

    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector('[data-testid="send-button"]');
    await page.click('[data-testid="send-button"]');
  }

  processChunks(chunks: string[]): ChatMessage {
    let fullMessage = "";
    let messageId = "";
    let conversationId = "";

    for (const chunk of chunks) {
      try {
        const data = JSON.parse(chunk);

        if (data.v?.message?.id) {
          messageId = data.v.message.id;
          conversationId = data.v.conversation_id;
        }

        if (data.v) {
          if (typeof data.v === "string") {
            fullMessage += data.v;
          } else if (data.v.message?.content?.parts?.[0]) {
            fullMessage = data.v.message.content.parts[0];
          }
        }

        // Handle patches
        if (data.o === "patch") {
          for (const patch of data.v) {
            if (patch.o === "append" && patch.p === "/message/content/parts/0") {
              fullMessage += patch.v;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    return {
      messageId,
      conversationId,
      content: fullMessage,
      timestamp: new Date(),
    };
  }
}

export const chatGPTAdapter = new ChatGPTAdapter();
