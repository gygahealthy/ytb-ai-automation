import { Logger } from "../../../../../../shared/utils/logger";

const logger = new Logger("VEO3AuthApiClient");

/**
 * VEO3 Authentication API Client
 * Handles authentication and token extraction for Google Labs VEO3
 */
export class VEO3AuthApiClient {
  /**
   * Extract Bearer token from Flow page HTML
   * Fetches https://labs.google/fx/tools/flow and parses __NEXT_DATA__ script tag
   * @param cookie - Authentication cookie string from profile
   */
  async extractBearerToken(cookie: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const flowUrl = "https://labs.google/fx/tools/flow";
      logger.info(`Fetching Flow page to extract Bearer token from: ${flowUrl}`);

      const response = await fetch(flowUrl, {
        method: "GET",
        headers: {
          accept: "text/html",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "upgrade-insecure-requests": "1",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
          cookie,
        },
      });

      if (!response.ok) {
        logger.error(`Failed to fetch Flow page: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const html = await response.text();
      logger.info(`Received HTML page (${html.length} bytes)`);

      // Extract __NEXT_DATA__ script tag content
      const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!scriptMatch) {
        logger.error("Could not find __NEXT_DATA__ script tag in HTML");
        return { success: false, error: "__NEXT_DATA__ script tag not found" };
      }

      const jsonData = JSON.parse(scriptMatch[1]);
      const accessToken = jsonData?.props?.pageProps?.session?.access_token;

      if (!accessToken) {
        logger.error("access_token not found in __NEXT_DATA__");
        return { success: false, error: "access_token not found in session data" };
      }

      logger.info(`Successfully extracted Bearer token (${accessToken.substring(0, 20)}...)`);
      return { success: true, token: accessToken };
    } catch (error) {
      logger.error("Error extracting Bearer token", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Validate cookie by attempting a simple authenticated request
   * @param cookie - Cookie to validate
   * @param validationFn - Function that makes an authenticated request (e.g., list projects)
   */
  async validateCookie(cookie: string, validationFn: (cookie: string) => Promise<boolean>): Promise<boolean> {
    try {
      return await validationFn(cookie);
    } catch (error) {
      logger.error("Error validating cookie", error);
      return false;
    }
  }
}

export const veo3AuthApiClient = new VEO3AuthApiClient();
