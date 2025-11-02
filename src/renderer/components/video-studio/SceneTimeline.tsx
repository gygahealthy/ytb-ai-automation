import React from "react";
import TimeDisplay from "./scene-timeline/TimeDisplay";
import TimelineRuler from "./scene-timeline/TimelineRuler";
import Playhead from "./scene-timeline/Playhead";
import { SceneCard, AddSceneCard, type Scene } from "./scene-timeline/SceneCard";

export type { Scene };

interface SceneTimelineProps {
  scenes: Scene[];
  selectedIndex: number;
  onSceneSelect: (index: number) => void;
  onSeek?: (videoIndex: number, time: number) => void;
  currentVideoIndex?: number;
  currentTime?: number;
  duration?: number;
}

export default function SceneTimeline({
  scenes,
  selectedIndex,
  onSceneSelect,
  onSeek,
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

  // Calculate position: cards are spaced with gaps (gap-2 = 8px)
  // Position = (cardWidth + gap) * cardIndex + progressInCard * cardWidth
  const playheadPosition = clampedIndex * (cardWidth + gapWidth) + progressInCurrentScene * cardWidth;

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

  // Calculate timeline width for ruler - needs to match the scrollable content width
  // Account for the padding (pl-2 + pr-2 = 16px total) in the scenes container
  const timelineWidth = scenes.length > 0 ? (cardWidth + gapWidth) * scenes.length : 800;

  // Handle click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || scenes.length === 0) return;

    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));

    // Calculate which video and what time within that video
    let accumulatedTime = 0;
    let targetVideoIndex = 0;
    let targetTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      const sceneDuration = actualDurations.get(i) ?? scenes[i].duration ?? 6;
      if (accumulatedTime + sceneDuration >= totalDuration * percentage) {
        targetVideoIndex = i;
        targetTime = Math.max(0, totalDuration * percentage - accumulatedTime);
        break;
      }
      accumulatedTime += sceneDuration;
    }

    // Notify parent of seek
    onSeek(targetVideoIndex, targetTime);
  };

  return (
    <div className="px-4 py-4 flex items-start gap-4 min-h-[180px]">
      {/* Time display on the left */}
      <TimeDisplay currentTime={elapsedTime + currentTime} totalTime={totalDuration} />

      {/* Timeline container */}
      <div className="flex-1">
        {/* Timeline with playhead indicator - this container holds both ruler and scenes */}
        <div className="relative">
          {/* Timeline Ruler - show even when no scenes */}
          <TimelineRuler totalDuration={totalDuration} timelineWidth={timelineWidth} hasScenes={scenes.length > 0} />

          {/* Horizontal scrollable timeline */}
          <div className="overflow-x-auto overflow-y-visible">
            <div
              ref={containerRef}
              className="flex gap-2 pb-2 pt-6 relative bg-gray-50 dark:bg-gray-900/30 rounded-b pl-2 pr-2 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
              style={{ minWidth: scenes.length > 0 ? "max-content" : "800px" }}
              onClick={handleTimelineClick}
              title="Click to seek to time"
            >
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
            </div>
          </div>

          {/* Playhead indicator - positioned relative to the timeline container (includes ruler) */}
          <Playhead position={playheadPosition} hasScenes={scenes.length > 0} />
        </div>
      </div>
    </div>
  );
}
