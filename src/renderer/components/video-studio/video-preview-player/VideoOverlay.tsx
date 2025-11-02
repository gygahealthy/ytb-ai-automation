import { Play } from "lucide-react";

interface VideoOverlayProps {
  isPlaying: boolean;
  currentVideoTitle: string;
  currentVideoIndex: number;
  totalVideos: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
}

export default function VideoOverlay({
  isPlaying,
  currentVideoTitle,
  currentVideoIndex,
  totalVideos,
  currentTime,
  duration,
  onPlay,
}: VideoOverlayProps) {
  return (
    <>
      {/* Info overlay on hover */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold truncate">{currentVideoTitle}</p>
            <p className="text-cyan-400 text-xs mt-1">
              Scene {currentVideoIndex + 1} of {totalVideos}
            </p>
          </div>
          <div className="text-right text-gray-300 text-xs tabular-nums">
            <p>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </p>
          </div>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!isPlaying && (
        <button
          onClick={onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 flex items-center justify-center hover:scale-105 transition-all duration-200">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}
    </>
  );
}
