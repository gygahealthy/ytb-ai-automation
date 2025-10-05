import { Page } from "puppeteer";
import { ChatMessage } from "../chat-automation.service";

export class GeminiAdapter {
  async sendMessage(page: Page, message: string): Promise<void> {
    await page.waitForSelector('rich-textarea .ql-editor', { timeout: 5000 });
    await page.click('rich-textarea .ql-editor');
    await new Promise((r) => setTimeout(r, 500));

    // Clear content safely
    await page.evaluate(() => {
      const editor = document.querySelector('rich-textarea .ql-editor');
      if (editor) {
        try {
          while (editor.firstChild) editor.removeChild(editor.firstChild);
          const p = document.createElement('p');
          const br = document.createElement('br');
          p.appendChild(br);
          editor.appendChild(p);
        } catch (e) {
          (editor as HTMLElement).textContent = '';
        }
      }
    });

    await new Promise((r) => setTimeout(r, 300));

    for (const char of message) {
      await page.type('rich-textarea .ql-editor', char, { delay: 20 });
    }

    await new Promise((r) => setTimeout(r, 1000));
    await page.waitForSelector('button.send-button', { timeout: 5000 });
    await page.click('button.send-button');
  }

  processChunks(chunks: string[]): ChatMessage {
    let fullMessage = "";
    let messageId = "";
    let conversationId = "";

    for (const chunk of chunks) {
      try {
        const data = JSON.parse(chunk);

        if (Array.isArray(data)) {
          for (const item of data) {
            if (Array.isArray(item) && item[0] === "wrb.fr" && item[2]) {
              try {
                const innerData = JSON.parse(item[2]);
                if (Array.isArray(innerData) && innerData[1]) {
                  if (Array.isArray(innerData[1])) {
                    conversationId = innerData[1][0] || "";
                    messageId = innerData[1][1] || "";
                  }
                }

                if (Array.isArray(innerData) && innerData[4]) {
                  const responseArray = innerData[4];
                  if (Array.isArray(responseArray) && responseArray[0]) {
                    const rcData = responseArray[0];
                    if (Array.isArray(rcData) && rcData[1]) {
                      if (Array.isArray(rcData[1]) && rcData[1][0]) {
                        fullMessage = rcData[1][0];
                      }
                    }
                  }
                }
              } catch (innerError) {
                continue;
              }
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

export const geminiAdapter = new GeminiAdapter();
