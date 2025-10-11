import { Logger } from "../../../../shared/utils/logger";

const logger = new Logger("VEO3ApiClient");

/**
 * VEO3 API Client
 * Handles HTTP requests to Google Labs VEO3 API with proper authentication
 */
export class VEO3ApiClient {
  private readonly baseUrl = "https://labs.google/fx/api/trpc";
  
  /**
   * Build request headers that mimic a real browser
   */
  private buildHeaders(cookie: string): HeadersInit {
    return {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      "origin": "https://labs.google",
      "referer": "https://labs.google/fx/tools/flow",
      "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      "cookie": cookie,
    };
  }

  /**
   * List user projects from VEO3
   * @param cookie - Authentication cookie string from profile
   * @param pageSize - Number of projects per page (default: 20)
   * @param cursor - Pagination cursor (null for first page)
   */
  async listProjects(
    cookie: string,
    pageSize: number = 20,
    cursor: string | null = null
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Build the input parameter
      const inputParam = {
        json: {
          pageSize,
          toolName: "PINHOLE",
          cursor,
        },
        meta: {
          values: {
            cursor: ["undefined"],
          },
        },
      };

      // URL encode the input parameter
      const encodedInput = encodeURIComponent(JSON.stringify(inputParam));
      const url = `${this.baseUrl}/project.searchUserProjects?input=${encodedInput}`;

      logger.info(`Fetching VEO3 projects (pageSize: ${pageSize}, cursor: ${cursor})`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...this.buildHeaders(cookie),
          "cache-control": "no-cache",
          "pragma": "no-cache",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to list projects: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      logger.info(`Successfully fetched ${data?.result?.data?.json?.projects?.length || 0} projects`);
      
      return {
        success: true,
        data: data?.result?.data?.json || data,
      };
    } catch (error) {
      logger.error("Error listing projects", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Create a new VEO3 project
   * @param cookie - Authentication cookie string from profile
   * @param projectTitle - Title for the new project
   * @param toolName - Tool name (default: "PINHOLE")
   */
  async createProject(
    cookie: string,
    projectTitle: string,
    toolName: string = "PINHOLE"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.baseUrl}/project.createProject`;

      const payload = {
        json: {
          projectTitle,
          toolName,
        },
      };

      logger.info(`Creating VEO3 project: "${projectTitle}"`);

      const response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(cookie),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Failed to create project: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      logger.info(`Successfully created project: ${data?.result?.data?.json?.projectId || "unknown"}`);
      
      return {
        success: true,
        data: data?.result?.data?.json || data,
      };
    } catch (error) {
      logger.error("Error creating project", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Validate cookie by attempting to list projects
   * Returns true if cookie is valid and not expired
   */
  async validateCookie(cookie: string): Promise<boolean> {
    try {
      const result = await this.listProjects(cookie, 1);
      return result.success;
    } catch (error) {
      logger.error("Error validating cookie", error);
      return false;
    }
  }
}

export const veo3ApiClient = new VEO3ApiClient();

