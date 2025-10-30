import {
  Clapperboard,
  History,
  LayoutDashboard,
  Zap,
  PlayCircle,
  Sparkles,
  Users,
  Video,
  Youtube,
  FlaskConical,
  Wand2 as Wand,
  Zap as ZapIcon,
} from "lucide-react";
import { RouteConfig } from "../../../types/menu-route.types";

// Ordered menu per request:
// 1. Profiles (with submenu: Profiles, Cookie Rotation Config)
// 2. Single Video Creation
// 3. Channel Management
// 4. Master Prompt (LayoutDashboard icon)
// 5. Automation
export const routeConfig: RouteConfig[] = [
  {
    id: "profiles",
    label: "Profiles",
    icon: Users,
    page: "profiles",
    defaultOpen: true,
    children: [
      {
        id: "profiles.main",
        label: "Profiles",
        icon: Users,
        path: "/profiles",
        page: "profiles",
      },
      {
        id: "profiles.browser-launch-dashboard",
        label: "Browser Launch",
        icon: PlayCircle,
        path: "/profiles/browser-launch",
        page: "profiles.browser-launch",
      },
      {
        id: "profiles.cookie-rotation",
        label: "Cookie Config",
        icon: ZapIcon,
        path: "/profiles/cookie-rotation",
        page: "profiles.cookie-rotation",
      },
    ],
  },
  {
    id: "video-creation",
    label: "Single Video Creation",
    icon: PlayCircle,
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
        icon: Video,
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
    id: "master-prompt",
    label: "Master Prompt",
    icon: Wand,
    page: "master-prompt",
    defaultOpen: true,
    children: [
      {
        id: "master-prompt.prompt-types",
        label: "Prompt Types",
        icon: Sparkles,
        path: "/master-prompt/prompt-types",
        page: "master-prompt.prompt-types",
      },
      {
        id: "master-prompt.master-prompts",
        label: "Master Prompts",
        icon: LayoutDashboard,
        path: "/master-prompt/master-prompts",
        page: "master-prompt.master-prompts",
      },
      {
        id: "master-prompt.ai-prompt-config",
        label: "AI Prompt Config",
        icon: Zap,
        path: "/master-prompt/ai-prompt-config",
        page: "master-prompt.ai-prompt-config",
      },
      {
        id: "master-prompt.prompt-playground",
        label: "Prompt Playground",
        icon: FlaskConical,
        path: "/master-prompt/prompt-playground",
        page: "master-prompt.prompt-playground",
      },
    ],
  },
];
