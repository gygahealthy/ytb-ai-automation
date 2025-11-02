import { Play } from "lucide-react";

interface VideoOverlayProps {
  isPlaying: boolean;
  currentVideoTitle: string;
  currentVideoIndex: number;
  totalVideos: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  isSeeking?: boolean;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
}

export default function VideoOverlay({
  isPlaying,
  currentVideoTitle,
  currentVideoIndex,
  totalVideos,
  currentTime,
  duration,
  onPlay,
  isSeeking = false,
  currentFrame = 0,
  totalFrames = 0,
  fps = 30,
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

      {/* Frame info overlay during seeking */}
      {isSeeking && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-2xl border border-cyan-500/50">
            <div className="text-center space-y-1">
              <div className="text-cyan-400 text-xs font-medium uppercase tracking-wider">Frame</div>
              <div className="text-white text-3xl font-bold tabular-nums">{currentFrame}</div>
              <div className="text-gray-400 text-xs tabular-nums">
                / {totalFrames} frames @ {fps}fps
              </div>
              <div className="text-gray-500 text-xs tabular-nums mt-2">{currentTime.toFixed(3)}s</div>
            </div>
          </div>
        </div>
      )}

      {/* Play button overlay when paused */}
      {!isPlaying && !isSeeking && (
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
