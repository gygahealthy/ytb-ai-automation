import { VideoStyle } from "@components/video-creation/script-creation/ScriptStyleSelector";

export const VIDEO_STYLE_KEYWORD_MAP: Record<string, VideoStyle> = {
  explainer: "explainer",
  educational: "explainer",
  tutorial: "explainer",
  "how to": "explainer",
  guide: "explainer",

  corporate: "corporate",
  business: "corporate",
  professional: "corporate",
  company: "corporate",

  marketing: "marketing",
  promotional: "marketing",
  ad: "marketing",
  "product launch": "marketing",

  documentary: "documentary",
  story: "documentary",
  storytelling: "documentary",
  narrative: "documentary",

  modern: "modern",
  minimalist: "modern",
  clean: "modern",
  sleek: "modern",

  dynamic: "dynamic",
  trendy: "dynamic",
  viral: "dynamic",
  tiktok: "dynamic",
  reels: "dynamic",

  tech: "tech",
  technology: "tech",
  futuristic: "tech",
  ai: "tech",
  software: "tech",

  organic: "organic",
  handmade: "organic",
  artisan: "organic",
  eco: "organic",

  luxury: "luxury",
  elegant: "luxury",
  premium: "luxury",
  exclusive: "luxury",

  inspirational: "inspirational",
  motivational: "inspirational",
  uplifting: "inspirational",

  calm: "calm",
  relaxing: "calm",
  peaceful: "calm",
  meditation: "calm",

  playful: "playful",
  comedic: "playful",
  funny: "playful",
  entertainment: "playful",
};
