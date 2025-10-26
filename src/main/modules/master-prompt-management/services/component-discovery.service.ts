/**
 * Component Discovery Service
 * Dynamically scans the renderer/pages folder structure and returns page metadata.
 * Uses fs and path to discover pages at runtime instead of hardcoded registry.
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
    // Determine the base path to src/renderer/pages
    // In development mode, TypeScript compiles to dist/main/modules/...
    // __dirname = dist/main/modules/master-prompt-management/services
    // We need to resolve back to src/renderer/pages

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // Development: Go from dist/main/modules/master-prompt-management/services back to project root
      // Then to src/renderer/pages
      // From services: up 5 levels gets us to project root (services -> mpm -> modules -> main -> dist -> root)
      const projectRoot = path.resolve(__dirname, "../../../../..");
      this.componentsBasePath = path.resolve(projectRoot, "src/renderer/pages");
    } else {
      // Production: process.cwd() is the project root
      this.componentsBasePath = path.resolve(process.cwd(), "src/renderer/pages");
    }

    console.log(`[ComponentDiscovery] Pages base path: ${this.componentsBasePath}`);
    console.log(`[ComponentDiscovery] Directory exists: ${fs.existsSync(this.componentsBasePath)}`);
  }

  /**
   * Scan the pages directory and return all discovered pages
   */
  getAllComponents(): ComponentMetadata[] {
    const components: ComponentMetadata[] = [];

    try {
      if (!fs.existsSync(this.componentsBasePath)) {
        console.warn(`Pages directory not found: ${this.componentsBasePath}`);
        return components;
      }

      const entries = fs.readdirSync(this.componentsBasePath, {
        withFileTypes: true,
      });

      // First, add root-level .tsx files
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".tsx")) {
          const componentName = entry.name.replace(/\.tsx$/, "");
          const displayName = this.formatDisplayName(componentName);

          components.push({
            id: `root-${componentName}`,
            name: componentName,
            displayName,
            path: `src/renderer/pages`,
            category: "root",
            description: `Page from root`,
            icon: this.getCategoryIcon("root"),
            isActive: true,
          });
        }
      }

      // Then, scan subdirectories as categories
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const categoryName = entry.name;
        const categoryPath = path.join(this.componentsBasePath, categoryName);

        // Scan for .tsx files in the category folder
        this.scanDirectory(categoryPath, categoryName, components);
      }
    } catch (error) {
      console.error("Error scanning pages directory:", error);
    }

    return components;
  }

  /**
   * Recursively scan a directory for page files
   */
  private scanDirectory(dirPath: string, category: string, components: ComponentMetadata[], relativePath: string = ""): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const currentRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          this.scanDirectory(fullPath, category, components, currentRelPath);
        } else if (entry.isFile()) {
          // Check if it's a page file (.tsx only - not .ts, .d.ts, .test.tsx, .spec.tsx)
          if (
            entry.name.endsWith(".tsx") &&
            !entry.name.endsWith(".d.ts") &&
            !entry.name.includes(".test.") &&
            !entry.name.includes(".spec.") &&
            entry.name !== "index.tsx"
          ) {
            const componentName = entry.name.replace(/\.tsx$/, "");
            const displayName = this.formatDisplayName(componentName);

            components.push({
              id: `${category}-${componentName}`,
              name: componentName,
              displayName,
              path: `src/renderer/pages/${category}${relativePath ? "/" + relativePath : ""}`,
              category,
              description: `Page from ${category}`,
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
  private buildComponentTree(components: ComponentMetadata[]): ComponentHierarchyNode[] {
    const categories = Array.from(new Set(components.map((comp) => comp.category)));
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

      const componentsInCategory = components.filter((comp) => comp.category === category);
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
      "master-prompt": "Sparkles",
      automation: "Zap",
      profiles: "User",
      root: "FileText",
    };

    return iconMap[category] || "Folder";
  }
}

export const componentDiscoveryService = new ComponentDiscoveryService();
