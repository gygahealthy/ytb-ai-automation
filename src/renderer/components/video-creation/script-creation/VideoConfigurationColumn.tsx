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
  Wand2,
  X,
  Lightbulb,
  FileText,
} from "lucide-react";
import { VideoStyle } from "./ScriptStyleSelector";
import { VisualStyle } from "./VisualStyleSelector";
import { VideoPrompt } from "./VideoPromptGenerator";
import { HintForTopicPrompt } from "./HintForTopicPrompt";
import { AITopicSuggestions } from "./AITopicSuggestions";

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
  const [showHintOverlay, setShowHintOverlay] = useState(false);
  const [hintInput, setHintInput] = useState("");
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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

  const handleGenerateTopicsFromHint = async () => {
    if (!hintInput.trim()) return;

    setIsGeneratingTopics(true);
    try {
      // TODO: Call API to generate topics based on hint
      // For now, we'll use placeholder suggestions
      const mockSuggestions = [
        `Video about ${hintInput} - Complete guide for beginners`,
        `How to master ${hintInput} - Tips and tricks`,
        `${hintInput} - Expert interview and insights`,
        `Top 10 things about ${hintInput}`,
      ];
      setTopicSuggestions(mockSuggestions);
      setSelectedTopicId(null);
    } catch (error) {
      console.error("Failed to generate topics:", error);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleSelectSuggestedTopic = (topic: string, id: string) => {
    setSelectedTopicId(id);
    onTopicChange?.(topic);
    // Close overlay after selection
    setTimeout(() => {
      setShowHintOverlay(false);
      setHintInput("");
      setTopicSuggestions([]);
      setSelectedTopicId(null);
    }, 100);
  };

  const handleSelectHintTopic = (topic: string) => {
    // Just fill the input, don't close - user will click Generate button
    setHintInput(topic);
  };

  const handleClearSuggestions = () => {
    setTopicSuggestions([]);
    setSelectedTopicId(null);
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) return;

    setIsGeneratingScript(true);
    try {
      // TODO: Call API to generate script based on topic and settings
      // For now, we'll use placeholder script
      const mockScript = `# ${topic}

## Scene 1: Introduction
Welcome to this comprehensive guide about ${topic}. In this video, we'll explore the key aspects and provide you with practical insights and actionable tips.

## Scene 2: Background
To understand ${topic}, we need to look at its origins and key concepts. This foundation will help us appreciate the deeper aspects of this topic.

## Scene 3: Main Content
Here are the core ideas you need to know about ${topic}. These principles form the basis for successful implementation.

## Scene 4: Practical Tips
Let's discuss some practical ways to apply ${topic} in your daily life or business.

## Scene 5: Conclusion
Thank you for watching this guide about ${topic}. We hope you found this information valuable and actionable.`;

      onScriptChange?.(mockScript);
    } catch (error) {
      console.error("Failed to generate script:", error);
    } finally {
      setIsGeneratingScript(false);
    }
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => simpleMode && onTopicChange?.(e.target.value)}
                readOnly={!simpleMode}
                placeholder={simpleMode ? "Enter your video topic..." : ""}
                className={`flex-1 px-3 py-2 border rounded text-gray-900 dark:text-white text-sm ${
                  simpleMode
                    ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                }`}
              />
              {simpleMode && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowHintOverlay(!showHintOverlay)}
                      className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      title="Generate topics from hint"
                    >
                      <Lightbulb className="w-5 h-5" />
                    </button>

                    {/* Hint Dropdown - Compact */}
                    {showHintOverlay && (
                      <div className="absolute z-50 top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded-lg shadow-lg p-2 space-y-2">
                        {/* Close Button */}
                        <div className="flex justify-end mb-1">
                          <button
                            onClick={() => {
                              setShowHintOverlay(false);
                              setHintInput("");
                              setTopicSuggestions([]);
                              handleClearSuggestions();
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Hint Input Row - More Compact */}
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={hintInput}
                            onChange={(e) => setHintInput(e.target.value)}
                            placeholder="e.g., social media marketing"
                            className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleGenerateTopicsFromHint();
                              }
                            }}
                          />
                          <button
                            onClick={handleGenerateTopicsFromHint}
                            disabled={!hintInput.trim() || isGeneratingTopics}
                            className="px-2 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            {isGeneratingTopics ? (
                              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Gen</span>
                          </button>
                        </div>

                        {/* Quick Examples or AI Suggestions - More Compact */}
                        <div className="max-h-56 overflow-y-auto">
                          {topicSuggestions.length === 0 ? (
                            <HintForTopicPrompt
                              onSelectTopic={handleSelectHintTopic}
                            />
                          ) : (
                            <AITopicSuggestions
                              suggestions={topicSuggestions}
                              selectedTopicId={selectedTopicId}
                              onSelectTopic={(topic, id) => {
                                handleSelectSuggestedTopic(topic, id);
                                setShowHintOverlay(false);
                              }}
                              onClearSuggestions={handleClearSuggestions}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateScript}
                    disabled={!topic.trim() || isGeneratingScript}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
                    title="Generate script from topic"
                  >
                    {isGeneratingScript ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
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
