import React from "react";
import { Image, Grid, Star, Layers, Camera, Film, Cpu, Zap } from "lucide-react";

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

export interface VisualStyleOption {
  id: VisualStyle;
  label: string;
  icon: React.ReactNode;
}

export const VISUAL_STYLE_OPTIONS: VisualStyleOption[] = [
  {
    id: "2d-cartoon",
    label: "2D Cartoon",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
  {
    id: "3d-cartoon",
    label: "3D Cartoon",
    icon: React.createElement(Grid, { className: "w-4 h-4" }),
  },
  {
    id: "anime",
    label: "Anime",
    icon: React.createElement(Star, { className: "w-4 h-4" }),
  },
  {
    id: "motion-graphics",
    label: "Motion Graphics",
    icon: React.createElement(Layers, { className: "w-4 h-4" }),
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
  {
    id: "stop-motion",
    label: "Stop Motion",
    icon: React.createElement(Camera, { className: "w-4 h-4" }),
  },
  {
    id: "paper-cutout",
    label: "Paper Cutout",
    icon: React.createElement(Grid, { className: "w-4 h-4" }),
  },
  {
    id: "pixel-art",
    label: "Pixel Art",
    icon: React.createElement(Star, { className: "w-4 h-4" }),
  },
  {
    id: "cinematic",
    label: "Cinematic",
    icon: React.createElement(Film, { className: "w-4 h-4" }),
  },
  {
    id: "noir",
    label: "Noir",
    icon: React.createElement(Film, { className: "w-4 h-4" }),
  },
  {
    id: "documentary",
    label: "Documentary",
    icon: React.createElement(Film, { className: "w-4 h-4" }),
  },
  {
    id: "vintage",
    label: "Vintage",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
  {
    id: "found-footage",
    label: "Found Footage",
    icon: React.createElement(Camera, { className: "w-4 h-4" }),
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    icon: React.createElement(Cpu, { className: "w-4 h-4" }),
  },
  {
    id: "low-poly",
    label: "Low Poly",
    icon: React.createElement(Grid, { className: "w-4 h-4" }),
  },
  {
    id: "isometric",
    label: "Isometric",
    icon: React.createElement(Grid, { className: "w-4 h-4" }),
  },
  {
    id: "glitch",
    label: "Glitch",
    icon: React.createElement(Zap, { className: "w-4 h-4" }),
  },
  {
    id: "surreal",
    label: "Surreal",
    icon: React.createElement(Star, { className: "w-4 h-4" }),
  },
  {
    id: "watercolor",
    label: "Watercolor",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
  {
    id: "comic-book",
    label: "Comic Book",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
  {
    id: "doodle",
    label: "Doodle",
    icon: React.createElement(Star, { className: "w-4 h-4" }),
  },
  {
    id: "impressionistic",
    label: "Impressionistic",
    icon: React.createElement(Image, { className: "w-4 h-4" }),
  },
];
