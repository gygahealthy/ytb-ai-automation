import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Sparkles,
  Briefcase,
  TrendingUp,
  Film,
  Zap,
  Cpu,
  Palette,
  Crown,
  Heart,
  Coffee,
  Smile,
  Image,
  Layers,
  Camera,
  Grid,
  Star,
} from "lucide-react";
import { VideoStyle } from "./ScriptStyleSelector";
import { VisualStyle } from "./VisualStyleSelector";
import { VideoPrompt } from "./VideoPromptGenerator";

interface VideoConfigurationColumnProps {
  topic: string;
  videoStyle: string;
  visualStyle: string;
  scriptLengthPreset: string;
  customWordCount: number;
  script: string;
  prompts: VideoPrompt[];
  simpleMode: boolean;
  onTopicChange?: (topic: string) => void;
  onVideoStyleChange?: (style: VideoStyle) => void;
  onVisualStyleChange?: (style: VisualStyle) => void;
  onScriptLengthChange?: (preset: string) => void;
  onCustomWordCountChange?: (count: number) => void;
  onScriptChange?: (script: string) => void;
}

export const VideoConfigurationColumn: React.FC<
  VideoConfigurationColumnProps
> = ({
  topic,
  videoStyle,
  visualStyle,
  scriptLengthPreset,
  customWordCount,
  script,
  prompts,
  simpleMode,
  onTopicChange,
  onVideoStyleChange,
  onVisualStyleChange,
  onScriptLengthChange,
  onCustomWordCountChange,
  onScriptChange,
}) => {
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  // Preset configurations: word count -> minutes
  const presetConfigs: Record<string, { words: number; mins: number }> = {
    short: { words: 60, mins: 0.5 },
    medium: { words: 140, mins: 1 },
    long: { words: 220, mins: 1.5 },
    custom: {
      words: customWordCount,
      mins: Math.round((customWordCount / 140) * 10) / 10,
    },
  };

  const getPresetInfo = (preset: string) => {
    const config = presetConfigs[preset] || presetConfigs.medium;
    return config;
  };

  // Style option lists (icons + labels)
  const videoStyleOptions = [
    {
      id: "explainer",
      label: "Explainer",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "corporate",
      label: "Corporate",
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "documentary",
      label: "Documentary",
      icon: <Film className="w-4 h-4" />,
    },
    { id: "modern", label: "Modern", icon: <Sparkles className="w-4 h-4" /> },
    { id: "dynamic", label: "Dynamic", icon: <Zap className="w-4 h-4" /> },
    { id: "tech", label: "Tech", icon: <Cpu className="w-4 h-4" /> },
    { id: "organic", label: "Organic", icon: <Palette className="w-4 h-4" /> },
    { id: "luxury", label: "Luxury", icon: <Crown className="w-4 h-4" /> },
    {
      id: "inspirational",
      label: "Inspirational",
      icon: <Heart className="w-4 h-4" />,
    },
    { id: "calm", label: "Calm", icon: <Coffee className="w-4 h-4" /> },
    { id: "playful", label: "Playful", icon: <Smile className="w-4 h-4" /> },
  ] as const;

  const visualStyleOptions = [
    {
      id: "2d-cartoon",
      label: "2D Cartoon",
      icon: <Image className="w-4 h-4" />,
    },
    {
      id: "3d-cartoon",
      label: "3D Cartoon",
      icon: <Grid className="w-4 h-4" />,
    },
    { id: "anime", label: "Anime", icon: <Star className="w-4 h-4" /> },
    {
      id: "motion-graphics",
      label: "Motion Graphics",
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: "whiteboard",
      label: "Whiteboard",
      icon: <Image className="w-4 h-4" />,
    },
    {
      id: "stop-motion",
      label: "Stop Motion",
      icon: <Camera className="w-4 h-4" />,
    },
    {
      id: "paper-cutout",
      label: "Paper Cutout",
      icon: <Grid className="w-4 h-4" />,
    },
    { id: "pixel-art", label: "Pixel Art", icon: <Star className="w-4 h-4" /> },
    { id: "cinematic", label: "Cinematic", icon: <Film className="w-4 h-4" /> },
    { id: "noir", label: "Noir", icon: <Film className="w-4 h-4" /> },
    {
      id: "documentary",
      label: "Documentary",
      icon: <Film className="w-4 h-4" />,
    },
    { id: "vintage", label: "Vintage", icon: <Image className="w-4 h-4" /> },
    {
      id: "found-footage",
      label: "Found Footage",
      icon: <Camera className="w-4 h-4" />,
    },
    { id: "cyberpunk", label: "Cyberpunk", icon: <Cpu className="w-4 h-4" /> },
    { id: "low-poly", label: "Low Poly", icon: <Grid className="w-4 h-4" /> },
    { id: "isometric", label: "Isometric", icon: <Grid className="w-4 h-4" /> },
    { id: "glitch", label: "Glitch", icon: <Zap className="w-4 h-4" /> },
    { id: "surreal", label: "Surreal", icon: <Star className="w-4 h-4" /> },
    {
      id: "watercolor",
      label: "Watercolor",
      icon: <Image className="w-4 h-4" />,
    },
    {
      id: "comic-book",
      label: "Comic Book",
      icon: <Image className="w-4 h-4" />,
    },
    { id: "doodle", label: "Doodle", icon: <Star className="w-4 h-4" /> },
    {
      id: "impressionistic",
      label: "Impressionistic",
      icon: <Image className="w-4 h-4" />,
    },
  ] as const;

  // Icon-enabled custom select used in simple mode
  const IconSelect: React.FC<{
    options: readonly { id: string; label: string; icon: React.ReactNode }[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }> = ({ options, value, onChange, placeholder, isOpen, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = typeof isOpen === "boolean" ? isOpen : internalOpen;
    const setOpen = (v: boolean) => {
      if (typeof onOpenChange === "function") onOpenChange(v);
      else setInternalOpen(v);
    };

    const selected = options.find((o) => o.id === value) || options[0];
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <div className="flex items-center gap-3">
            <div className="text-gray-500">{selected?.icon}</div>
            <div className="truncate">{selected?.label || placeholder}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-60 overflow-auto">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="text-gray-500">{opt.icon}</div>
                <div className="truncate">{opt.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const findVideoStyleLabel = (id: string) => {
    const found = videoStyleOptions.find((o) => o.id === (id as any));
    return found ? found.label : id;
  };

  const findVisualStyleLabel = (id: string) => {
    const found = visualStyleOptions.find((o) => o.id === (id as any));
    return found ? found.label : id.replace(/-/g, " ");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Video Configuration
        </label>
      </div>

      {/* Main content: controls + script preview that fills remaining height */}
      <div className="flex-1 flex flex-col pr-2 min-h-0">
        {/* Controls (fixed height as needed) */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              TOPIC
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => simpleMode && onTopicChange?.(e.target.value)}
              readOnly={!simpleMode}
              placeholder={simpleMode ? "Enter your video topic..." : ""}
              className={`w-full px-3 py-2 border rounded text-gray-900 dark:text-white text-sm ${
                simpleMode
                  ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              TONE STYLE
            </label>
            {simpleMode ? (
              <IconSelect
                options={videoStyleOptions as any}
                value={videoStyle}
                onChange={(id) => onVideoStyleChange?.(id as VideoStyle)}
                placeholder="Choose tone style"
                isOpen={openSelect === "videoStyle"}
                onOpenChange={(open) =>
                  setOpenSelect(open ? "videoStyle" : null)
                }
              />
            ) : (
              <select
                value={videoStyle}
                disabled
                className="w-full px-3 py-2 border rounded text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 cursor-not-allowed"
              >
                <option value={videoStyle}>
                  {findVideoStyleLabel(videoStyle)}
                </option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              VISUAL STYLE
            </label>
            {simpleMode ? (
              <IconSelect
                options={visualStyleOptions as any}
                value={visualStyle}
                onChange={(id) => onVisualStyleChange?.(id as VisualStyle)}
                placeholder="Choose visual style"
                isOpen={openSelect === "visualStyle"}
                onOpenChange={(open) =>
                  setOpenSelect(open ? "visualStyle" : null)
                }
              />
            ) : (
              <select
                value={visualStyle}
                disabled
                className="w-full px-3 py-2 border rounded text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 cursor-not-allowed"
              >
                <option value={visualStyle}>
                  {findVisualStyleLabel(visualStyle)}
                </option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              SCRIPT LENGTH
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {["short", "medium", "long", "custom"].map((preset) => {
                const info = getPresetInfo(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => simpleMode && onScriptLengthChange?.(preset)}
                    disabled={!simpleMode}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      scriptLengthPreset === preset
                        ? "bg-blue-600 text-white"
                        : simpleMode
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}{" "}
                    <span className="text-xs opacity-75">
                      (~{info.words}w / {info.mins}m)
                    </span>
                  </button>
                );
              })}
            </div>
            {scriptLengthPreset === "custom" && simpleMode && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Custom Word Count
                </label>
                <input
                  type="number"
                  value={customWordCount}
                  onChange={(e) =>
                    onCustomWordCountChange?.(parseInt(e.target.value) || 0)
                  }
                  min="0"
                  placeholder="Enter word count..."
                  className="w-48 px-3 py-2 border rounded text-gray-900 dark:text-white text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Script preview - flexes to fill remaining height */}
        <div className="mt-2 flex-1 min-h-0">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            SCRIPT {simpleMode ? "" : "PREVIEW"}
          </label>
          <textarea
            value={script}
            onChange={(e) => simpleMode && onScriptChange?.(e.target.value)}
            readOnly={!simpleMode}
            placeholder={
              simpleMode ? "Enter or paste your video script here..." : ""
            }
            className={`w-full h-full px-3 py-2 border rounded text-gray-900 dark:text-white text-sm font-mono resize-none overflow-auto ${
              simpleMode
                ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            }`}
          />
        </div>
      </div>

      {/* Footer - fixed at bottom */}
      <div className="pt-3">
        {simpleMode && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Simple Mode:</strong> Fill in all fields, then click
              "Generate" to create your scenes.
            </p>
          </div>
        )}

        {prompts.length > 0 && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
              GENERATED
            </div>
            <div className="text-sm font-semibold text-green-900 dark:text-green-100">
              {prompts.length} scenes × 8 seconds = {prompts.length * 8} seconds
              total
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
