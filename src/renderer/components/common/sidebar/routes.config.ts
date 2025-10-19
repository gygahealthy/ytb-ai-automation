import {
  Clapperboard,
  History,
  LayoutDashboard,
  PlayCircle,
  Shield,
  Sparkles,
  Users,
  Video,
  Youtube,
} from "lucide-react";
import { RouteConfig } from "../../../types/menu-route.types";

export const routeConfig: RouteConfig[] = [
  {
    id: "profiles",
    label: "Profiles",
    icon: Users,
    path: "/profiles",
    page: "profiles",
  },
  {
    id: "automation",
    label: "Automation",
    icon: PlayCircle,
    page: "automation",
    defaultOpen: true,
    children: [
      {
        id: "automation.dashboard",
        label: "Browser Instance",
        icon: LayoutDashboard,
        path: "/automation/instance",
        page: "automation.dashboard",
      },
    ],
  },
  {
    id: "video-creation",
    label: "Single Video Creation",
    icon: Video,
    page: "video-creation",
    defaultOpen: true,
    children: [
      {
        id: "video-creation.story",
        label: "Story Creator",
        icon: Clapperboard,
        path: "/video-creation/script-create",
        page: "video-creation.story",
      },
      {
        id: "video-creation.single",
        label: "Single Video Creation",
        icon: Clapperboard,
        path: "/video-creation/single",
        page: "video-creation.single",
      },

      {
        id: "video-creation.history",
        label: "Video Creation History",
        icon: History,
        path: "/video-creation/history",
        page: "video-creation.history",
      },
    ],
  },
  {
    id: "channels",
    label: "Channel Management",
    icon: Youtube,
    path: "/video-creation/channels",
    page: "channels" as any,
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    page: "admin",
    defaultOpen: false,
    children: [
      {
        id: "admin.prompt-types",
        label: "Prompt Types",
        icon: Sparkles,
        path: "/admin/prompt-types",
        page: "admin.prompt-types",
      },
      {
        id: "admin.master-prompts",
        label: "Master Prompts",
        icon: Sparkles,
        path: "/admin/master-prompts",
        page: "admin.master-prompts",
      },
    ],
  },
];
