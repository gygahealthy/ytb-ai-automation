import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Package,
  AlertCircle,
} from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  displayName: string;
  type: "folder" | "component";
  path: string;
  icon?: string;
  children?: TreeNode[];
  isExpanded?: boolean;
}

interface ComponentSelectorProps {
  selectedComponent: string;
  onComponentSelect: (componentName: string) => void;
  loadingComponents?: boolean;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selectedComponent,
  onComponentSelect,
  loadingComponents: _loadingComponentsProp = false,
}) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComponentHierarchy();
  }, []);

  const loadComponentHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the IPC handler to get component tree
      const response = await (
        window.electronAPI as any
      ).componentDiscovery.getComponentTreeForUI();

      console.log("[ComponentSelector] Received response:", response);
      console.log("[ComponentSelector] Response type:", typeof response);
      console.log("[ComponentSelector] Response.success:", response?.success);
      console.log("[ComponentSelector] Response.data:", response?.data);
      console.log("[ComponentSelector] Data length:", response?.data?.length);

      if (!response) {
        setError("No response received from IPC");
        return;
      }

      if (response.success && response.data) {
        console.log(
          "[ComponentSelector] Processing data, length:",
          response.data.length
        );
        // Transform the response data into TreeNode format
        const treeData: TreeNode[] = response.data.map((category: any) => ({
          id: category.id,
          name: category.name,
          displayName: category.displayName,
          type: category.type,
          path: category.path || `src/renderer/components/${category.name}`,
          icon: category.icon,
          children: category.children?.map((child: any) => ({
            id: child.id,
            name: child.name,
            displayName: child.displayName,
            type: child.type,
            path: child.path || "",
            icon: child.icon,
          })),
        }));
        console.log(
          "[ComponentSelector] Setting tree with",
          treeData.length,
          "items"
        );
        setTree(treeData);
      } else if (Array.isArray(response)) {
        // If response is directly an array, use it as is
        console.log("[ComponentSelector] Response is array");
        const treeData: TreeNode[] = response.map((category: any) => ({
          id: category.id,
          name: category.name,
          displayName: category.displayName,
          type: category.type,
          path: category.path || `src/renderer/components/${category.name}`,
          icon: category.icon,
          children: category.children?.map((child: any) => ({
            id: child.id,
            name: child.name,
            displayName: child.displayName,
            type: child.type,
            path: child.path || "",
            icon: child.icon,
          })),
        }));
        setTree(treeData);
      } else {
        console.log("[ComponentSelector] Response does not match conditions");
        setError(response.error || "Failed to load components");
      }
    } catch (err) {
      console.error(
        "[ComponentSelector] Failed to load component hierarchy:",
        err
      );
      setError(
        err instanceof Error ? err.message : "Unknown error loading components"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderTreeNode = (
    node: TreeNode,
    depth: number = 0
  ): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (node.type === "component") {
      return (
        <div key={node.id} className="group">
          <button
            onClick={() => onComponentSelect(node.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
              selectedComponent === node.id
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <Package size={16} className="flex-shrink-0" />
            <span className="flex-1 text-left">
              {node.displayName || node.name}
            </span>
            {selectedComponent === node.id && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      );
    }

    // Folder node
    return (
      <div key={node.id}>
        <button
          onClick={() => toggleNodeExpand(node.id)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {isExpanded ? (
            <ChevronDown size={16} className="flex-shrink-0" />
          ) : (
            <ChevronRight size={16} className="flex-shrink-0" />
          )}
          <FolderOpen size={16} className="flex-shrink-0 text-amber-500" />
          <span className="flex-1 text-left">
            {node.displayName || node.name}
          </span>
          {hasChildren && (
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded px-2 py-0.5">
              {node.children?.length}
            </span>
          )}
        </button>

        {isExpanded && hasChildren && (
          <div className="space-y-0.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FolderOpen size={20} className="text-amber-500" />
          Component Hierarchy
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Browse and select a component from the project structure below
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle
            size={16}
            className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Loading components...
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden flex-1 flex flex-col">
          <div className="p-3 flex-1 overflow-y-auto">
            {tree.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No components found
              </p>
            ) : (
              tree.map((node) => renderTreeNode(node))
            )}
          </div>
        </div>
      )}

      {selectedComponent && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Selected Component:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
              {(() => {
                const idxDash = selectedComponent.lastIndexOf("-");
                const idxPipe = selectedComponent.lastIndexOf("|");
                const idx = Math.max(idxDash, idxPipe);
                return idx === -1
                  ? selectedComponent
                  : selectedComponent.slice(idx + 1);
              })()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
