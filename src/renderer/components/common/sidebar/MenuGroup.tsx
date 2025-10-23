import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { MenuGroupProps } from "../../../types/menu-route.types";
import MenuItem from "./MenuItem";

const MenuGroup: React.FC<MenuGroupProps> = ({ route, currentPage, currentPath, isCollapsed, onNavigate, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(route.defaultOpen ?? true);
  const Icon = route.icon;

  // Determine whether any child (recursively) is active - used to auto-open groups
  const hasActiveChild = React.useMemo(() => {
    const checkActiveRecursive = (r: typeof route): boolean => {
      if (r.children) {
        return r.children.some((child) => {
          if (child.page && currentPage?.toString().startsWith(child.page.toString())) return true;
          if (child.path && currentPath === child.path) return true;
          return checkActiveRecursive(child);
        });
      }
      return false;
    };
    return checkActiveRecursive(route);
  }, [route, currentPage, currentPath]);

  // Highlight the group button only when the group's own route exactly matches current path/page
  const isActive = React.useMemo(() => {
    if (route.page && currentPage?.toString() === route.page.toString()) return true;
    if (route.path && currentPath === route.path) return true;
    return false;
  }, [route, currentPage, currentPath]);

  // Auto-open if active child exists
  useEffect(() => {
    // Auto-open if any child is active (but don't rely on group highlight)
    if (hasActiveChild && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const hasChildren = route.children && route.children.length > 0;

  if (!hasChildren) {
    // Leaf node - render as MenuItem
    // Use exact equality so child pages don't cause parent pages to be highlighted
    const itemIsActive = route.page ? currentPage?.toString() === route.page.toString() : route.path === currentPath;

    return (
      <MenuItem route={route} isActive={itemIsActive} isCollapsed={isCollapsed} onNavigate={onNavigate} isChild={level > 0} />
    );
  }

  // Group with children - render expandable menu
  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center gap-3 rounded-lg font-medium transition-colors text-left",
          isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
          isActive ? "bg-primary-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
        title={isCollapsed ? route.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="flex-1 text-left leading-tight">{route.label}</span>}
        {!isCollapsed && (
          <ChevronRight className={clsx("w-4 h-4 transition-transform flex-shrink-0", isOpen ? "rotate-90" : "rotate-0")} />
        )}
      </button>

      {/* Submenu */}
      {isOpen && !isCollapsed && hasChildren && (
        <div className="mt-2 space-y-1 pl-8">
          {route.children!.map((child) => (
            <MenuGroup
              key={child.id}
              route={child}
              currentPage={currentPage}
              currentPath={currentPath}
              isCollapsed={isCollapsed}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuGroup;
