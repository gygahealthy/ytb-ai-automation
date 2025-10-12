import clsx from "clsx";
import React from "react";
import { MenuItemProps } from "../../../types/menu-route.types";

const MenuItem: React.FC<MenuItemProps> = ({ route, isActive, isCollapsed, onNavigate, isChild = false }) => {
  const Icon = route.icon;

  const handleClick = () => {
    if (route.path || route.page) {
      onNavigate(route.path, route.page);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "w-full flex items-center rounded-lg transition-colors text-left",
        isChild ? "gap-2 px-3 py-2 text-sm" : "gap-3 px-3 py-2.5 font-medium",
        isCollapsed && !isChild && "justify-center",
        isActive
          ? isChild
            ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200"
            : "bg-primary-500 text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
      title={isCollapsed ? route.label : undefined}
    >
      <Icon className={clsx("flex-shrink-0", isChild ? "w-4 h-4" : "w-5 h-5")} />
      {!isCollapsed && <span className="flex-1 text-left leading-tight">{route.label}</span>}
    </button>
  );
};

export default MenuItem;


