import React from "react";
import { ChevronRight } from "lucide-react";

interface PromptCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accentColor?: "purple" | "red" | "blue";
}

const PromptCard: React.FC<PromptCardProps> = ({
  title,
  description,
  icon,
  onClick,
  accentColor = "purple",
}) => {
  const accentColors = {
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
  };

  const colors = accentColors[accentColor];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 shadow-lg dark:shadow-2xl dark:shadow-slate-900/30 ${colors.hoverGlow} transition-all duration-300 p-6 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 dark:focus:ring-offset-slate-900 hover:border-gray-300 dark:hover:border-slate-600`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-2xl ${colors.iconBg} flex items-center justify-center ${colors.iconText} group-hover:scale-125 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}
        >
          {icon}
        </div>
        <div className="flex-1">
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
              className={`w-5 h-5 ${colors.iconText} group-hover:translate-x-2 transition-transform duration-300`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
