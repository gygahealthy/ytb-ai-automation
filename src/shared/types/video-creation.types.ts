export interface Prompt {
  id: string;
  text: string;
  order: number;
  selected?: boolean;
  showPreview?: boolean;
  profileId?: string; // Override global profile for this specific prompt
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
