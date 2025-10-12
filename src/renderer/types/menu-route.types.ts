import { LucideIcon } from "lucide-react";
import { Page } from "../App";

export interface RouteConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  page?: Page | string;
  children?: RouteConfig[];
  accentColor?: string;
  defaultOpen?: boolean;
}

export interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page | string) => void;
  onSettingsClick: () => void;
}

export interface MenuItemProps {
  route: RouteConfig;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate: (path?: string, page?: Page | string) => void;
  isChild?: boolean;
}

export interface MenuGroupProps {
  route: RouteConfig;
  currentPage: Page;
  currentPath: string;
  isCollapsed: boolean;
  onNavigate: (path?: string, page?: Page | string) => void;
  level?: number;
}

