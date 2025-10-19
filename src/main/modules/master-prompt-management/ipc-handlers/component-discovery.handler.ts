/**
 * Component Discovery IPC Handler
 * Exposes component discovery service methods via IPC for the renderer process
 */

import { ipcMain } from "electron";
import { componentDiscoveryService } from "../services/component-discovery.service";
import type {
  ComponentMetadata,
  ComponentHierarchyNode,
} from "../../../../shared/types/component-discovery.types";
import { logger } from "../../../utils/logger-backend";
import type { ApiResponse } from "../../../../shared/types";

export const ComponentDiscoveryHandlers = {
  /**
   * Get all discovered components
   */
  getAllComponents: async (): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const components = componentDiscoveryService.getAllComponents();
      logger.info(
        `[ComponentDiscovery] Retrieved ${components.length} components`
      );
      return {
        success: true,
        data: components,
      };
    } catch (error) {
      logger.error("[ComponentDiscovery] Error getting all components:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get component hierarchy tree
   */
  getComponentHierarchy: async (): Promise<
    ApiResponse<ComponentHierarchyNode[]>
  > => {
    try {
      const hierarchy = componentDiscoveryService.getComponentHierarchy();
      logger.info(
        `[ComponentDiscovery] Generated hierarchy with ${hierarchy.length} top-level categories`
      );
      return {
        success: true,
        data: hierarchy,
      };
    } catch (error) {
      logger.error("[ComponentDiscovery] Error getting hierarchy:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get components by category
   */
  getComponentsByCategory: async (
    category: string
  ): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const components =
        componentDiscoveryService.getComponentsByCategory(category);
      logger.info(
        `[ComponentDiscovery] Retrieved ${components.length} components for category: ${category}`
      );
      return {
        success: true,
        data: components,
      };
    } catch (error) {
      logger.error(
        `[ComponentDiscovery] Error getting components by category: ${category}`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Search components
   */
  searchComponents: async (
    query: string
  ): Promise<ApiResponse<ComponentMetadata[]>> => {
    try {
      const results = componentDiscoveryService.searchComponents(query);
      logger.info(
        `[ComponentDiscovery] Search for "${query}" returned ${results.length} results`
      );
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error("[ComponentDiscovery] Error searching components:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get component tree formatted for UI
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
      const tree = componentDiscoveryService.getComponentTreeForUI();
      logger.info(
        `[ComponentDiscovery] Generated UI tree with ${tree.length} categories`
      );

      // Verify tree is serializable
      logger.info(
        `[ComponentDiscovery] First category: ${JSON.stringify(tree[0])}`
      );

      const response = {
        success: true,
        data: tree,
      };

      logger.info(
        `[ComponentDiscovery] About to return response with ${tree.length} items`
      );
      return response;
    } catch (error) {
      logger.error("[ComponentDiscovery] Error getting UI tree:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

/**
 * Register component discovery handlers
 */
export function registerComponentDiscoveryHandlers(): void {
  ipcMain.handle(
    "componentDiscovery:getAllComponents",
    ComponentDiscoveryHandlers.getAllComponents
  );
  ipcMain.handle(
    "componentDiscovery:getComponentHierarchy",
    ComponentDiscoveryHandlers.getComponentHierarchy
  );
  ipcMain.handle(
    "componentDiscovery:getComponentsByCategory",
    (_event, category: string) =>
      ComponentDiscoveryHandlers.getComponentsByCategory(category)
  );
  ipcMain.handle(
    "componentDiscovery:searchComponents",
    (_event, query: string) =>
      ComponentDiscoveryHandlers.searchComponents(query)
  );
  ipcMain.handle(
    "componentDiscovery:getComponentTreeForUI",
    ComponentDiscoveryHandlers.getComponentTreeForUI
  );

  logger.info("[ComponentDiscovery] IPC handlers registered");
}
