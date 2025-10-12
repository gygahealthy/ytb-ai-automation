import { randomBytes } from "crypto";
import { Logger } from "../../../../shared/utils/logger";

const logger = new Logger("VEO3ApiClient");

/**
 * VEO3 API Client
 * Handles HTTP requests to Google Labs VEO3 API with proper authentication
 */
export class VEO3ApiClient {
  private readonly baseUrl = "https://labs.google/fx/api/trpc";
  private readonly googleApiUrl = "https://aisandbox-pa.googleapis.com/v1";

  /**
   * Build request headers that mimic a real browser
   */
  private buildHeaders(cookie: string): HeadersInit {
    return {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      origin: "https://labs.google",
      referer: "https://labs.google/fx/tools/flow",
      "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      cookie: cookie,
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
      logger.info(`VEO3 endpoint: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...this.buildHeaders(cookie),
          "cache-control": "no-cache",
          pragma: "no-cache",
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

      // Read raw response text for debugging and parsing
      const rawText = await response.text();
      logger.info(`VEO3 raw response (truncated 2000 chars): ${rawText.slice(0, 2000)}`);

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse VEO3 response JSON", parseErr);
      }

      // Normalize project list from various nested response shapes.
      // Known shapes include:
      // 1) data.result.data.json.result.projects
      // 2) data.result.data.json.projects
      // 3) data.result.data.json (already a projects array or object)
      let projects: any[] = [];
      try {
        if (data && data.result && data.result.data && data.result.data.json) {
          const jsonPart = data.result.data.json;
          if (jsonPart.result && Array.isArray(jsonPart.result.projects)) {
            projects = jsonPart.result.projects;
          } else if (Array.isArray(jsonPart.projects)) {
            projects = jsonPart.projects;
          } else if (Array.isArray(jsonPart)) {
            projects = jsonPart;
          }
        }
      } catch (err) {
        logger.error("Error normalizing projects response", err);
      }

      logger.info(`Successfully fetched ${projects.length} projects`);

      return {
        success: true,
        data: {
          projects,
          raw: data,
          rawText,
          endpoint: url,
        },
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
      logger.info(`VEO3 endpoint: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(cookie),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`VEO3 create raw response (truncated 2000 chars): ${rawText.slice(0, 2000)}`);

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse VEO3 create response JSON", parseErr);
      }

      if (!response.ok) {
        logger.error(`Failed to create project: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      logger.info(`Successfully created project: ${data?.result?.data?.json?.projectId || "unknown"}`);

      return {
        success: true,
        data: {
          result: data?.result?.data?.json || data,
          rawText,
          endpoint: url,
        },
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
   * Generate a random seed number for video generation (0 to 2^16)
   */
  private generateSeed(): number {
    return randomBytes(2).readUInt16BE(0);
  }

  /**
   * Generate UUID v4 for scene ID
   */
  private generateSceneId(): string {
    // Generate UUID v4 manually using crypto.randomBytes
    const bytes = randomBytes(16);
    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    // Format as UUID string
    const hex = bytes.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  /**
   * Build headers for Google AI Sandbox API requests
   */
  private buildGoogleApiHeaders(bearerToken: string): HeadersInit {
    return {
      accept: "*/*",
      "accept-language": "en,en-US;q=0.9",
      authorization: `Bearer ${bearerToken}`,
      "cache-control": "no-cache",
      "content-type": "text/plain;charset=UTF-8",
      origin: "https://labs.google",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://labs.google/",
      "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      "x-browser-channel": "stable",
      "x-browser-copyright": "Copyright 2025 Google LLC. All rights reserved.",
      "x-browser-year": "2025",
    };
  }

  /**
   * Generate video from text prompt using VEO3 API
   * @param bearerToken - OAuth Bearer token extracted from Flow page
   * @param projectId - Flow project ID
   * @param prompt - Text prompt for video generation
   * @param aspectRatio - Video aspect ratio (default: LANDSCAPE)
   */
  async generateVideo(
    bearerToken: string,
    projectId: string,
    prompt: string,
    aspectRatio:
      | "VIDEO_ASPECT_RATIO_LANDSCAPE"
      | "VIDEO_ASPECT_RATIO_PORTRAIT"
      | "VIDEO_ASPECT_RATIO_SQUARE" = "VIDEO_ASPECT_RATIO_LANDSCAPE"
  ): Promise<{ success: boolean; data?: any; sceneId?: string; seed?: number; error?: string }> {
    try {
      const seed = this.generateSeed();
      const sceneId = this.generateSceneId();
      const url = `${this.googleApiUrl}/video:batchAsyncGenerateVideoText`;

      logger.info(`Generating video (projectId: ${projectId}, sceneId: ${sceneId}, seed: ${seed})`);
      logger.info(`Prompt: ${prompt.substring(0, 100)}...`);

      const payload = {
        clientContext: {
          projectId,
          tool: "PINHOLE",
          userPaygateTier: "PAYGATE_TIER_ONE",
        },
        requests: [
          {
            aspectRatio,
            seed,
            textInput: {
              prompt,
            },
            videoModelKey: "veo_3_0_t2v_fast",
            metadata: {
              sceneId,
            },
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: this.buildGoogleApiHeaders(bearerToken),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`Video generation response (${response.status}): ${rawText.substring(0, 500)}`);

      if (!response.ok) {
        logger.error(`Failed to generate video: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          sceneId,
          seed,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse video generation response JSON", parseErr);
      }

      // Extract operation name (job ID) from response
      // Response structure: { operations: [{ operation: { name: "..." }, sceneId: "...", status: "..." }] }
      const operationName = data?.operations?.[0]?.operation?.name;
      logger.info(`Video generation started. Operation: ${operationName}`);

      return {
        success: true,
        data: {
          name: operationName, // Keep consistent with veo3.service.ts expectations
          operationName,
          sceneId,
          seed,
          raw: data,
        },
        sceneId,
        seed,
      };
    } catch (error) {
      logger.error("Error generating video", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Check video generation status
   * @param bearerToken - OAuth Bearer token
   * @param operationName - Operation name (job ID) from generateVideo response
   * @param sceneId - Scene ID used in generation
   */
  async checkVideoStatus(
    bearerToken: string,
    operationName: string,
    sceneId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.googleApiUrl}/video:batchCheckAsyncVideoGenerationStatus`;

      const payload = {
        operations: [
          {
            operation: {
              name: operationName,
            },
            sceneId,
            status: "MEDIA_GENERATION_STATUS_PENDING",
          },
        ],
      };

      logger.info(`Checking video status (operation: ${operationName}, scene: ${sceneId})`);

      const response = await fetch(url, {
        method: "POST",
        headers: this.buildGoogleApiHeaders(bearerToken),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      if (!response.ok) {
        logger.error(`Failed to check video status: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse status check response JSON", parseErr);
      }

      // Response structure: { operations: [{ operation: { name: "..." }, sceneId: "...", status: "...", videoUrl: "..." }] }
      const operation = data?.operations?.[0];
      const status = operation?.status || "UNKNOWN";
      const videoUrl = operation?.videoUrl || operation?.video?.url;

      logger.info(`Video status: ${status}`);
      if (videoUrl) {
        logger.info(`Video URL: ${videoUrl}`);
      }

      return {
        success: true,
        data: {
          mediaStatus: status, // Use mediaStatus to match backend expectations
          status,
          videoUrl,
          url: videoUrl,
          raw: data,
        },
      };
    } catch (error) {
      logger.error("Error checking video status", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const veo3ApiClient = new VEO3ApiClient();
