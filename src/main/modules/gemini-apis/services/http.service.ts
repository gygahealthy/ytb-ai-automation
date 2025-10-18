/**
 * Consolidated HTTP Service
 * Unified HTTP client for Gemini API requests
 * Handles: token extraction, cookie management, and Gemini API communication
 * Consolidates http-client.ts and http.service.ts functionality
 */

import { request, Agent } from "undici";
import { logger } from "../../../utils/logger-backend.js";
import { config } from "../shared/config/app-config.js";
import type { CookieManagerDB } from "./cookie-manager-db.js";
import { extractTokens, validateToken } from "../helpers/token.helpers.js";
import {
  createGetHeaders,
  createGeminiHeaders,
  getStatusMessage,
} from "../helpers/http.helpers.js";

// Create a shared HTTP/2 agent for connection pooling
const sharedAgent = new Agent({
  allowH2: true,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 120000,
  maxCachedSessions: 5,
});

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  timeoutMs?: number;
  retries?: number;
  stream?: boolean;
}

/**
 * HTTP response structure
 */
export interface HttpResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[]>;
  body: string;
}

/**
 * Consolidated HTTP Service
 * Provides clean API for making HTTP requests to Gemini
 */
export class HttpService {
  private cookieManager: CookieManagerDB;
  private cachedToken: string | null = null;
  private tokenTimestamp: number = 0;
  private readonly TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(cookieManager: CookieManagerDB) {
    this.cookieManager = cookieManager;
  }

  /**
   * Get or extract Gemini API token
   */
  async getToken(forceRefresh: boolean = false): Promise<string> {
    // Check cache
    if (!forceRefresh && this.cachedToken && this.isTokenValid()) {
      logger.debug(
        `✅ Using cached token: ${this.cachedToken.substring(0, 20)}...`
      );
      return this.cachedToken;
    }

    // Extract fresh token
    logger.info("🔄 Extracting fresh token from Gemini page...");
    const tokenData = await extractTokens(this.cookieManager);

    this.cachedToken = tokenData.snlm0e;
    this.tokenTimestamp = tokenData.timestamp;

    if (!validateToken(this.cachedToken)) {
      throw new Error("Extracted token failed validation");
    }

    logger.info(`✅ Token ready: ${this.cachedToken.substring(0, 20)}...`);
    return this.cachedToken;
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.cachedToken) return false;
    const age = Date.now() - this.tokenTimestamp;
    return age < this.TOKEN_TTL;
  }

  /**
   * Build headers for a specific request
   */
  private buildRequestHeaders(
    headers: "get" | "gemini" = "gemini",
    options?: Partial<HttpRequestOptions>
  ): Record<string, string> {
    const baseHeaders =
      headers === "get"
        ? createGetHeaders(this.cookieManager)
        : createGeminiHeaders(this.cookieManager);

    if (options?.headers) {
      Object.assign(baseHeaders, options.headers);
    }

    return baseHeaders;
  }

  /**
   * Send GET request (for token extraction and page fetching)
   */
  async get(
    url: string,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse> {
    const headers = this.buildRequestHeaders("get", options);

    logger.debug(`→ GET ${url}`);

    try {
      const response = await request(url, {
        method: "GET",
        headers,
        dispatcher: sharedAgent,
      });

      const body = await response.body.text();
      const statusMessage = getStatusMessage(response.statusCode);

      logger.debug(
        `← ${response.statusCode} ${statusMessage} (${(
          body.length / 1024
        ).toFixed(2)} KB)`
      );

      if (response.statusCode !== 200) {
        throw new Error(
          `GET request failed: ${response.statusCode} ${statusMessage}`
        );
      }

      const responseHeaders: Record<string, string | string[]> = {};
      if (response.headers) {
        for (const [key, value] of Object.entries(response.headers)) {
          if (value !== undefined) {
            responseHeaders[key] = value;
          }
        }
      }

      return {
        statusCode: response.statusCode,
        statusMessage,
        headers: responseHeaders,
        body,
      };
    } catch (error) {
      logger.error("GET request failed:", error);
      throw error;
    }
  }

  /**
   * Send POST request to Gemini API
   */
  async post(
    token: string,
    fReq: string,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse> {
    if (!validateToken(token)) {
      throw new Error("Invalid token provided to post request");
    }

    const headers = this.buildRequestHeaders("gemini", options);

    const body = new URLSearchParams({
      at: token,
      "f.req": fReq,
    }).toString();

    logger.debug(`→ POST ${config.apiEndpoint}`);
    logger.debug(`  Token: ${token.substring(0, 20)}...`);
    logger.debug(`  f.req: ${fReq.length} chars`);

    const maxRetries = options?.retries || 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await request(config.apiEndpoint, {
          method: "POST",
          headers,
          body,
          dispatcher: sharedAgent,
        });

        const responseBody = await response.body.text();
        const statusMessage = getStatusMessage(response.statusCode);

        logger.debug(
          `← ${response.statusCode} ${statusMessage} (${(
            responseBody.length / 1024
          ).toFixed(2)} KB) [attempt ${attempt}/${maxRetries}]`
        );

        if (response.statusCode === 200) {
          const responseHeaders: Record<string, string | string[]> = {};
          if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
              if (value !== undefined) {
                responseHeaders[key] = value;
              }
            }
          }

          return {
            statusCode: response.statusCode,
            statusMessage,
            headers: responseHeaders,
            body: responseBody,
          };
        }

        // Retry on server errors
        if (response.statusCode >= 500) {
          lastError = new Error(
            `Server error: ${response.statusCode} ${statusMessage}`
          );
          if (attempt < maxRetries) {
            const backoff = Math.pow(2, attempt - 1) * 1000;
            logger.warn(`Retrying in ${backoff}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue;
          }
        }

        throw new Error(
          `POST request failed: ${response.statusCode} ${statusMessage}`
        );
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          break;
        }
        const backoff = Math.pow(2, attempt - 1) * 1000;
        logger.warn(
          `Attempt ${attempt} failed: ${
            (error as Error).message
          }. Retrying in ${backoff}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    logger.error("POST request failed after all retries:", lastError);
    throw lastError || new Error("POST request failed");
  }

  /**
   * Send Gemini API request with automatic token handling
   */
  async sendGeminiRequest(
    fReq: string,
    options?: Partial<HttpRequestOptions>
  ): Promise<HttpResponse> {
    const token = await this.getToken();
    return this.post(token, fReq, options);
  }

  /**
   * Extract first JSON array from streaming response
   * Handles Google's XSSI protection prefix ")]}'
   */
  static extractFirstJsonArray(
    text: string
  ): { text: string; end: number } | null {
    let cleanText = text;

    // Remove Google's XSSI protection prefix if present
    if (text.startsWith(")]}'\n")) {
      cleanText = text.slice(5);
    } else if (text.startsWith(")]}'")) {
      cleanText = text.slice(4);
    }

    const firstBracket = cleanText.indexOf("[");
    if (firstBracket === -1) return null;

    let depth = 0;
    for (let i = firstBracket; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (char === "[") depth++;
      else if (char === "]") depth--;

      if (depth === 0) {
        return {
          text: cleanText.slice(firstBracket, i + 1),
          end: i + 1 + (text.length - cleanText.length),
        };
      }
    }

    return null;
  }

  /**
   * Parse streaming JSON arrays from response body
   */
  static async *parseStreamingJson(
    body: NodeJS.ReadableStream
  ): AsyncGenerator<unknown[], void, unknown> {
    let buffer = "";

    for await (const chunk of body) {
      buffer += chunk.toString();

      while (true) {
        const found = HttpService.extractFirstJsonArray(buffer);
        if (!found) break;

        buffer = buffer.slice(found.end);

        try {
          const parsed = JSON.parse(found.text);
          if (Array.isArray(parsed)) {
            yield parsed;
          }
        } catch (error) {
          logger.warn("Failed to parse JSON chunk:", error);
        }
      }
    }
  }

  /**
   * Clear cached token
   */
  clearToken(): void {
    this.cachedToken = null;
    this.tokenTimestamp = 0;
  }

  /**
   * Close and cleanup resources
   */
  async close(): Promise<void> {
    this.clearToken();
    logger.debug("HTTP service cleanup completed");
  }
}

/**
 * Create HTTP service instance
 */
export function createHttpService(cookieManager: CookieManagerDB): HttpService {
  return new HttpService(cookieManager);
}

/**
 * Singleton instance for shared use
 */
let serviceInstance: HttpService | null = null;

/**
 * Get or create singleton HTTP service instance
 */
export function getHttpService(cookieManager?: CookieManagerDB): HttpService {
  if (!serviceInstance && cookieManager) {
    serviceInstance = createHttpService(cookieManager);
  }

  if (!serviceInstance) {
    throw new Error(
      "HTTP service not initialized. Call getHttpService(cookieManager) first."
    );
  }

  return serviceInstance;
}
