import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { MenuGroupProps } from "../../../types/menu-route.types";
import MenuItem from "./MenuItem";

const MenuGroup: React.FC<MenuGroupProps> = ({ route, currentPage, currentPath, isCollapsed, onNavigate, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(route.defaultOpen ?? true);
  const Icon = route.icon;

  // Check if this group or any of its children are active
  const isActive = React.useMemo(() => {
    const checkActive = (r: typeof route): boolean => {
      if (r.page && currentPage?.toString().startsWith(r.page.toString())) {
        return true;
      }
      if (r.path && currentPath === r.path) {
        return true;
      }
      if (r.children) {
        return r.children.some(checkActive);
      }
      return false;
    };
    return checkActive(route);
  }, [route, currentPage, currentPath]);

  // Auto-open if active child exists
  useEffect(() => {
    if (isActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isActive]);

  const hasChildren = route.children && route.children.length > 0;

  if (!hasChildren) {
    // Leaf node - render as MenuItem
    const itemIsActive = route.page 
      ? currentPage?.toString().startsWith(route.page.toString()) 
      : route.path === currentPath;

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
          isActive
            ? "bg-primary-500 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
