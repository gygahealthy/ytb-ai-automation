/**
 * Component Discovery System (Renderer-side)
 *
 * This utility helps discover and build a hierarchical structure of React components
 * in the project. It can be used by the renderer to display component selections.
 */

import type {
  ComponentMetadata,
  ComponentHierarchyNode,
} from "../../shared/types/component-discovery.types";

/**
 * List of known components organized by category/folder
 * This can be extended with more components as they are created
 */
export const COMPONENT_REGISTRY: ComponentMetadata[] = [
  // Video Creation Components
  {
    id: "VideoCreator",
    name: "VideoCreator",
    displayName: "Video Creator",
    path: "src/renderer/components/video-creation",
    category: "video-creation",
    description: "Main component for creating videos",
    icon: "Clapperboard",
    isActive: true,
  },
  {
    id: "ScriptGenerator",
    name: "ScriptGenerator",
    displayName: "Script Generator",
    path: "src/renderer/components/video-creation/script-creation",
    category: "video-creation",
    description: "Generates video scripts using AI",
    icon: "FileText",
    isActive: true,
  },
  {
    id: "TopicGenerator",
    name: "TopicGenerator",
    displayName: "Topic Generator",
    path: "src/renderer/components/video-creation/topic-creation",
    category: "video-creation",
    description: "Generates video topics using AI",
    icon: "Lightbulb",
    isActive: true,
  },

  // Channel Management Components
  {
    id: "ChannelAnalyzer",
    name: "ChannelAnalyzer",
    displayName: "Channel Analyzer",
    path: "src/renderer/components/channel-management",
    category: "channel-management",
    description: "Analyzes YouTube channel performance",
    icon: "BarChart3",
    isActive: true,
  },
  {
    id: "ContentPlanner",
    name: "ContentPlanner",
    displayName: "Content Planner",
    path: "src/renderer/components/channel-management",
    category: "channel-management",
    description: "Plans content strategy for channels",
    icon: "Calendar",
    isActive: true,
  },

  // Preset Studio Components
  {
    id: "ThumbnailGenerator",
    name: "ThumbnailGenerator",
    displayName: "Thumbnail Generator",
    path: "src/renderer/components/preset-studio",
    category: "preset-studio",
    description: "Generates video thumbnails",
    icon: "Image",
    isActive: true,
  },
  {
    id: "TitleOptimizer",
    name: "TitleOptimizer",
    displayName: "Title Optimizer",
    path: "src/renderer/components/preset-studio",
    category: "preset-studio",
    description: "Optimizes video titles for SEO",
    icon: "Type",
    isActive: true,
  },

  // Automation Components
  {
    id: "BrowserAutomation",
    name: "BrowserAutomation",
    displayName: "Browser Automation",
    path: "src/renderer/components/automation",
    category: "automation",
    description: "Automates browser interactions",
    icon: "Zap",
    isActive: true,
  },
];

/**
 * Get all registered components
 */
export function getAllComponents(): ComponentMetadata[] {
  return COMPONENT_REGISTRY;
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: string): ComponentMetadata[] {
  return COMPONENT_REGISTRY.filter((comp) => comp.category === category);
}

/**
 * Get unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(COMPONENT_REGISTRY.map((comp) => comp.category)));
}

/**
 * Build hierarchical component tree
 */
export function buildComponentTree(): ComponentHierarchyNode[] {
  const tree: Record<string, ComponentHierarchyNode> = {};

  // Group by category (folder)
  getCategories().forEach((category) => {
    tree[category] = {
      id: category,
      name: category,
      displayName: formatCategoryName(category),
      type: "folder",
      path: `src/renderer/components/${category}`,
      category,
      children: [],
    };

    // Add components to category
    const componentsInCategory = getComponentsByCategory(category);
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
 * Format category name for display (e.g., "video-creation" -> "Video Creation")
 */
function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Search components by name or description
 */
export function searchComponents(query: string): ComponentMetadata[] {
  const lowerQuery = query.toLowerCase();
  return COMPONENT_REGISTRY.filter(
    (comp) =>
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.displayName.toLowerCase().includes(lowerQuery) ||
      (comp.description?.toLowerCase() || "").includes(lowerQuery)
  );
}

/**
 * Get component by ID
 */
export function getComponentById(id: string): ComponentMetadata | undefined {
  return COMPONENT_REGISTRY.find((comp) => comp.id === id);
}

/**
 * Register a new component (for extending the registry)
 */
export function registerComponent(metadata: ComponentMetadata): void {
  // Check if component already exists
  const existing = COMPONENT_REGISTRY.find((comp) => comp.id === metadata.id);
  if (existing) {
    // Update existing component
    Object.assign(existing, metadata);
  } else {
    // Add new component
    COMPONENT_REGISTRY.push(metadata);
  }
}

/**
 * Validate component metadata
 */
export function validateComponentMetadata(
  metadata: Partial<ComponentMetadata>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!metadata.id) errors.push("Component ID is required");
  if (!metadata.name) errors.push("Component name is required");
  if (!metadata.displayName) errors.push("Component display name is required");
  if (!metadata.path) errors.push("Component path is required");
  if (!metadata.category) errors.push("Component category is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}
