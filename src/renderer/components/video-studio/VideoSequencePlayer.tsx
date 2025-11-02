import React, { useRef, useState, useEffect, useCallback } from "react";
import VideoPlayer, { VideoPlayerHandle } from "./video-preview-player/VideoPlayer";
import PlayerControls from "./video-preview-player/PlayerControls";
import ProgressBar from "./video-preview-player/ProgressBar";
import VideoOverlay from "./video-preview-player/VideoOverlay";
import { Play, RotateCcw, VolumeX } from "lucide-react";

interface VideoSequencePlaylist {
  videos: Array<{
    id: string;
    url: string;
    title: string;
    duration?: number;
  }>;
}

interface VideoSequencePlayerProps {
  playlist: VideoSequencePlaylist;
  onCurrentVideoChange?: (index: number, currentTime: number, duration: number) => void;
  onSeek?: (videoIndex: number, time: number) => void;
}

const VideoSequencePlayer = React.forwardRef<
  { play: () => void; pause: () => void; seek: (time: number) => void },
  VideoSequencePlayerProps
>(({ playlist, onCurrentVideoChange, onSeek }, ref) => {
  const video1Ref = useRef<VideoPlayerHandle>(null);
  const video2Ref = useRef<VideoPlayerHandle>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<0 | 1>(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const activeVideoRef = activeVideoIndex === 0 ? video1Ref : video2Ref;
  const nextVideoRef = activeVideoIndex === 0 ? video2Ref : video1Ref;

  // Handle play/pause
  useEffect(() => {
    if (playlist.videos.length === 0) return;

    const activeVideo = activeVideoRef.current;
    if (!activeVideo) return;

    if (isPlaying && activeVideo.getReadyState() >= 2) {
      activeVideo.play().catch((error: Error) => {
        if (error.name !== "AbortError") {
          console.error("Video playback failed:", error);
        }
      });
    } else if (!isPlaying) {
      activeVideo.pause();
    }
  }, [isPlaying, playlist.videos.length, activeVideoRef, activeVideoIndex, currentVideoIndex]);

  const handleTimeUpdate = useCallback(
    (videoIndex: number, time: number, dur: number) => {
      if (videoIndex !== activeVideoIndex) return;

      setCurrentTime(time);
      setDuration(dur);

      // Preload next video at 80%
      if (time / dur > 0.8 && currentVideoIndex + 1 < playlist.videos.length) {
        const nextVideo = nextVideoRef.current;
        if (nextVideo && nextVideo.getReadyState() < 2) {
          // Trigger load by accessing the video element (handled in VideoPlayer component)
        }
      }

      // Invoke callback directly for smooth updates
      if (onCurrentVideoChange) {
        onCurrentVideoChange(currentVideoIndex, time, dur);
      }
    },
    [activeVideoIndex, currentVideoIndex, playlist.videos, onCurrentVideoChange, nextVideoRef]
  );

  const switchToNextVideo = useCallback(() => {
    if (currentVideoIndex + 1 < playlist.videos.length) {
      setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
      setCurrentVideoIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentVideoIndex, playlist.videos.length]);

  const handleVideoEnd = useCallback(
    (videoIndex: number) => {
      if (videoIndex === activeVideoIndex) {
        switchToNextVideo();
      }
    },
    [activeVideoIndex, switchToNextVideo]
  );

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleReset = () => {
    setActiveVideoIndex(0);
    setCurrentVideoIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    if (video1Ref.current) {
      video1Ref.current.seek(0);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
      setCurrentVideoIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      switchToNextVideo();
    }
  };

  const handleSeek = useCallback(
    (targetVideoIndex: number, timeInVideo: number) => {
      // Switch to target video if different
      if (targetVideoIndex !== currentVideoIndex) {
        const needsToggle = Math.abs(targetVideoIndex - currentVideoIndex) % 2 === 1;
        if (needsToggle) {
          setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
        }
        setCurrentVideoIndex(targetVideoIndex);
      }

      // Seek to time in that video
      setTimeout(() => {
        const activeVideo = activeVideoRef.current;
        if (activeVideo) {
          activeVideo.seek(timeInVideo);
        }
      }, 50);

      // Notify parent of seek
      if (onSeek) {
        onSeek(targetVideoIndex, timeInVideo);
      }
    },
    [currentVideoIndex, activeVideoRef, onSeek]
  );

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    seek: (time: number) => {
      // Find which video contains this timestamp
      let accumulated = 0;
      for (let i = 0; i < playlist.videos.length; i++) {
        const videoDuration = playlist.videos[i].duration || 0;
        if (accumulated + videoDuration >= time) {
          const timeInVideo = time - accumulated;
          handleSeek(i, timeInVideo);
          break;
        }
        accumulated += videoDuration;
      }
    },
  }));

  // Empty state
  if (playlist.videos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-black relative">
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />

          <div className="relative z-10 text-center px-8 max-w-md">
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-inner">
              <Play className="w-12 h-12 text-gray-400 dark:text-gray-500 fill-gray-400 dark:fill-gray-500 ml-1" />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Preview Available</h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Add scenes to your timeline to get started. Your video sequence will appear here as you build your project.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/50">
              <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Click "Add Scene" to begin</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 opacity-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                disabled
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
                </svg>
              </button>
              <button
                disabled
                className="p-3 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                disabled
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
              <button
                disabled
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
              >
                <VolumeX className="w-5 h-5" />
              </button>
              <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-400 dark:text-gray-600 text-sm font-medium">
                <span>0</span>
                <span> / 0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = playlist.videos[currentVideoIndex];
  const videoDurations = playlist.videos.map((v) => v.duration || 0);

  // Determine which video index each video element should display
  const video1Index = activeVideoIndex === 0 ? currentVideoIndex : currentVideoIndex + 1;
  const video2Index = activeVideoIndex === 1 ? currentVideoIndex : currentVideoIndex + 1;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="relative flex-1 bg-black flex items-center justify-center group">
        <VideoPlayer
          ref={video1Ref}
          src={playlist.videos[video1Index]?.url || ""}
          isActive={activeVideoIndex === 0}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            activeVideoIndex === 0 ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          isMuted={isMuted}
          onTimeUpdate={(time, dur) => handleTimeUpdate(0, time, dur)}
          onEnded={() => handleVideoEnd(0)}
          onLoadedMetadata={(dur) => setDuration(dur)}
        />
        <VideoPlayer
          ref={video2Ref}
          src={playlist.videos[video2Index]?.url || ""}
          isActive={activeVideoIndex === 1}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            activeVideoIndex === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          isMuted={isMuted}
          onTimeUpdate={(time, dur) => handleTimeUpdate(1, time, dur)}
          onEnded={() => handleVideoEnd(1)}
          onLoadedMetadata={(dur) => {
            if (activeVideoIndex === 1) setDuration(dur);
          }}
        />

        <VideoOverlay
          isPlaying={isPlaying}
          currentVideoTitle={currentVideo.title}
          currentVideoIndex={currentVideoIndex}
          totalVideos={playlist.videos.length}
          currentTime={currentTime}
          duration={duration}
          onPlay={handlePlayPause}
        />
      </div>

      <ProgressBar
        currentVideoIndex={currentVideoIndex}
        videoDurations={videoDurations}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      <PlayerControls
        isPlaying={isPlaying}
        isMuted={isMuted}
        currentVideoIndex={currentVideoIndex}
        totalVideos={playlist.videos.length}
        currentTime={currentTime}
        duration={duration}
        canGoPrevious={currentVideoIndex > 0}
        canGoNext={currentVideoIndex < playlist.videos.length - 1}
        onPlayPause={handlePlayPause}
        onMuteToggle={handleMuteToggle}
        onReset={handleReset}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  );
});

VideoSequencePlayer.displayName = "VideoSequencePlayer";

export default VideoSequencePlayer;
