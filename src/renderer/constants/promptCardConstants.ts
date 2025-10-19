export const PROMPT_ACCENT_COLORS = {
  purple: {
    iconBg:
      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/20 dark:to-purple-600/10",
    iconText: "text-purple-600 dark:text-purple-400",
    linkText:
      "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300",
    hoverGlow:
      "group-hover:shadow-2xl group-hover:shadow-purple-200/60 dark:group-hover:shadow-purple-500/30",
  },
  red: {
    iconBg:
      "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-500/20 dark:to-red-600/10",
    iconText: "text-red-600 dark:text-red-400",
    linkText:
      "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300",
    hoverGlow:
      "group-hover:shadow-2xl group-hover:shadow-red-200/60 dark:group-hover:shadow-red-500/30",
  },
  blue: {
    iconBg:
      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/10",
    iconText: "text-blue-600 dark:text-blue-400",
    linkText:
      "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
    hoverGlow:
      "group-hover:shadow-2xl group-hover:shadow-blue-200/60 dark:group-hover:shadow-blue-500/30",
  },
} as const;

export const PROMPT_BADGE_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  topic: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
  },
  script: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700",
  },
  title: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
  },
  ai_script: {
    bg: "bg-pink-50 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-700",
  },
  clips: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700",
  },
  audio: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700",
  },
};

export const DEFAULT_PROMPT_BADGE = {
  bg: "bg-slate-100 dark:bg-slate-700",
  text: "text-slate-700 dark:text-slate-300",
  border: "border-slate-200 dark:border-slate-700",
};
