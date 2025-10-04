import clsx from "clsx";
import { History, LayoutDashboard, PlayCircle, Settings, Users } from "lucide-react";
import { Page } from "../App";
import logoImage from "../assets/logo.png";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onSettingsClick: () => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "automation", label: "Automation", icon: PlayCircle },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "history", label: "History", icon: History },
];

export default function Sidebar({ currentPage, onPageChange, onSettingsClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center px-6 border-b border-gray-200 dark:border-gray-700">
        <img src={logoImage} alt="VEO3 Logo" className="object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-primary-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
