import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  BookOpen,
  Film,
  Briefcase,
  TrendingUp,
  Heart,
  Cpu,
  Palette,
  Crown,
  Smile,
  Coffee,
  Info,
} from "lucide-react";
import { VIDEO_STYLE_KEYWORD_MAP, VIDEO_STYLE_OPTIONS } from "@shared/constants/script-style.constants";

export type VideoStyle =
  | "modern"
  | "dynamic"
  | "explainer"
  | "documentary"
  | "corporate"
  | "marketing"
  | "inspirational"
  | "tech"
  | "organic"
  | "luxury"
  | "playful"
  | "calm";

// Export VIDEO_STYLE_KEYWORD_MAP for use in other components
export { VIDEO_STYLE_KEYWORD_MAP };

interface StyleSelectorProps {
  selectedStyle: VideoStyle;
  onStyleChange: (style: VideoStyle) => void;
  // new: script length preset (short/medium/long/custom)
  scriptLengthPreset?: string;
  onScriptLengthChange?: (preset: string) => void;
  customWordCount?: number;
  onCustomWordCountChange?: (count: number) => void;
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Film: <Film className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Cpu: <Cpu className="w-6 h-6" />,
  Palette: <Palette className="w-6 h-6" />,
  Crown: <Crown className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Coffee: <Coffee className="w-6 h-6" />,
  Smile: <Smile className="w-6 h-6" />,
};

// Generate style options with icons from constants
const styleOptions = VIDEO_STYLE_OPTIONS.map((option) => ({
  ...option,
  icon: iconMap[option.iconName] || <Sparkles className="w-6 h-6" />,
}));

const getColorClasses = (color: string, isSelected: boolean) => {
  const colors = {
    blue: isSelected
      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
    purple: isSelected
      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
      : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600",
    green: isSelected
      ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
      : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600",
    pink: isSelected
      ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
      : "border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600",
    gray: isSelected
      ? "border-gray-500 bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300"
      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
    yellow: isSelected
      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
      : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600",
    red: isSelected
      ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600",
    orange: isSelected
      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
      : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600",
    indigo: isSelected
      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600",
    teal: isSelected
      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
      : "border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600",
    cyan: isSelected
      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
      : "border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600",
    emerald: isSelected
      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
      : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600",
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export const ScriptStyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  scriptLengthPreset = "medium",
  onScriptLengthChange,
  customWordCount = 140,
  onCustomWordCountChange,
}) => {
  const [hoveredStyle, setHoveredStyle] = useState<VideoStyle | null>(null);
  const [localPreset, setLocalPreset] = useState<string>(scriptLengthPreset);

  const presets = [
    { id: "short", label: "Short", words: 60, mins: 0.5 },
    { id: "medium", label: "Medium", words: 140, mins: 1 },
    { id: "long", label: "Long", words: 220, mins: 1.5 },
    { id: "custom", label: "Custom", words: 0, mins: 0 },
  ];

  const handlePresetChange = (id: string) => {
    setLocalPreset(id);
    onScriptLengthChange?.(id);
  };

  return (
    <>
      <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Your Video Style</label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {styleOptions.map((style) => {
          const isSelected = selectedStyle === style.id;
          const isHovered = hoveredStyle === style.id;
          return (
            <div key={style.id} className="relative group">
              <button
                onClick={() => onStyleChange(style.id)}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                className={`w-full h-20 pr-3 pl-3 rounded-lg border-2 transition-all flex items-center justify-between gap-2 ${getColorClasses(
                  style.colorClass,
                  isSelected
                )}`}
              >
                <div className={`flex-shrink-0 ${isSelected ? "" : "text-gray-400 dark:text-gray-500"}`}>{style.icon}</div>
                <div className={`text-sm font-semibold flex-1 text-center ${isSelected ? "" : "text-gray-900 dark:text-white"}`}>
                  {style.name}
                </div>
                <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute z-50 left-0 top-full mt-2 w-80 p-4 bg-gray-900 dark:bg-gray-950 text-white rounded-lg shadow-xl border border-gray-700 pointer-events-none">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Purpose</div>
                      <div className="text-sm">{style.tooltip.purpose}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Visual Style</div>
                      <div className="text-sm">{style.tooltip.visuals}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Music Style</div>
                      <div className="text-sm">{style.tooltip.music}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Best For</div>
                      <div className="text-sm text-blue-400">{style.tooltip.useCase}</div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 dark:bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Script length presets */}
      <div className="mt-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Script Length Preset</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                    localPreset === p.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                  }`}
                >
                  {p.label}
                  {p.id !== "custom" && (
                    <span className="ml-1 text-xs opacity-80">
                      (~{p.words}w / {p.mins}m)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {localPreset === "custom" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Word Count</label>
              <input
                type="number"
                value={customWordCount}
                onChange={(e) => onCustomWordCountChange?.(parseInt(e.target.value) || 0)}
                min="0"
                placeholder="Enter word count..."
                className="px-3 py-2 border rounded-lg text-gray-900 dark:text-white text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
