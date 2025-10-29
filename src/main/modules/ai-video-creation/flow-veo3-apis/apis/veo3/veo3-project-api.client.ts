import { Logger } from "../../../../../../shared/utils/logger";
import { buildVEO3Headers } from "../../helpers/veo3-headers.helper";

const logger = new Logger("VEO3ProjectApiClient");

/**
 * VEO3 Project API Client
 * Handles project-related HTTP requests to Google Labs VEO3 API
 */
export class VEO3ProjectApiClient {
  private readonly baseUrl = "https://labs.google/fx/api/trpc";

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
          ...buildVEO3Headers(cookie),
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
        headers: buildVEO3Headers(cookie),
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
   * Update a VEO3 project title
   * @param cookie - Authentication cookie string from profile
   * @param projectId - Project ID to update
   * @param projectTitle - New project title
   * @param toolName - Tool name (default: "PINHOLE")
   */
  async updateProjectTitle(
    cookie: string,
    projectId: string,
    projectTitle: string,
    toolName: string = "PINHOLE"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.baseUrl}/project.updateProject`;

      const payload = {
        json: {
          projectId,
          projectInfo: {
            projectTitle,
          },
          updateMasks: ["projectTitle"],
          toolName,
        },
      };

      logger.info(`Updating VEO3 project "${projectId}" to title: "${projectTitle}"`);
      logger.info(`VEO3 endpoint: ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: buildVEO3Headers(cookie),
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      logger.info(`VEO3 update raw response (truncated 2000 chars): ${rawText.slice(0, 2000)}`);

      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        logger.error("Failed to parse VEO3 update response JSON", parseErr);
      }

      if (!response.ok) {
        logger.error(`Failed to update project: ${response.status} - ${rawText}`);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      logger.info(`Successfully updated project: ${projectId}`);

      return {
        success: true,
        data: {
          result: data?.result?.data?.json || data,
          rawText,
          endpoint: url,
        },
      };
    } catch (error) {
      logger.error("Error updating project", error);
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

export const veo3ProjectApiClient = new VEO3ProjectApiClient();
