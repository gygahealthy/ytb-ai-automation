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
  const [isSeeking, setIsSeeking] = useState(false);
  const seekPendingRef = useRef<{ videoIndex: 0 | 1; targetIndex: number; timeInVideo: number } | null>(null);

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

      // Don't update during seeking to prevent playhead jumping
      if (isSeeking) return;

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
    [activeVideoIndex, currentVideoIndex, playlist.videos, onCurrentVideoChange, nextVideoRef, isSeeking]
  );

  const switchToNextVideo = useCallback(() => {
    if (currentVideoIndex + 1 < playlist.videos.length) {
      const nextIndex = currentVideoIndex + 1;
      const nextVideoDuration = playlist.videos[nextIndex]?.duration || 0;

      // Immediately reset time to 0 for next video
      setCurrentTime(0);

      // Immediately notify parent to update playhead to start of next scene
      if (onCurrentVideoChange) {
        onCurrentVideoChange(nextIndex, 0, nextVideoDuration);
      }

      // Switch videos
      setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
      setCurrentVideoIndex(nextIndex);
    } else {
      setIsPlaying(false);
    }
  }, [currentVideoIndex, playlist.videos, onCurrentVideoChange]);

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
      const prevIndex = currentVideoIndex - 1;
      const prevVideoDuration = playlist.videos[prevIndex]?.duration || 0;

      // Immediately reset time to 0 for previous video
      setCurrentTime(0);

      // Immediately notify parent to update playhead to start of previous scene
      if (onCurrentVideoChange) {
        onCurrentVideoChange(prevIndex, 0, prevVideoDuration);
      }

      // Switch videos
      setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
      setCurrentVideoIndex(prevIndex);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      switchToNextVideo();
    }
  };

  const handleSeek = useCallback(
    (targetVideoIndex: number, timeInVideo: number, _isDragging: boolean = false) => {
      // Immediately update currentTime to prevent playhead jumping
      setCurrentTime(timeInVideo);

      // Get target video duration for the callback
      const targetDuration = playlist.videos[targetVideoIndex]?.duration || 0;

      // Immediately notify parent of the new position to update playhead
      if (onCurrentVideoChange) {
        onCurrentVideoChange(targetVideoIndex, timeInVideo, targetDuration);
      }

      // Immediately seek if same video
      if (targetVideoIndex === currentVideoIndex) {
        const activeVideo = activeVideoRef.current;
        if (activeVideo) {
          activeVideo.seek(timeInVideo);
        }
      } else {
        // Cross-video seek - hide videos, seek, wait for seeked event
        const needsToggle = Math.abs(targetVideoIndex - currentVideoIndex) % 2 === 1;
        const targetVideoRefIndex: 0 | 1 = needsToggle ? (activeVideoIndex === 0 ? 1 : 0) : activeVideoIndex;
        const targetRef = targetVideoRefIndex === 0 ? video1Ref : video2Ref;

        // Mark that we're seeking and store which video we're waiting for
        setIsSeeking(true);
        seekPendingRef.current = {
          videoIndex: targetVideoRefIndex,
          targetIndex: targetVideoIndex,
          timeInVideo: timeInVideo,
        };

        // Wait a frame for the video source to update in the render, then seek
        requestAnimationFrame(() => {
          if (targetRef.current && targetRef.current.getReadyState() >= 1) {
            // Video has loaded metadata, safe to seek
            targetRef.current.seek(timeInVideo);
          } else {
            // Video not ready yet, will seek when loadedmetadata fires
            // The seek will happen via the pending ref in handleLoadedMetadata
          }
        });
      }

      // Notify parent of seek
      if (onSeek) {
        onSeek(targetVideoIndex, timeInVideo);
      }
    },
    [currentVideoIndex, activeVideoRef, activeVideoIndex, video1Ref, video2Ref, onSeek, playlist.videos, onCurrentVideoChange]
  ); // Handle seeked event from video players
  const handleVideoSeeked = useCallback(
    (videoIndex: 0 | 1) => {
      // Check if this is the video we're waiting for
      if (seekPendingRef.current && seekPendingRef.current.videoIndex === videoIndex) {
        const { targetIndex } = seekPendingRef.current;
        const targetRef = videoIndex === 0 ? video1Ref : video2Ref;

        // Switch to the target video
        setActiveVideoIndex(videoIndex);
        setCurrentVideoIndex(targetIndex);
        setIsSeeking(false);
        seekPendingRef.current = null;

        // Update time and duration from the target video immediately
        if (targetRef.current) {
          const time = targetRef.current.getCurrentTime();
          const dur = targetRef.current.getDuration();
          setCurrentTime(time);
          setDuration(dur);

          // Notify parent to update playhead position
          if (onCurrentVideoChange) {
            onCurrentVideoChange(targetIndex, time, dur);
          }
        }
      }
    },
    [video1Ref, video2Ref, onCurrentVideoChange]
  ); // Expose methods to parent via ref
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
  // During seeking, use the pending target index for the target video
  let video1Index = activeVideoIndex === 0 ? currentVideoIndex : currentVideoIndex + 1;
  let video2Index = activeVideoIndex === 1 ? currentVideoIndex : currentVideoIndex + 1;

  if (seekPendingRef.current) {
    // If seeking, assign the target index to the correct video element
    if (seekPendingRef.current.videoIndex === 0) {
      video1Index = seekPendingRef.current.targetIndex;
    } else {
      video2Index = seekPendingRef.current.targetIndex;
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="relative flex-1 bg-black flex items-center justify-center group">
        <VideoPlayer
          ref={video1Ref}
          src={playlist.videos[video1Index]?.url || ""}
          isActive={activeVideoIndex === 0}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
            isSeeking ? "opacity-0 duration-0" : activeVideoIndex === 0 ? "opacity-100 duration-300" : "opacity-0 duration-300"
          } ${activeVideoIndex === 0 ? "z-10" : "z-0"}`}
          isMuted={isMuted}
          onTimeUpdate={(time, dur) => handleTimeUpdate(0, time, dur)}
          onEnded={() => handleVideoEnd(0)}
          onLoadedMetadata={(dur) => {
            setDuration(dur);
            // If there's a pending seek for this video, perform it now
            if (seekPendingRef.current && seekPendingRef.current.videoIndex === 0 && video1Ref.current) {
              video1Ref.current.seek(seekPendingRef.current.timeInVideo);
            }
          }}
          onSeeked={() => handleVideoSeeked(0)}
        />
        <VideoPlayer
          ref={video2Ref}
          src={playlist.videos[video2Index]?.url || ""}
          isActive={activeVideoIndex === 1}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
            isSeeking ? "opacity-0 duration-0" : activeVideoIndex === 1 ? "opacity-100 duration-300" : "opacity-0 duration-300"
          } ${activeVideoIndex === 1 ? "z-10" : "z-0"}`}
          isMuted={isMuted}
          onTimeUpdate={(time, dur) => handleTimeUpdate(1, time, dur)}
          onEnded={() => handleVideoEnd(1)}
          onLoadedMetadata={(dur) => {
            if (activeVideoIndex === 1) setDuration(dur);
            // If there's a pending seek for this video, perform it now
            if (seekPendingRef.current && seekPendingRef.current.videoIndex === 1 && video2Ref.current) {
              video2Ref.current.seek(seekPendingRef.current.timeInVideo);
            }
          }}
          onSeeked={() => handleVideoSeeked(1)}
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
