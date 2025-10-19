import React from "react";
import { ChevronRight } from "lucide-react";
import {
  PROMPT_ACCENT_COLORS,
  PROMPT_BADGE_COLOR_MAP,
  DEFAULT_PROMPT_BADGE,
} from "../../constants/promptCardConstants";

interface PromptCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accentColor?: "purple" | "red" | "blue";
  promptType?: string;
}

const PromptCard: React.FC<PromptCardProps> = ({
  title,
  description,
  icon,
  onClick,
  accentColor = "purple",
  promptType,
}) => {
  const colors = PROMPT_ACCENT_COLORS[accentColor];

  const promptTypeKey = promptType ? promptType.toString().toLowerCase() : null;
  const badgeColors =
    promptTypeKey && PROMPT_BADGE_COLOR_MAP[promptTypeKey]
      ? PROMPT_BADGE_COLOR_MAP[promptTypeKey]
      : DEFAULT_PROMPT_BADGE;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{ willChange: "transform, box-shadow" }}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 shadow-sm dark:shadow-none ${colors.hoverGlow} transform-gpu transition-shadow transition-transform duration-300 ease-out p-6 hover:-translate-y-4 hover:scale-105 hover:shadow-2xl hover:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 dark:focus:ring-offset-slate-900 hover:border-gray-300 dark:hover:border-slate-600 motion-reduce:transition-none motion-reduce:transform-none`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-2xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} transform-gpu group-hover:scale-105 transition-transform duration-300 shadow-md group-hover:shadow-xl`}
          style={{ willChange: "transform" }}
        >
          {icon}
        </div>
        <div className="flex-1">
          {/* Prompt type badge */}
          {promptType && (
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors.text} ${badgeColors.bg} border ${badgeColors.border}`}
              >
                {promptType}
              </span>
            </div>
          )}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span
              className={`text-sm font-semibold ${colors.linkText} transition-colors`}
            >
              Configure Prompts
            </span>
            <ChevronRight
              className={`w-5 h-5 ${colors.iconText} transform-gpu group-hover:translate-x-2 transition-transform duration-300`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
