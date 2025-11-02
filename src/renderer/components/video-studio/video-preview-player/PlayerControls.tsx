import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface PlayerControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentVideoIndex: number;
  totalVideos: number;
  currentTime: number;
  duration: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
}

export default function PlayerControls({
  isPlaying,
  isMuted,
  currentVideoIndex,
  totalVideos,
  currentTime,
  duration,
  canGoPrevious,
  canGoNext,
  onPlayPause,
  onMuteToggle,
  onPrevious,
  onNext,
  onReset,
}: PlayerControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3">
      <div className="flex items-center justify-center gap-4">
        {/* Left side: mute and video indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMuteToggle}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white text-sm font-medium">
            <span className="text-cyan-600 dark:text-cyan-400">{currentVideoIndex + 1}</span>
            <span className="text-gray-600 dark:text-gray-400"> / {totalVideos}</span>
          </div>
        </div>

        {/* Center: main control buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-white transition-colors"
            title="Previous video"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
            </svg>
          </button>
          <button
            onClick={onPlayPause}
            className="p-3 rounded-md bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-white transition-colors"
            title="Next video"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors"
            title="Reset to start"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Right side: time display */}
        <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white text-sm font-medium tabular-nums">
          <span className="text-cyan-600 dark:text-cyan-400">{formatTime(currentTime)}</span>
          <span className="text-gray-600 dark:text-gray-400"> / {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
