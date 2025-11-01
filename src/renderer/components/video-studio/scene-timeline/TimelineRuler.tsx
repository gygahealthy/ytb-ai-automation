interface TimelineRulerProps {
  totalDuration: number;
  timelineWidth: number;
  hasScenes: boolean;
}

export default function TimelineRuler({ totalDuration, timelineWidth, hasScenes }: TimelineRulerProps) {
  // If no scenes, show a default 60-second timeline
  const displayDuration = hasScenes ? totalDuration : 60;
  const effectiveWidth = hasScenes ? timelineWidth : 800;

  // Calculate pixels per second based on actual scene durations and card widths
  const pixelsPerSecond = hasScenes && displayDuration > 0 ? effectiveWidth / displayDuration : effectiveWidth / 60;

  // Generate enough marks to cover the entire scrollable width
  // For 3 scenes of 8s each = 24s total, we need marks from 0 to at least 24
  // Add extra marks to fill the full width and beyond (3x the duration)
  const numMarks = Math.ceil(displayDuration * 3) + 1;

  return (
    <div className="relative h-10 mb-0 bg-gray-50 dark:bg-gray-900/50 rounded-t border-b-2 border-gray-300 dark:border-gray-700 overflow-visible pl-2 pr-2">
      {/* Generate timeline marks - positioned starting from the pl-2 padding area */}
      {Array.from({ length: numMarks }).map((_, i) => {
        const timeInSeconds = i;
        // Position marks using pixels per second calculation
        // Add 8px (pl-2) so marks start from within the padding area where cards begin
        const pixelPosition = timeInSeconds * pixelsPerSecond + 8;
        const isMajorMark = i % 5 === 0; // Major mark every 5 seconds

        return (
          <div key={i} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${pixelPosition}px` }}>
            {/* Time label - show above tick for major marks */}
            {isMajorMark && (
              <span className="absolute bottom-full mb-1 text-[11px] text-gray-700 dark:text-gray-300 font-semibold tabular-nums whitespace-nowrap">
                {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, "0")}
              </span>
            )}
            {/* Tick mark - taller for major marks */}
            <div
              className={`${isMajorMark ? "w-0.5 h-4 bg-gray-600 dark:bg-gray-400" : "w-px h-2 bg-gray-400 dark:bg-gray-600"}`}
            />
          </div>
        );
      })}
    </div>
  );
}
