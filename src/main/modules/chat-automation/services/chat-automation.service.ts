import { Browser, Page, CDPSession } from "puppeteer";
import { profileService } from "../../profile-management/services/profile.service";
import { browserManager } from "../../instance-management/services/browser-manager";
import { Logger } from "../../../../utils/logger.util";
import { ApiResponse } from "../../../../types";
import { StringUtil } from "../../../../utils/string.util";
import { attachChatGPTCDP } from "./providers/chatgpt.cdp";
import { attachGeminiCDP } from "./providers/gemini.cdp";

const logger = new Logger("ChatAutomationService");

export interface ChatSession {
  id: string;
  profileId: string;
  provider: "chatgpt" | "gemini";
  browser: Browser;
  page: Page;
  cdpSession: CDPSession;
  debugPort: number;
  status: "active" | "closed";
  createdAt: Date;
}

export interface ChatMessage {
  messageId?: string;
  conversationId?: string;
  content: string;
  timestamp: Date;
}

/**
 * Chat Automation Service
 * Handles ChatGPT and Gemini automation with CDP monitoring
 */
export class ChatAutomationService {
  private activeSessions: Map<string, ChatSession> = new Map();
  private messageChunks: Map<string, string[]> = new Map();
  private messageResolvers: Map<string, (msg: ChatMessage) => void> = new Map();

  /**
   * Initialize a chat automation session
   */
  async initSession(
    profileId: string,
    provider: "chatgpt" | "gemini"
  ): Promise<ApiResponse<{ sessionId: string; debugPort: number }>> {
    try {
      const sessionId = StringUtil.generateId("chat-session");
      logger.info(`Initializing chat session ${sessionId} for profile ${profileId} with provider ${provider}`);

      // Get profile
      const profileResponse = await profileService.getProfileById(profileId);
      if (!profileResponse.success || !profileResponse.data) {
        return { success: false, error: "Profile not found" };
      }

      const profile = profileResponse.data;

      // Launch browser with debugging
      const browserResult = await browserManager.launchBrowserWithDebugging(profile);
      if (!browserResult.success || !browserResult.browser) {
        return { success: false, error: browserResult.error || "Failed to launch browser" };
      }

      const { browser, debugPort } = browserResult;

      // Get or create page
      const pages = await browser.pages();
      let page: Page;

      if (pages.length > 0) {
        page = pages[0];
        logger.info("Using existing browser page");
      } else {
        page = await browser.newPage();
        logger.info("Created new browser page");
      }

      // Navigate to chat provider URL
      const targetUrl = provider === "chatgpt" ? "https://chat.openai.com" : "https://gemini.google.com/app";

      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      logger.info(`Navigated to ${targetUrl}`);

      // Setup CDP monitoring
      const cdpSetup = await this.setupCDPMonitoring(page, sessionId, provider);
      if (!cdpSetup.success || !cdpSetup.cdpSession) {
        await browser.disconnect();
        return { success: false, error: cdpSetup.error || "Failed to setup CDP monitoring" };
      }

      // Store session
      const session: ChatSession = {
        id: sessionId,
        profileId,
        provider,
        browser,
        page,
        cdpSession: cdpSetup.cdpSession,
        debugPort: debugPort!,
        status: "active",
        createdAt: new Date(),
      };

  this.activeSessions.set(sessionId, session);
  // If the browser manager returned the spawned process, register it so we can kill it on close
  // @ts-ignore - some implementations include `process` in the return object
  const spawnedProcess = (browserResult as any).process as any;
  browserManager.registerBrowser(sessionId, browser, debugPort!, spawnedProcess);

      logger.info(`Chat session ${sessionId} initialized successfully`);

      return {
        success: true,
        data: {
          sessionId,
          debugPort: debugPort!,
        },
      };
    } catch (error) {
      logger.error("Failed to initialize chat session", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send a message in the chat session
   */
  async sendMessage(sessionId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }

      logger.info(`Sending message in session ${sessionId}`);

      // Provider-specific message sending
      if (session.provider === "chatgpt") {
        await this.sendChatGPTMessage(session.page, message);
      } else {
        await this.sendGeminiMessage(session.page, message);
      }

      // Wait for response with timeout
      const response = await Promise.race([
        this.waitForMessage(sessionId),
        new Promise<ChatMessage>((_, reject) =>
          setTimeout(() => reject(new Error("Response timeout after 60s")), 60000)
        ),
      ]);

      logger.info(`Received response in session ${sessionId}`);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      logger.error(`Failed to send message in session ${sessionId}`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Close a chat session
   */
  async closeSession(sessionId: string): Promise<ApiResponse<boolean>> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }

      await session.cdpSession.detach();
      await browserManager.closeBrowser(sessionId);

      session.status = "closed";
      this.activeSessions.delete(sessionId);
      this.messageChunks.delete(sessionId);
      this.messageResolvers.delete(sessionId);

      logger.info(`Chat session ${sessionId} closed`);

      return { success: true, data: true };
    } catch (error) {
      logger.error(`Failed to close session ${sessionId}`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Setup CDP session for monitoring network requests
   */
  private async setupCDPMonitoring(
    page: Page,
    sessionId: string,
    provider: "chatgpt" | "gemini"
  ): Promise<{ success: boolean; cdpSession?: CDPSession; error?: string }> {
    try {
      const client = await page.target().createCDPSession();
      await client.send("Network.enable");
      await client.send("Page.enable");
      await client.send("Runtime.enable");

      // Initialize message storage for this session
      this.messageChunks.set(sessionId, []);

      // Map to keep track of requestId -> url so we can filter relevant requests
      const requestUrlMap: Map<string, string> = new Map();

      // Capture requests as they are sent so we can later match dataReceived events to URLs
      client.on("Network.requestWillBeSent", (reqParams: any) => {
        try {
          if (reqParams && reqParams.requestId && reqParams.request && reqParams.request.url) {
            requestUrlMap.set(reqParams.requestId, reqParams.request.url as string);
          }
        } catch (e) {
          // ignore
        }
      });

      // Attach provider-specific CDP handlers
      if (provider === "chatgpt") {
        const attached = await attachChatGPTCDP(client, sessionId, this.messageChunks, this.messageResolvers);
        if (!attached.success) {
          return { success: false, error: attached.error };
        }
      } else if (provider === "gemini") {
        const attached = await attachGeminiCDP(client, sessionId, this.messageChunks, this.messageResolvers, requestUrlMap);
        if (!attached.success) {
          return { success: false, error: attached.error };
        }
      }

      logger.info(`CDP monitoring setup for session ${sessionId}`);

      return {
        success: true,
        cdpSession: client,
      };
    } catch (error) {
      logger.error("Failed to setup CDP monitoring", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Send message to ChatGPT
   */
  private async sendChatGPTMessage(page: Page, message: string): Promise<void> {
    await page.waitForSelector("#prompt-textarea", { timeout: 5000 });
    await page.click("#prompt-textarea");
  await this.safeWait(500);

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

  await this.safeWait(300);

    for (const char of message) {
      await page.type("#prompt-textarea", char, { delay: 20 });
    }

  await this.safeWait(1000);
    await page.waitForSelector('[data-testid="send-button"]');
    await page.click('[data-testid="send-button"]');

    logger.info("ChatGPT message sent");
  }

  /**
   * Send message to Gemini
   */
  private async sendGeminiMessage(page: Page, message: string): Promise<void> {
    // Wait for the rich-textarea element
    await page.waitForSelector('rich-textarea .ql-editor', { timeout: 5000 });
    
    // Click on the editor to focus
    await page.click('rich-textarea .ql-editor');
  await this.safeWait(500);

    // Clear any existing content using safe DOM methods (avoid innerHTML assignment)
    await page.evaluate(() => {
      const editor = document.querySelector('rich-textarea .ql-editor');
      if (editor) {
        // If editor is contentEditable, clear its text nodes safely
        try {
          // Remove all child nodes
          while (editor.firstChild) {
            editor.removeChild(editor.firstChild);
          }

          // Create an empty paragraph to preserve editor structure
          const p = document.createElement('p');
          const br = document.createElement('br');
          p.appendChild(br);
          editor.appendChild(p);
        } catch (e) {
          // Fallback: set textContent
          (editor as HTMLElement).textContent = '';
        }
      }
    });

  await this.safeWait(300);

    // Type the message character by character
    for (const char of message) {
      await page.type('rich-textarea .ql-editor', char, { delay: 20 });
    }

  await this.safeWait(1000);

    // Wait for send button to appear and click it
    await page.waitForSelector('button.send-button', { timeout: 5000 });
    await page.click('button.send-button');

    logger.info("Gemini message sent");
  }



  /**
   * Wait for message response
   */
  private waitForMessage(sessionId: string): Promise<ChatMessage> {
    return new Promise((resolve) => {
      this.messageResolvers.set(sessionId, resolve);
    });
  }

  /**
   * Safe wait utility
   */
  private async safeWait(timeout: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }

  /**
   * Get active sessions (for debugging/monitoring)
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Find an active session by profileId
   * Returns session info if found (sessionId and debugPort), otherwise undefined
   */
  getSessionByProfileId(profileId: string): { sessionId: string; debugPort: number; status: string } | undefined {
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.profileId === profileId && session.status === 'active') {
        return { sessionId: id, debugPort: session.debugPort, status: session.status };
      }
    }
    return undefined;
  }
}

export const chatAutomationService = new ChatAutomationService();
