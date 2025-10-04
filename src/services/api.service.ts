import { Logger } from "../utils/logger.util";

const logger = new Logger("APIService");

export class APIService {
  /**
   * Make HTTP GET request
   */
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`GET request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Make HTTP POST request
   */
  async post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`POST request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`PUT request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`DELETE request failed: ${url}`, error);
      throw error;
    }
  }
}

export const apiService = new APIService();

