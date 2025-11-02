import React, { createContext, useContext, useState, useCallback } from "react";

interface VideoPlayerState {
  // Playback state
  isPlaying: boolean;
  isMuted: boolean;
  currentVideoIndex: number;
  currentTime: number;
  duration: number;

  // Seeking/dragging state
  isSeeking: boolean;
  isDragging: boolean;

  // Frame information
  currentFrame: number;
  totalFrames: number;
  fps: number;

  // Video sequence info
  videoDurations: number[];
  totalDuration: number;
  globalTime: number; // Accumulated time across all videos
}

interface VideoPlayerContextValue {
  state: VideoPlayerState;

  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  toggleMute: () => void;

  // Seeking controls
  startSeeking: () => void;
  endSeeking: () => void;
  startDragging: () => void;
  endDragging: () => void;

  // Update functions
  updatePlaybackPosition: (videoIndex: number, time: number, dur: number) => void;
  updateVideoDurations: (durations: number[]) => void;
  setCurrentVideoIndex: (index: number) => void;

  // Seek to specific position
  seekToPosition: (videoIndex: number, time: number) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | undefined>(undefined);

interface VideoPlayerProviderProps {
  children: React.ReactNode;
  fps?: number;
}

export function VideoPlayerProvider({ children, fps = 24 }: VideoPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoDurations, setVideoDurations] = useState<number[]>([]);

  // Calculate derived values
  const totalDuration = videoDurations.reduce((sum, dur) => sum + dur, 0);
  const accumulatedTimeBeforeCurrent = videoDurations.slice(0, currentVideoIndex).reduce((sum, dur) => sum + dur, 0);
  const globalTime = accumulatedTimeBeforeCurrent + currentTime;
  const currentFrame = Math.floor(globalTime * fps);
  const totalFrames = Math.floor(totalDuration * fps);

  const state: VideoPlayerState = {
    isPlaying,
    isMuted,
    currentVideoIndex,
    currentTime,
    duration,
    isSeeking,
    isDragging,
    currentFrame,
    totalFrames,
    fps,
    videoDurations,
    totalDuration,
    globalTime,
  };

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlayPause = useCallback(() => setIsPlaying((prev) => !prev), []);
  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  const startSeeking = useCallback(() => setIsSeeking(true), []);
  const endSeeking = useCallback(() => setIsSeeking(false), []);
  const startDragging = useCallback(() => {
    setIsDragging(true);
    setIsSeeking(true);
  }, []);
  const endDragging = useCallback(() => {
    setIsDragging(false);
    setIsSeeking(false);
  }, []);

  const updatePlaybackPosition = useCallback((videoIndex: number, time: number, dur: number) => {
    setCurrentVideoIndex(videoIndex);
    setCurrentTime(time);
    setDuration(dur);
  }, []);

  const updateVideoDurations = useCallback((durations: number[]) => {
    setVideoDurations(durations);
  }, []);

  const seekToPosition = useCallback((videoIndex: number, time: number) => {
    setCurrentVideoIndex(videoIndex);
    setCurrentTime(time);
  }, []);

  const value: VideoPlayerContextValue = {
    state,
    play,
    pause,
    togglePlayPause,
    toggleMute,
    startSeeking,
    endSeeking,
    startDragging,
    endDragging,
    updatePlaybackPosition,
    updateVideoDurations,
    setCurrentVideoIndex,
    seekToPosition,
  };

  return <VideoPlayerContext.Provider value={value}>{children}</VideoPlayerContext.Provider>;
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
}
