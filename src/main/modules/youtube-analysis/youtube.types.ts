import { ID } from "../../../types";

// ============= YouTube Types =============
export interface YoutubeChannel {
  id: ID;
  channelId: string;
  channelName: string;
  channelUrl: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAnalysis {
  id: ID;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  channelId: string;
  views: number;
  likes: number;
  comments: number;
  duration: number; // seconds
  publishedAt: Date;
  analyzedAt: Date;
  createdAt: Date;
}

export interface CreateChannelInput {
  channelId: string;
  channelName: string;
  channelUrl: string;
}