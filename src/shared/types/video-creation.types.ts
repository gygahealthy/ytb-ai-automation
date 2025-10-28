export interface Prompt {
  id: string;
  text: string;
  order: number;
  selected?: boolean;
  showPreview?: boolean;
  profileId?: string; // Override global profile for this specific prompt
  projectId?: string; // Optional per-prompt project selection
  showProfileSelect?: boolean; // Toggle visibility of profile selector in row
}

export interface VideoResource {
  id: string;
  type: "image" | "video" | "audio" | "transcript";
  url: string;
  filename: string;
  createdAt: string;
}

export interface VideoCreationJob {
  id: string;
  promptId: string;
  promptText: string;
  generationId?: string; // ID from backend video generation record for polling
  status: "idle" | "processing" | "completed" | "failed";
  progress?: number;
  createdAt: string;
  completedAt?: string;
  videoUrl?: string;
  error?: string;
  resources?: VideoResource[];
}

export interface JsonDraft {
  id: string;
  name: string;
  prompts: Prompt[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoCreationState {
  prompts: Prompt[];
  jobs: VideoCreationJob[];
  drafts: JsonDraft[];
  history: {
    past: Prompt[][];
    future: Prompt[][];
  };
}

export interface VideoGeneration {
  id: string;
  profileId: string;
  projectId: string;
  sceneId: string;
  operationName: string;
  prompt: string;
  seed: number;
  aspectRatio: string;
  status: "pending" | "processing" | "completed" | "failed";
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl?: string;
  videoPath?: string;
  errorMessage?: string;
  rawResponse?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface VideoUpscale {
  id: string;
  sourceGenerationId: string; // References veo3_video_generations.id
  profileId: string;
  projectId: string;
  sceneId: string;
  operationName: string;
  status: "pending" | "processing" | "completed" | "failed";
  model: string; // e.g., "veo_2_1080p_upsampler_8s"
  seed?: number;
  aspectRatio?: string;
  mediaGenerationId?: string;
  fifeUrl?: string;
  servingBaseUri?: string;
  videoUrl?: string;
  videoPath?: string;
  errorMessage?: string;
  rawResponse?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
