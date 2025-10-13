import { ID } from "../../../shared/types";

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

// ============= Channel Deep Dive Types =============

export interface ChannelDeepDive {
  id: ID;
  channelId: string;
  strategyMarkdown?: string; // Markdown formatted strategy
  uspMarkdown?: string; // Unique Selling Proposition
  targetAudience?: TargetAudience;
  contentPillars?: string[]; // Array of content themes/pillars
  toneAndStyle?: string; // Brand voice description
  goals?: ChannelGoal[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetAudience {
  demographics?: string; // Age, gender, location, etc.
  interests?: string[];
  painPoints?: string[];
  desires?: string[];
}

export interface ChannelGoal {
  title: string;
  description?: string;
  targetDate?: string;
  type: 'short-term' | 'long-term';
  status?: 'pending' | 'in-progress' | 'completed';
}

export interface CreateDeepDiveInput {
  channelId: string;
  strategyMarkdown?: string;
  uspMarkdown?: string;
  targetAudience?: TargetAudience;
  contentPillars?: string[];
  toneAndStyle?: string;
  goals?: ChannelGoal[];
  notes?: string;
}

export interface UpdateDeepDiveInput {
  strategyMarkdown?: string;
  uspMarkdown?: string;
  targetAudience?: TargetAudience;
  contentPillars?: string[];
  toneAndStyle?: string;
  goals?: ChannelGoal[];
  notes?: string;
}

// ============= Playlist Types =============

export interface ChannelPlaylist {
  id: ID;
  channelId: string;
  playlistId?: string; // YouTube playlist ID (optional)
  name: string;
  description?: string;
  videoCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistVideo {
  id: ID;
  playlistId: string;
  videoId: string;
  position?: number;
  addedAt: Date;
}

export interface CreatePlaylistInput {
  channelId: string;
  playlistId?: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  playlistId?: string;
  isPublic?: boolean;
}

// ============= Competitor Types =============

export interface ChannelCompetitor {
  id: ID;
  channelId: string; // Our channel
  competitorChannelId: string; // Competitor's YouTube channel ID
  competitorName: string;
  competitorUrl: string;
  subscriberCount?: number;
  avgViews?: number;
  uploadFrequency?: string; // 'daily', 'weekly', '2-3x/week', etc.
  notes?: string;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompetitorInput {
  channelId: string;
  competitorChannelId: string;
  competitorName: string;
  competitorUrl: string;
  uploadFrequency?: string;
  notes?: string;
}

export interface UpdateCompetitorInput {
  competitorName?: string;
  competitorUrl?: string;
  subscriberCount?: number;
  avgViews?: number;
  uploadFrequency?: string;
  notes?: string;
}

// ============= Performance Metrics Types =============

export interface ChannelPerformance {
  id: ID;
  channelId: string;
  metricDate: string; // YYYY-MM-DD
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo?: number;
  engagementRate?: number; // Percentage
  dailyViews?: number;
  dailySubscribers?: number;
  createdAt: Date;
}

export interface CreatePerformanceInput {
  channelId: string;
  metricDate: string;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  avgViewsPerVideo?: number;
  engagementRate?: number;
  dailyViews?: number;
  dailySubscribers?: number;
}

export interface PerformanceMetrics {
  current: ChannelPerformance;
  previous?: ChannelPerformance;
  growth: {
    subscribers: number;
    views: number;
    videos: number;
  };
}

// ============= Topic Planning Types =============

export interface ChannelTopic {
  id: ID;
  channelId: string;
  topicTitle: string;
  topicDescription?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'idea' | 'planned' | 'in_progress' | 'completed' | 'archived';
  targetDate?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTopicInput {
  channelId: string;
  topicTitle: string;
  topicDescription?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'idea' | 'planned' | 'in_progress' | 'completed' | 'archived';
  targetDate?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateTopicInput {
  topicTitle?: string;
  topicDescription?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'idea' | 'planned' | 'in_progress' | 'completed' | 'archived';
  targetDate?: string;
  tags?: string[];
  notes?: string;
}

// ============= Complete Channel View Type =============

export interface ChannelCompleteView {
  channel: YoutubeChannel;
  deepDive?: ChannelDeepDive;
  playlists: ChannelPlaylist[];
  competitors: ChannelCompetitor[];
  performance?: PerformanceMetrics;
  recentVideos: VideoAnalysis[];
  upcomingTopics: ChannelTopic[];
  assignedPrompts: number; // Count of prompts assigned to this channel
}