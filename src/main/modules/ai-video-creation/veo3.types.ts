import { ID } from "../../../shared/types";

// ============= VEO3 Types =============
export interface VEO3Project {
  id: ID;
  projectId: string;
  profileId: ID;
  name: string;
  status: "draft" | "processing" | "completed" | "failed";
  scenes: VideoScene[];
  jsonPrompt?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoScene {
  id: ID;
  scene: string;
  segment: string;
  image?: string;
}

export interface CreateVEO3ProjectInput {
  projectId: string;
  profileId: ID;
  name: string;
  scenes: Omit<VideoScene, "id">[];
  jsonPrompt?: Record<string, any>;
}

