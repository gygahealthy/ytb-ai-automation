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

export interface VideoStyleOption {
  id: VideoStyle;
  name: string;
  iconName: string;
  description: string;
  colorClass: string;
  tooltip: {
    purpose: string;
    visuals: string;
    music: string;
    useCase: string;
  };
}

export const VIDEO_STYLE_OPTIONS: VideoStyleOption[] = [
  {
    id: "explainer",
    name: "Explainer & Educational",
    iconName: "BookOpen",
    description: "Simplify complex topics",
    colorClass: "green",
    tooltip: {
      purpose: "To simplify complex topics and educate viewers",
      visuals: "Whiteboard animations, simple 2D graphics, clear icons, screen recordings",
      music: "Upbeat but unobtrusive corporate or ukulele background music",
      useCase: "Tutorials, product demos, educational content",
    },
  },
  {
    id: "corporate",
    name: "Corporate & Business",
    iconName: "Briefcase",
    description: "Professional and trustworthy",
    colorClass: "gray",
    tooltip: {
      purpose: "To appear professional, trustworthy, and polished",
      visuals: "High-quality stock footage, office environments, abstract geometric shapes, clean data visualizations",
      music: "Subtle, motivational corporate tracks",
      useCase: "Company announcements, investor pitches, brand overviews",
    },
  },
  {
    id: "marketing",
    name: "Marketing & Promotional",
    iconName: "TrendingUp",
    description: "Grab attention and persuade",
    colorClass: "orange",
    tooltip: {
      purpose: "To grab attention and persuade viewers to take action",
      visuals: "Dynamic footage, eye-catching product shots, bold text animations, fast cuts",
      music: "Modern, energetic pop, electronic, or epic trailer music",
      useCase: "Social media ads, product launches, event promotions",
    },
  },
  {
    id: "documentary",
    name: "Documentary & Storytelling",
    iconName: "Film",
    description: "Evoke emotion, tell stories",
    colorClass: "indigo",
    tooltip: {
      purpose: "To evoke emotion and tell a compelling narrative",
      visuals: "Cinematic footage, historical photos, interviews with lower thirds text",
      music: "Evocative orchestral scores, ambient soundscapes, poignant piano tracks",
      useCase: "Human interest stories, historical summaries, case studies",
    },
  },
  {
    id: "modern",
    name: "Modern & Minimalist",
    iconName: "Sparkles",
    description: "Clean lines and simplicity",
    colorClass: "blue",
    tooltip: {
      purpose: "Create a sleek, contemporary aesthetic",
      visuals: "Lots of white space, clean lines, simple geometry, subtle animations, limited color palette",
      music: "Ambient, electronic, or lo-fi",
      useCase: "Tech products, lifestyle brands, design portfolios",
    },
  },
  {
    id: "dynamic",
    name: "Dynamic & Trendy",
    iconName: "Zap",
    description: "Fast-paced and viral",
    colorClass: "purple",
    tooltip: {
      purpose: "Create engaging short-form content for social media",
      visuals: "Fast cuts, zoom effects, whip pans, glitch transitions, vibrant text overlays, emojis",
      music: "Trending pop songs, EDM, hip-hop",
      useCase: "TikTok/Reels content, viral marketing, social media engagement",
    },
  },
  {
    id: "tech",
    name: "Tech & Futuristic",
    iconName: "Cpu",
    description: "Cutting-edge and digital",
    colorClass: "cyan",
    tooltip: {
      purpose: "Convey innovation and technological advancement",
      visuals: "Dark backgrounds with neon/glowing elements, glitch effects, HUD overlays, digital fonts",
      music: "Techno, electronic, futuristic soundscapes",
      useCase: "Tech launches, AI/software demos, gaming content",
    },
  },
  {
    id: "organic",
    name: "Organic & Handmade",
    iconName: "Palette",
    description: "Authentic and tactile",
    colorClass: "teal",
    tooltip: {
      purpose: "Create a warm, authentic, human-centered feel",
      visuals: "Stop-motion, paper-cutout animations, hand-drawn elements, natural textures",
      music: "Acoustic guitar, folk, indie music",
      useCase: "Artisan products, children's content, eco-friendly brands",
    },
  },
  {
    id: "luxury",
    name: "Elegant & Luxurious",
    iconName: "Crown",
    description: "Sophisticated and premium",
    colorClass: "yellow",
    tooltip: {
      purpose: "Convey exclusivity, quality, and sophistication",
      visuals: "Slow graceful animations, high-contrast visuals, black/white/gold palette, classic serif fonts",
      music: "Classical, orchestral, smooth jazz",
      useCase: "Luxury brands, high-end products, premium services",
    },
  },
  {
    id: "inspirational",
    name: "Inspirational & Uplifting",
    iconName: "Heart",
    description: "Motivate and inspire",
    colorClass: "pink",
    tooltip: {
      purpose: "Create an emotional connection and motivate viewers",
      visuals: "Bright warm visuals, sunrises, drone shots, slow-motion effects, impactful quotes",
      music: "Soaring orchestral music, motivational piano",
      useCase: "Nonprofit campaigns, personal stories, motivational content",
    },
  },
  {
    id: "calm",
    name: "Calm & Relaxing",
    iconName: "Coffee",
    description: "Soothing and peaceful",
    colorClass: "emerald",
    tooltip: {
      purpose: "Create a peaceful, meditative viewing experience",
      visuals: "Slow pans, long takes of nature, satisfying processes, muted natural color palettes",
      music: "Ambient soundscapes, lo-fi beats, gentle nature sounds",
      useCase: "Meditation guides, relaxation videos, study-with-me content",
    },
  },
  {
    id: "playful",
    name: "Playful & Comedic",
    iconName: "Smile",
    description: "Fun and entertaining",
    colorClass: "red",
    tooltip: {
      purpose: "Entertain and make viewers laugh",
      visuals: "Bright primary colors, cartoonish animations, funny sound effects, meme-style editing",
      music: "Quirky, upbeat, ukulele or lighthearted tunes",
      useCase: "Comedy sketches, entertainment content, children's videos",
    },
  },
];
