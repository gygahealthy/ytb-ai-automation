/**
 * Component Discovery IPC Client
 * Provides methods to communicate with the main process for component discovery
 */

import type {
  ComponentMetadata,
  ComponentHierarchyNode,
} from "../../shared/types/component-discovery.types";
import type { ApiResponse } from "../../shared/types";

const componentDiscovery = {
  /**
   * Get all discovered components from the project
   */
  getAllComponents: async (): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const result = await window.electronAPI.invoke(
        "componentDiscovery:getAllComponents"
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get components",
      };
    }
  },

  /**
   * Get component hierarchy tree structure
   */
  getComponentHierarchy: async (): Promise<
    ApiResponse<ComponentHierarchyNode[]>
  > => {
    try {
      const result = await window.electronAPI.invoke(
        "componentDiscovery:getComponentHierarchy"
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get component hierarchy",
      };
    }
  },

  /**
   * Get components filtered by category
   */
  getComponentsByCategory: async (
    category: string
  ): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const result = await window.electronAPI.invoke(
        "componentDiscovery:getComponentsByCategory",
        category
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get components by category",
      };
    }
  },

  /**
   * Search components by query string
   */
  searchComponents: async (
    query: string
  ): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const result = await window.electronAPI.invoke(
        "componentDiscovery:searchComponents",
        query
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to search components",
      };
    }
  },

  /**
   * Get component tree formatted for UI rendering
   */
  getComponentTreeForUI: async (): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        displayName: string;
        type: "folder" | "component";
        icon?: string;
        children?: Array<any>;
      }>
    >
  > => {
    try {
      const result = await window.electronAPI.invoke(
        "componentDiscovery:getComponentTreeForUI"
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get component tree",
      };
    }
  },
};

export default componentDiscovery;
