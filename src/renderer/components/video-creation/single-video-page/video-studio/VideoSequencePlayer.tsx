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
    } else {
      setCurrentVideoIndex(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();

    const handleLoadedData = () => {
      setDuration(video.duration);
      if (isPlaying) {
        video.play().catch(console.error);
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);
    return () => video.removeEventListener("loadeddata", handleLoadedData);
  }, [currentVideoIndex, isPlaying]);

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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg">
        <div className="text-center">
          <p className="text-gray-400 text-sm">No videos to play</p>
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
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
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
