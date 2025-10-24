import React from "react";
import { Sparkles, Zap, BookOpen, Film, Briefcase, TrendingUp, Heart, Cpu, Palette, Crown, Smile, Coffee } from "lucide-react";

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

export interface VideoStyleOption {
  id: VideoStyle;
  label: string;
  icon: React.ReactNode;
}

export const VIDEO_STYLE_OPTIONS: VideoStyleOption[] = [
  {
    id: "explainer",
    label: "Explainer",
    icon: React.createElement(BookOpen, { className: "w-4 h-4" }),
  },
  {
    id: "corporate",
    label: "Corporate",
    icon: React.createElement(Briefcase, { className: "w-4 h-4" }),
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: React.createElement(TrendingUp, { className: "w-4 h-4" }),
  },
  {
    id: "documentary",
    label: "Documentary",
    icon: React.createElement(Film, { className: "w-4 h-4" }),
  },
  {
    id: "modern",
    label: "Modern",
    icon: React.createElement(Sparkles, { className: "w-4 h-4" }),
  },
  {
    id: "dynamic",
    label: "Dynamic",
    icon: React.createElement(Zap, { className: "w-4 h-4" }),
  },
  {
    id: "tech",
    label: "Tech",
    icon: React.createElement(Cpu, { className: "w-4 h-4" }),
  },
  {
    id: "organic",
    label: "Organic",
    icon: React.createElement(Palette, { className: "w-4 h-4" }),
  },
  {
    id: "luxury",
    label: "Luxury",
    icon: React.createElement(Crown, { className: "w-4 h-4" }),
  },
  {
    id: "inspirational",
    label: "Inspirational",
    icon: React.createElement(Heart, { className: "w-4 h-4" }),
  },
  {
    id: "calm",
    label: "Calm",
    icon: React.createElement(Coffee, { className: "w-4 h-4" }),
  },
  {
    id: "playful",
    label: "Playful",
    icon: React.createElement(Smile, { className: "w-4 h-4" }),
  },
];
