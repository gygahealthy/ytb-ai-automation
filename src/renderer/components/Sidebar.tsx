import clsx from "clsx";
import { Settings, Terminal } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "../App";
import { useLogStore } from "../store/log.store";
import Logo from "./common/sidebar/Logo";
import MenuGroup from "./common/sidebar/MenuGroup";
import { routeConfig } from "./common/sidebar/routes.config";
import CookieRotationIndicatorInner from "./common/sidebar/cookie-rotation/CookieRotationIndicator";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onSettingsClick: () => void;
}

export default function Sidebar({
  currentPage,
  onPageChange,
  onSettingsClick,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleDrawer, closeAndUnpin } = useLogStore();

  const handleNavigate = useCallback(
    (path?: string, page?: string) => {
      // Navigate to the path if provided
      if (path) {
        navigate(path);
      }
      // Update the page state
      if (page) {
        onPageChange(page as Page);
      }
    },
    [navigate, onPageChange]
  );

  return (
    <aside
      className={clsx(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <Logo
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {routeConfig.map((route) => (
          <MenuGroup
            key={route.id}
            route={route}
            currentPage={currentPage}
            currentPath={location.pathname}
            isCollapsed={isCollapsed}
            onNavigate={handleNavigate}
            level={0}
          />
        ))}
      </nav>

      {/* System Logs & Settings at bottom */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {/* Cookie Rotation Status Indicator */}
        {!isCollapsed && <CookieRotationIndicatorInner />}

        {/* Icon-only buttons row for System Logs and Settings */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              // If drawer is pinned, ensure we unpin+close when clicking sidebar button
              closeAndUnpin();
              // Also toggle in case it was closed
              toggleDrawer();
            }}
            className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="System Logs (Ctrl+G)"
          >
            <Terminal className="w-5 h-5" />
          </button>
          <button
            onClick={onSettingsClick}
            className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
