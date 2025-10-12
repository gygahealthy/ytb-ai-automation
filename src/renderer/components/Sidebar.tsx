import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  History,
  LayoutDashboard,
  PlayCircle,
  Settings,
  Shield,
  Users,
  Video,
  Workflow,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "../App";
import iconImage from "../assets/icon.png";

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
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "automation", label: "Automation", icon: PlayCircle },
  { id: "video-creation", label: "Video Creation", icon: Video },
  { id: ("channels" as any), label: "Channel Management", icon: Youtube },
  { id: "admin", label: "Admin", icon: Shield },
  { id: "history", label: "History", icon: History },
];

export default function Sidebar({ currentPage, onPageChange, onSettingsClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAutomationOpen, setIsAutomationOpen] = useState(true);
  const [isVideoCreationOpen, setIsVideoCreationOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={clsx(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "h-20 flex items-center border-b border-gray-200 dark:border-gray-700 relative justify-center",
          isCollapsed ? " px-2" : " px-4"
        )}
      >
        <img src={iconImage} alt="VEO3 Icon" className="h-12 w-12 object-contain" />
        {!isCollapsed && <span className="text-xl font-bold text-gray-900 dark:text-white">VEO3 AUTO</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || currentPage?.toString().startsWith(`${item.id}` as any);

          // Render Automation as a parent with dropdown
          if (item.id === "automation") {
            return (
              <div key={item.id} className="w-full">
                <button
                  onClick={() => setIsAutomationOpen(!isAutomationOpen)}
                  className={clsx(
                    "w-full flex items-center gap-3 rounded-lg font-medium transition-colors",
                    isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-primary-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!isCollapsed && (
                    <ChevronRight className={clsx("w-4 h-4 transition-transform", isAutomationOpen ? "rotate-90" : "rotate-0")} />
                  )}
                </button>

                {/* Submenu */}
                {isAutomationOpen && !isCollapsed && (
                  <div className="mt-2 space-y-1 pl-8">
                    <button
                      onClick={() => {
                        navigate("/automation/instance");
                        onPageChange("automation.dashboard" as any);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-3 py-2",
                        location.pathname === "/automation/instance"
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Browser Instance</span>
                    </button>
                    {/* Future submenu items can be added here */}
                  </div>
                )}
              </div>
            );
          }

          // Render Channel Management as a simple top-level item
          if ((item.id as any) === "channels") {
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate("/video-creation/channels");
                  onPageChange(item.id as any);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 rounded-lg font-medium transition-colors",
                  isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          }

          // Render Admin as a parent with Prompt Flow submenu
          if ((item.id as any) === "admin") {
            return (
              <div key={item.id} className="w-full">
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className={clsx(
                    "w-full flex items-center gap-3 rounded-lg font-medium transition-colors",
                    isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-primary-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!isCollapsed && (
                    <ChevronRight className={clsx("w-4 h-4 transition-transform", isAdminOpen ? "rotate-90" : "rotate-0")} />
                  )}
                </button>

                {isAdminOpen && !isCollapsed && (
                  <div className="mt-2 space-y-1 pl-8">
                    <button
                      onClick={() => {
                        navigate("/video-creation/prompt-flows");
                        // report the page under Admin so the Admin parent highlights
                        onPageChange("admin.prompt-flows" as any);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-3 py-2",
                        location.pathname === "/video-creation/prompt-flows"
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <Workflow className="w-4 h-4" />
                      <span>Prompt Flow Config</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Render Video Creation as a parent with dropdown
          if (item.id === "video-creation") {
            return (
              <div key={item.id} className="w-full">
                <button
                  onClick={() => setIsVideoCreationOpen(!isVideoCreationOpen)}
                  className={clsx(
                    "w-full flex items-center gap-3 rounded-lg font-medium transition-colors",
                    isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-primary-500 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!isCollapsed && (
                    <ChevronRight
                      className={clsx("w-4 h-4 transition-transform", isVideoCreationOpen ? "rotate-90" : "rotate-0")}
                    />
                  )}
                </button>

                {/* Submenu */}
                {isVideoCreationOpen && !isCollapsed && (
                  <div className="mt-2 space-y-1 pl-8">
                    <button
                      onClick={() => {
                        navigate("/video-creation/single");
                        onPageChange("video-creation.single" as any);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-3 py-2",
                        location.pathname === "/video-creation/single"
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <Clapperboard className="w-4 h-4" />
                      <span>Single Video Creation</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/video-creation/history");
                        onPageChange("video-creation.history" as any);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 rounded-lg text-sm transition-colors px-3 py-2",
                        location.pathname === "/video-creation/history"
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <History className="w-4 h-4" />
                      <span>Video Creation History</span>
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                // navigate to the corresponding route and update currentPage in parent
                navigate(`/${item.id}`);
                onPageChange(item.id);
              }}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg font-medium transition-colors",
                isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSettingsClick}
          className={clsx(
            "w-full flex items-center gap-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            isCollapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
