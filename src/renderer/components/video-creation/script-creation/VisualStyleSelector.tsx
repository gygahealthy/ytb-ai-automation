import React from "react";
import {
  Palette,
  Box,
  Sparkles,
  Film,
  Video,
  Grid3x3,
  Scissors,
  Image,
  Cpu,
  Zap,
  Circle,
  Layers,
  Aperture,
  Droplet,
  BookOpen,
  PenTool,
  Camera,
} from "lucide-react";

export type VisualStyle =
  | "2d-cartoon"
  | "3d-cartoon"
  | "anime"
  | "motion-graphics"
  | "whiteboard"
  | "stop-motion"
  | "paper-cutout"
  | "pixel-art"
  | "cinematic"
  | "noir"
  | "documentary"
  | "vintage"
  | "found-footage"
  | "cyberpunk"
  | "low-poly"
  | "isometric"
  | "glitch"
  | "surreal"
  | "watercolor"
  | "comic-book"
  | "doodle"
  | "impressionistic";

interface VisualStyleOption {
  id: VisualStyle;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  colorClass: string;
}

interface VisualStyleSelectorProps {
  selectedStyle: VisualStyle;
  onStyleChange: (style: VisualStyle) => void;
}

const visualStyleOptions: VisualStyleOption[] = [
  // Animation Styles
  {
    id: "2d-cartoon",
    name: "2D Cartoon",
    icon: <Palette className="w-6 h-6" />,
    category: "Animation",
    description:
      "Classic flat-style animations for storytelling and friendly content",
    colorClass: "blue",
  },
  {
    id: "3d-cartoon",
    name: "3D Cartoon / Pixar",
    icon: <Box className="w-6 h-6" />,
    category: "Animation",
    description: "Depth, volume, realistic lighting with stylized characters",
    colorClass: "purple",
  },
  {
    id: "anime",
    name: "Anime / Japanese",
    icon: <Sparkles className="w-6 h-6" />,
    category: "Animation",
    description: "Expressive characters, dramatic action, Japanese aesthetic",
    colorClass: "pink",
  },
  {
    id: "motion-graphics",
    name: "Motion Graphics",
    icon: <Layers className="w-6 h-6" />,
    category: "Animation",
    description: "Animated text, logos, and abstract shapes for explainers",
    colorClass: "indigo",
  },
  {
    id: "whiteboard",
    name: "Whiteboard Animation",
    icon: <PenTool className="w-6 h-6" />,
    category: "Animation",
    description: "Hand-drawing simulation for educational content",
    colorClass: "gray",
  },
  {
    id: "stop-motion",
    name: "Stop Motion / Clay",
    icon: <Scissors className="w-6 h-6" />,
    category: "Animation",
    description: "Charming handmade aesthetic with physical objects",
    colorClass: "orange",
  },
  {
    id: "paper-cutout",
    name: "Paper Cutout",
    icon: <Image className="w-6 h-6" />,
    category: "Animation",
    description: "Tactile, crafty, whimsical paper shapes",
    colorClass: "yellow",
  },
  {
    id: "pixel-art",
    name: "Pixel Art",
    icon: <Grid3x3 className="w-6 h-6" />,
    category: "Animation",
    description: "Retro 8-bit video game aesthetic",
    colorClass: "green",
  },

  // Cinematic & Live-Action
  {
    id: "cinematic",
    name: "Cinematic / Photorealistic",
    icon: <Film className="w-6 h-6" />,
    category: "Cinematic",
    description: "High-budget film look with dramatic lighting and angles",
    colorClass: "slate",
  },
  {
    id: "noir",
    name: "Noir Film",
    icon: <Circle className="w-6 h-6" />,
    category: "Cinematic",
    description: "High-contrast black-and-white mystery and shadows",
    colorClass: "gray",
  },
  {
    id: "documentary",
    name: "Documentary",
    icon: <Video className="w-6 h-6" />,
    category: "Cinematic",
    description: "Realistic, trustworthy, handheld camera feel",
    colorClass: "teal",
  },
  {
    id: "vintage",
    name: "Vintage / Retro Film",
    icon: <Camera className="w-6 h-6" />,
    category: "Cinematic",
    description: "Old film stock with grain and nostalgic effects",
    colorClass: "amber",
  },
  {
    id: "found-footage",
    name: "Found Footage",
    icon: <Video className="w-6 h-6" />,
    category: "Cinematic",
    description: "Raw, shaky camera for realistic immersion",
    colorClass: "red",
  },

  // Digital & Abstract
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    icon: <Cpu className="w-6 h-6" />,
    category: "Digital",
    description: "Futuristic neon lights and dystopian cityscapes",
    colorClass: "cyan",
  },
  {
    id: "low-poly",
    name: "Low-Poly 3D",
    icon: <Box className="w-6 h-6" />,
    category: "Digital",
    description: "Geometric faceted look with minimal polygons",
    colorClass: "lime",
  },
  {
    id: "isometric",
    name: "Isometric",
    icon: <Grid3x3 className="w-6 h-6" />,
    category: "Digital",
    description: "Top-down angled perspective for processes and systems",
    colorClass: "blue",
  },
  {
    id: "glitch",
    name: "Glitch Art",
    icon: <Zap className="w-6 h-6" />,
    category: "Digital",
    description: "Digital errors and artifacts for disruption effect",
    colorClass: "fuchsia",
  },
  {
    id: "surreal",
    name: "Surreal / Abstract",
    icon: <Aperture className="w-6 h-6" />,
    category: "Digital",
    description: "Dreamlike, non-realistic, thought-provoking visuals",
    colorClass: "violet",
  },

  // Traditional & Artistic
  {
    id: "watercolor",
    name: "Watercolor",
    icon: <Droplet className="w-6 h-6" />,
    category: "Artistic",
    description: "Soft, translucent, blended painting look",
    colorClass: "sky",
  },
  {
    id: "comic-book",
    name: "Comic Book",
    icon: <BookOpen className="w-6 h-6" />,
    category: "Artistic",
    description: "Bold outlines, halftone dots, panel layouts",
    colorClass: "red",
  },
  {
    id: "doodle",
    name: "Doodle / Sketch",
    icon: <PenTool className="w-6 h-6" />,
    category: "Artistic",
    description: "Hand-drawn rough lines, personal and creative",
    colorClass: "orange",
  },
  {
    id: "impressionistic",
    name: "Impressionistic",
    icon: <Palette className="w-6 h-6" />,
    category: "Artistic",
    description: "Focus on light, color, and movement over detail",
    colorClass: "rose",
  },
];

const getColorClasses = (color: string, isSelected: boolean) => {
  const colors = {
    blue: isSelected
      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-blue-300",
    purple: isSelected
      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-purple-300",
    pink: isSelected
      ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-pink-300",
    indigo: isSelected
      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300",
    gray: isSelected
      ? "border-gray-500 bg-gray-50 dark:bg-gray-700/30"
      : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
    orange: isSelected
      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-orange-300",
    yellow: isSelected
      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-yellow-300",
    green: isSelected
      ? "border-green-500 bg-green-50 dark:bg-green-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-green-300",
    slate: isSelected
      ? "border-slate-500 bg-slate-50 dark:bg-slate-700/30"
      : "border-gray-200 dark:border-gray-700 hover:border-slate-300",
    teal: isSelected
      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-teal-300",
    amber: isSelected
      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-amber-300",
    red: isSelected
      ? "border-red-500 bg-red-50 dark:bg-red-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-red-300",
    cyan: isSelected
      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-cyan-300",
    lime: isSelected
      ? "border-lime-500 bg-lime-50 dark:bg-lime-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-lime-300",
    fuchsia: isSelected
      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-fuchsia-300",
    violet: isSelected
      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-violet-300",
    sky: isSelected
      ? "border-sky-500 bg-sky-50 dark:bg-sky-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-sky-300",
    rose: isSelected
      ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30"
      : "border-gray-200 dark:border-gray-700 hover:border-rose-300",
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export const VisualStyleSelector: React.FC<VisualStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
}) => {
  const categories = ["Animation", "Cinematic", "Digital", "Artistic"];

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryStyles = visualStyleOptions.filter(
          (style) => style.category === category
        );
        return (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {category} Styles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {categoryStyles.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => onStyleChange(style.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${getColorClasses(
                      style.colorClass,
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`flex-shrink-0 ${
                          isSelected
                            ? "text-current"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {style.icon}
                      </div>
                      <div
                        className={`text-sm font-semibold flex-1 ${
                          isSelected
                            ? "text-current"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {style.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {style.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
