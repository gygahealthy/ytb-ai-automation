/**
 * Component Discovery Types
 */

export interface ComponentMetadata {
  id: string;
  name: string;
  displayName: string;
  path: string;
  category: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface ComponentHierarchyNode {
  id: string;
  name: string;
  displayName: string;
  type: "folder" | "component";
  path: string;
  category: string;
  children?: ComponentHierarchyNode[];
  metadata?: ComponentMetadata;
}
