/**
 * Component Discovery Service
 * Dynamically scans the renderer/components folder structure and returns component metadata.
 * Uses fs and path to discover components at runtime instead of hardcoded registry.
 */

import * as fs from "fs";
import * as path from "path";

interface ComponentMetadata {
  id: string;
  name: string;
  displayName: string;
  path: string;
  category: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

interface ComponentHierarchyNode {
  id: string;
  name: string;
  displayName: string;
  type: "folder" | "component";
  path: string;
  category: string;
  children?: ComponentHierarchyNode[];
  metadata?: ComponentMetadata;
}

export class ComponentDiscoveryService {
  private componentsBasePath: string;

  constructor() {
    // Determine the base path to src/renderer/components
    // In development mode, TypeScript compiles to dist/main/modules/...
    // __dirname = dist/main/modules/master-prompt-management/services
    // We need to resolve back to src/renderer/components

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // Development: Go from dist/main/modules/master-prompt-management/services back to project root
      // Then to src/renderer/components
      // From services: up 5 levels gets us to project root (services -> mpm -> modules -> main -> dist -> root)
      const projectRoot = path.resolve(__dirname, "../../../../..");
      this.componentsBasePath = path.resolve(
        projectRoot,
        "src/renderer/components"
      );
    } else {
      // Production: process.cwd() is the project root
      this.componentsBasePath = path.resolve(
        process.cwd(),
        "src/renderer/components"
      );
    }

    console.log(
      `[ComponentDiscovery] Components base path: ${this.componentsBasePath}`
    );
    console.log(
      `[ComponentDiscovery] Directory exists: ${fs.existsSync(
        this.componentsBasePath
      )}`
    );
  }

  /**
   * Scan the components directory and return all discovered components
   */
  getAllComponents(): ComponentMetadata[] {
    const components: ComponentMetadata[] = [];

    try {
      if (!fs.existsSync(this.componentsBasePath)) {
        console.warn(
          `Components directory not found: ${this.componentsBasePath}`
        );
        return components;
      }

      const categories = fs.readdirSync(this.componentsBasePath, {
        withFileTypes: true,
      });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryName = category.name;
        const categoryPath = path.join(this.componentsBasePath, categoryName);

        // Scan for .tsx and .ts files in the category folder
        this.scanDirectory(categoryPath, categoryName, components);
      }
    } catch (error) {
      console.error("Error scanning components directory:", error);
    }

    return components;
  }

  /**
   * Recursively scan a directory for component files
   */
  private scanDirectory(
    dirPath: string,
    category: string,
    components: ComponentMetadata[],
    relativePath: string = ""
  ): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const currentRelPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          this.scanDirectory(fullPath, category, components, currentRelPath);
        } else if (entry.isFile()) {
          // Check if it's a component file (.tsx or .ts but not .d.ts, .test.ts, .spec.ts)
          if (
            (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) &&
            !entry.name.endsWith(".d.ts") &&
            !entry.name.includes(".test.") &&
            !entry.name.includes(".spec.") &&
            entry.name !== "index.ts" &&
            entry.name !== "index.tsx"
          ) {
            const componentName = entry.name.replace(/\.(tsx|ts)$/, "");
            const displayName = this.formatDisplayName(componentName);

            components.push({
              id: `${category}-${componentName}`,
              name: componentName,
              displayName,
              path: `src/renderer/components/${category}${
                relativePath ? "/" + relativePath : ""
              }`,
              category,
              description: `Component from ${category}`,
              icon: this.getCategoryIcon(category),
              isActive: true,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  /**
   * Build hierarchical tree structure from discovered components
   */
  getComponentHierarchy(): ComponentHierarchyNode[] {
    const allComponents = this.getAllComponents();
    return this.buildComponentTree(allComponents);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentMetadata[] {
    return this.getAllComponents().filter((comp) => comp.category === category);
  }

  /**
   * Search components by query string
   */
  searchComponents(query: string): ComponentMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllComponents().filter(
      (comp) =>
        comp.name.toLowerCase().includes(lowerQuery) ||
        comp.displayName.toLowerCase().includes(lowerQuery) ||
        (comp.description?.toLowerCase() || "").includes(lowerQuery)
    );
  }

  /**
   * Build component tree from components array
   */
  private buildComponentTree(
    components: ComponentMetadata[]
  ): ComponentHierarchyNode[] {
    const categories = Array.from(
      new Set(components.map((comp) => comp.category))
    );
    const tree: Record<string, ComponentHierarchyNode> = {};

    categories.forEach((category) => {
      tree[category] = {
        id: category,
        name: category,
        displayName: this.formatCategoryName(category),
        type: "folder",
        path: `src/renderer/components/${category}`,
        category,
        children: [],
      };

      const componentsInCategory = components.filter(
        (comp) => comp.category === category
      );
      componentsInCategory.forEach((comp) => {
        tree[category].children?.push({
          id: comp.id,
          name: comp.name,
          displayName: comp.displayName,
          type: "component",
          path: comp.path,
          category: comp.category,
          metadata: comp,
        });
      });
    });

    return Object.values(tree);
  }

  /**
   * Format category name for display (kebab-case to Title Case)
   */
  private formatCategoryName(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Format component name for display (PascalCase to Title Case)
   */
  private formatDisplayName(componentName: string): string {
    // Convert PascalCase to Title Case with spaces
    return componentName
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\s+/g, " ");
  }

  /**
   * Get component tree formatted for UI rendering
   */
  getComponentTreeForUI(): Array<{
    id: string;
    name: string;
    displayName: string;
    type: "folder" | "component";
    icon?: string;
    children?: Array<any>;
  }> {
    const tree = this.getComponentHierarchy();
    return tree.map((node: ComponentHierarchyNode) => ({
      id: node.id,
      name: node.name,
      displayName: node.displayName,
      type: node.type,
      icon: this.getCategoryIcon(node.category),
      children: node.children?.map((child: ComponentHierarchyNode) => ({
        id: child.id,
        name: child.name,
        displayName: child.displayName,
        type: child.type,
        icon: "Package",
        // Do NOT include metadata - it's not needed by the UI and causes serialization issues
      })),
    }));
  }

  /**
   * Get icon name for a category
   */
  private getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      "video-creation": "Clapperboard",
      "channel-management": "Users",
      "preset-studio": "Palette",
      automation: "Zap",
      admin: "Settings",
      "all-channels": "List",
      common: "Box",
      profiles: "User",
      settings: "Settings",
    };

    return iconMap[category] || "Folder";
  }
}

export const componentDiscoveryService = new ComponentDiscoveryService();
