import { useEffect, useState, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

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
}

export default function VideoSequencePlayer({ playlist, onCurrentVideoChange }: VideoSequencePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const prevPlaybackRef = useRef({ index: 0, time: 0, dur: 0 });

  const currentVideo = playlist.videos[currentVideoIndex];

  const handleVideoEnded = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setCurrentTime(0);
      setDuration(0); // Reset duration for next video
    } else {
      setCurrentVideoIndex(0);
      setCurrentTime(0);
      setDuration(0); // Reset duration when looping
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset playback state when changing videos
    setCurrentTime(0);
    setDuration(0);

    video.load();

    const handleLoadedData = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);

      // Immediately report the new video's duration
      if (onCurrentVideoChange) {
        onCurrentVideoChange(currentVideoIndex, 0, videoDuration);
      }

      if (isPlaying) {
        video.play().catch(console.error);
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);
    return () => video.removeEventListener("loadeddata", handleLoadedData);
  }, [currentVideoIndex, isPlaying, onCurrentVideoChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch((err) => {
        console.error("Play failed:", err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (onCurrentVideoChange) {
      const prev = prevPlaybackRef.current;
      const timeChanged = Math.abs(prev.time - currentTime) > 0.01;
      const indexChanged = prev.index !== currentVideoIndex;
      const durationChanged = Math.abs(prev.dur - duration) > 0.01;

      if (timeChanged || indexChanged || durationChanged) {
        prevPlaybackRef.current = { index: currentVideoIndex, time: currentTime, dur: duration };
        onCurrentVideoChange(currentVideoIndex, currentTime, duration);
      }
    }
  }, [currentVideoIndex, currentTime, duration, onCurrentVideoChange]);

  const handleReset = () => {
    setCurrentVideoIndex(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setCurrentTime(0);
    }
  };

  if (!currentVideo || playlist.videos.length === 0) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-black relative">
          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />

          <div className="relative z-10 text-center px-8 max-w-md">
            {/* Large play icon with gradient */}
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-inner">
              <Play className="w-12 h-12 text-gray-400 dark:text-gray-500 fill-gray-400 dark:fill-gray-500 ml-1" />
            </div>

            {/* Professional heading */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Preview Available</h3>

            {/* Descriptive text */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Add scenes to your timeline to get started. Your video sequence will appear here as you build your project.
            </p>

            {/* Subtle hint */}
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

        {/* Disabled controls bar to maintain layout consistency */}
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

  const totalProgress = ((currentVideoIndex + currentTime / (duration || 1)) / playlist.videos.length) * 100;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-black relative group overflow-hidden">
        <video
          ref={videoRef}
          src={currentVideo.url}
          onEnded={handleVideoEnded}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const videoDuration = e.currentTarget.duration;
            setDuration(videoDuration);
            // Report duration as soon as metadata is loaded
            if (onCurrentVideoChange) {
              onCurrentVideoChange(currentVideoIndex, currentTime, videoDuration);
            }
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold truncate">{currentVideo.title}</p>
              <p className="text-cyan-400 text-xs mt-1">
                Scene {currentVideoIndex + 1} of {playlist.videos.length}
              </p>
            </div>
            <div className="text-right text-gray-300 text-xs tabular-nums">
              <p>
                {Math.floor(currentTime)}s / {Math.floor(duration)}s
              </p>
            </div>
          </div>
        </div>
        {!isPlaying && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
            aria-label="Play"
          >
            <div className="w-20 h-20 rounded-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 flex items-center justify-center hover:scale-105 transition-all duration-200">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </button>
        )}
      </div>
      <div className="h-1 bg-gray-300 dark:bg-gray-700">
        <div className="h-full bg-cyan-500 dark:bg-cyan-600 transition-all duration-75" style={{ width: `${totalProgress}%` }} />
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentVideoIndex === 0}
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-white transition-colors"
              title="Previous video"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
              </svg>
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-md bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              disabled={currentVideoIndex === playlist.videos.length - 1}
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-white transition-colors"
              title="Next video"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white text-sm font-medium">
              <span className="text-cyan-600 dark:text-cyan-400">{currentVideoIndex + 1}</span>
              <span className="text-gray-600 dark:text-gray-400"> / {playlist.videos.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
