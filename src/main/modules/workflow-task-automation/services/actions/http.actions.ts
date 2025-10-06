import { Page } from "puppeteer";
import { Logger } from "../../../../../utils/logger.util";
import { AutomationAction } from "../../auto.types";

const logger = new Logger("HttpActions");

/**
 * Execute HTTP request actions
 */
export class HttpActions {
  /**
   * Make an HTTP request from the browser context
   */
  async httpRequest(page: Page, action: AutomationAction): Promise<void> {
    const method = action.httpMethod || "GET";
    const url = action.url;
    const headers = action.headers || {};
    const body = action.body;

    if (!url) {
      throw new Error("URL is required for HTTP request action");
    }

    logger.info(`Making ${method} request to ${url}`);

    // Execute the HTTP request in the page context
    const response = await page.evaluate(
      async (requestConfig) => {
        const { method, url, headers, body } = requestConfig;

        const fetchOptions: RequestInit = {
          method,
          headers,
        };

        if (body && method !== "GET") {
          fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);

          // Set content-type if not already set
          if (!headers["Content-Type"] && !headers["content-type"]) {
            (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
          }
        }

        try {
          const response = await fetch(url, fetchOptions);
          const responseText = await response.text();

          // Manually build headers object since Headers.entries() may not be available
          const headersObj: Record<string, string> = {};
          response.headers.forEach((value: string, key: string) => {
            headersObj[key] = value;
          });

          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: headersObj,
            body: responseText,
          };
        } catch (error) {
          throw new Error(`Fetch failed: ${error}`);
        }
      },
      { method, url, headers, body }
    );

    logger.info(`HTTP ${method} ${url} - Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }
  }
}
