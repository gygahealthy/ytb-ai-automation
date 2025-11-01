import { Film, Clock, CheckCircle2, Plus } from "lucide-react";
import React from "react";

export interface Scene {
  id: string;
  text: string;
  order: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

interface SceneTimelineProps {
  scenes: Scene[];
  selectedIndex: number;
  onSceneSelect: (index: number) => void;
  currentVideoIndex?: number;
  currentTime?: number;
  duration?: number;
}

export default function SceneTimeline({
  scenes,
  selectedIndex,
  onSceneSelect,
  currentVideoIndex = 0,
  currentTime = 0,
  duration = 0,
}: SceneTimelineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Store actual video durations as they are discovered during playback
  const [actualDurations, setActualDurations] = React.useState<Map<number, number>>(new Map());

  // Dynamically measure card dimensions from the DOM
  const [cardDimensions, setCardDimensions] = React.useState({ width: 160, gap: 8 });

  // Measure actual card dimensions on mount and when scenes change
  React.useEffect(() => {
    if (containerRef.current && scenes.length > 0) {
      const firstCard = containerRef.current.querySelector("button");
      if (firstCard) {
        // Use computed style to get the base width (without scale transforms)
        const computedStyle = window.getComputedStyle(firstCard);
        const width = parseFloat(computedStyle.width);

        // Get computed gap from flex container
        const containerStyle = window.getComputedStyle(containerRef.current);
        const gap = parseFloat(containerStyle.gap) || 8;

        setCardDimensions({
          width: width,
          gap: gap,
        });
      }
    }
  }, [scenes.length]);

  // Update actual duration when player reports it
  React.useEffect(() => {
    if (duration > 0 && currentVideoIndex >= 0 && currentVideoIndex < scenes.length) {
      setActualDurations((prev) => {
        const next = new Map(prev);
        next.set(currentVideoIndex, duration);
        return next;
      });
    }
  }, [currentVideoIndex, duration, scenes.length]);

  // Calculate playhead position based on actual measured card dimensions
  const progressInCurrentScene = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;

  // Clamp currentVideoIndex to valid range [0, scenes.length - 1]
  const clampedIndex = scenes.length > 0 ? Math.min(Math.max(currentVideoIndex, 0), scenes.length - 1) : 0;

  // Use measured card dimensions for accurate positioning
  const { width: cardWidth, gap: gapWidth } = cardDimensions;

  // Calculate position: each card takes (width + gap), then add progress within current card
  const playheadPosition = clampedIndex * (cardWidth + gapWidth) + progressInCurrentScene * cardWidth;

  // Format time as MM:SS:MS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${ms.toString().padStart(2, "0")}`;
  };

  // Calculate elapsed time using ACTUAL durations from playback, not hardcoded values
  // This ensures timeline stays in sync with player even during transitions/loading
  const elapsedTime = scenes.slice(0, currentVideoIndex).reduce((sum, _scene, idx) => {
    // Use actual duration if known, otherwise use scene.duration as fallback
    const actualDur = actualDurations.get(idx);
    return sum + (actualDur ?? scenes[idx]?.duration ?? 6);
  }, 0);

  // Total duration uses actual durations where known, fallback to scene.duration
  const totalDuration = scenes.reduce((sum, scene, idx) => {
    const actualDur = actualDurations.get(idx);
    return sum + (actualDur ?? scene.duration ?? 6);
  }, 0);

  return (
    <div className="px-4 py-3">
      {/* Timeline with playhead indicator */}
      <div className="relative">
        {/* Horizontal scrollable timeline */}
        <div className="overflow-x-auto overflow-y-visible">
          <div ref={containerRef} className="flex gap-2 pb-1 pt-4 relative" style={{ minWidth: "max-content" }}>
            {scenes.length > 0 ? (
              scenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={index}
                  isSelected={index === selectedIndex}
                  onClick={() => onSceneSelect(index)}
                  isCurrentlyPlaying={index === currentVideoIndex}
                />
              ))
            ) : (
              <AddSceneCard />
            )}

            {/* Playhead indicator - vertical line showing current playback position */}
            {scenes.length > 0 && (
              <div
                className="absolute w-1 bg-gradient-to-b from-cyan-500 via-blue-500 to-cyan-500 dark:from-cyan-400 dark:via-blue-500 dark:to-cyan-400 shadow-lg shadow-cyan-400/60 dark:shadow-cyan-500/50 pointer-events-none transition-all duration-100 rounded-full"
                style={{
                  left: `${playheadPosition}px`,
                  top: "0",
                  bottom: "0",
                  zIndex: 50,
                }}
              >
                {/* Playhead marker circle at top */}
                <div
                  className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-400 dark:to-blue-500 border-2 border-white dark:border-gray-900 shadow-xl shadow-cyan-400/80 dark:shadow-cyan-500/70 animate-pulse"
                  style={{
                    top: "-8px",
                    left: "-10px",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Time display below timeline */}
        {scenes.length > 0 && (
          <div className="mt-2 px-2 flex justify-between items-center text-xs text-gray-700 dark:text-gray-400 font-semibold tabular-nums">
            <span className="px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700/50">
              {formatTime(elapsedTime + currentTime)}
            </span>
            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              {formatTime(totalDuration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface SceneCardProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  isCurrentlyPlaying?: boolean;
  onClick: () => void;
}

function AddSceneCard() {
  return (
    <button className="relative flex-shrink-0 w-40 rounded-lg border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all overflow-hidden group bg-gray-100 dark:bg-gray-800/50 shadow-sm hover:shadow-md">
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-500 dark:text-gray-500">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors border border-gray-400 dark:border-gray-600 group-hover:border-cyan-400 dark:group-hover:border-cyan-500">
            <Plus className="w-5 h-5 group-hover:text-cyan-600 dark:group-hover:text-cyan-500 transition-colors" />
          </div>
          <span className="text-xs font-semibold">Add Scene</span>
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white text-xs">
          <Clock className="w-3 h-3" />
          <span>8s</span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-left">Click to add scene</p>
      </div>
    </button>
  );
}

function SceneCard({ scene, index, isSelected, isCurrentlyPlaying, onClick }: SceneCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-40 rounded-lg border-2 transition-all overflow-hidden group
        ${
          isSelected
            ? "border-cyan-500 dark:border-cyan-500 shadow-xl shadow-cyan-400/50 dark:shadow-cyan-500/40 scale-105 ring-2 ring-cyan-300 dark:ring-cyan-500/50"
            : isCurrentlyPlaying
            ? "border-blue-500 dark:border-blue-500 shadow-xl shadow-blue-400/50 dark:shadow-blue-500/40 ring-2 ring-blue-300 dark:ring-blue-500/50"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg shadow-sm"
        }
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <video src={scene.videoUrl} className="w-full h-full object-cover" />

        {/* Overlay gradient */}
        <div
          className={`absolute inset-0 ${
            isCurrentlyPlaying
              ? "bg-gradient-to-t from-blue-900/40 to-transparent"
              : "bg-gradient-to-t from-black/60 to-transparent"
          }`}
        />

        {/* Scene number badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
          Scene {index + 1}
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs">
          <Clock className="w-3 h-3" />
          <span>{scene.duration}s</span>
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 animate-pulse">
              <div className="w-full h-full rounded-full bg-blue-500/20 animate-pulse" />
            </div>
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute bottom-2 right-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 fill-current" />
          </div>
        )}
      </div>

      {/* Info section */}
      <div
        className={`p-2 border-t ${
          isCurrentlyPlaying
            ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-300 dark:border-blue-700"
            : isSelected
            ? "bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-300 dark:border-cyan-700"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        }`}
      >
        <p
          className={`text-xs font-semibold line-clamp-2 text-left ${
            isSelected
              ? "text-cyan-700 dark:text-cyan-400"
              : isCurrentlyPlaying
              ? "text-blue-700 dark:text-blue-400"
              : "text-gray-800 dark:text-gray-300"
          }`}
          title={scene.text}
        >
          {scene.text || "Untitled Scene"}
        </p>
      </div>

      {/* Selection ring with glow */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-cyan-400 dark:ring-cyan-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-cyan-400/10 dark:bg-cyan-500/10 animate-pulse" />
        </div>
      )}
    </button>
  );
}
