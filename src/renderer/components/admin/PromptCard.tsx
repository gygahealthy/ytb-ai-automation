import React from "react";
import { ChevronRight } from "lucide-react";
import { PROMPT_ACCENT_COLORS } from "../../constants/promptCardConstants";

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

  // badgeColors is intentionally not used because prompt type badge uses a fixed indigo style

  // Helper to render text with variable highlights for [VAR] or {VAR}
  const renderWithVars = (text: string) => {
    if (!text) return text;
    const parts: React.ReactNode[] = [];
    // regex captures either [VAR] or {VAR} and allow mixed-case
    // also accept optional surrounding backticks or quotes like `'{video_topic}'`
    const re = /(?:`?['"]?)(?:\[|\{)([A-Za-z0-9_]+)(?:\]|\})(?:['"]?`?)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const idx = m.index;
      if (idx > lastIndex) parts.push(text.substring(lastIndex, idx));
      const full = m[0];
      // derive the displayed token: slice from the first bracket to the matching closing bracket inside full
      const innerStart = full.search(/\[|\{/);
      const innerEnd = full.search(/\]|\}/);
      const varText =
        innerStart >= 0 && innerEnd >= 0
          ? full.substring(innerStart, innerEnd + 1)
          : full;
      parts.push(
        <span
          key={`${idx}-${varText}`}
          className="inline-block px-1 py-0.5 rounded text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 mr-1"
        >
          {varText}
        </span>
      );
      lastIndex = idx + varText.length;
    }
    if (parts.length === 0) return text;
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts;
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{ willChange: "transform, box-shadow" }}
      className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 shadow-md dark:shadow-lg ${colors.hoverGlow} transform-gpu transition-shadow transition-transform duration-300 ease-out p-6 hover:-translate-y-4 hover:scale-105 hover:shadow-2xl hover:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 dark:focus:ring-offset-slate-900 hover:border-gray-300 dark:hover:border-slate-600 motion-reduce:transition-none motion-reduce:transform-none`}
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
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800`}
              >
                {promptType}
              </span>
            </div>
          )}
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {renderWithVars(title) || title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
            {renderWithVars(description) || description}
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
