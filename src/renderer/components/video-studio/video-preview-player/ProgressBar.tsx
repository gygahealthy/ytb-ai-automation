import { useRef, useState, useEffect, useCallback } from "react";

interface ProgressBarProps {
  currentVideoIndex: number;
  currentTime: number;
  videoDurations: number[];
  onSeek: (videoIndex: number, time: number, isDragging?: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ProgressBar({
  currentVideoIndex,
  currentTime,
  videoDurations,
  onSeek,
  onDragStart,
  onDragEnd,
}: ProgressBarProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const dragStateRef = useRef({
    isDragging: false,
    lastClientX: 0,
    rafId: null as number | null,
    lastSeekTime: 0,
  });

  // Calculate total duration of all videos
  const totalDuration = videoDurations.reduce((sum, dur) => sum + dur, 0);

  // Calculate elapsed time up to current video
  const elapsedBeforeCurrent = videoDurations.slice(0, currentVideoIndex).reduce((sum, dur) => sum + dur, 0);

  // Calculate total progress percentage
  const totalProgress = totalDuration > 0 ? ((elapsedBeforeCurrent + currentTime) / totalDuration) * 100 : 0;

  // Use drag progress if dragging, otherwise use actual progress
  const displayProgress = isDragging && dragProgress !== null ? dragProgress : totalProgress;

  const calculateSeekPosition = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return null;

      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));

      // Calculate which video and what time within that video
      const targetTime = totalDuration * percentage;
      let accumulatedTime = 0;
      let targetVideoIndex = 0;
      let timeInVideo = 0;

      for (let i = 0; i < videoDurations.length; i++) {
        const videoDuration = videoDurations[i] || 0;
        if (accumulatedTime + videoDuration >= targetTime) {
          targetVideoIndex = i;
          timeInVideo = Math.max(0, Math.min(videoDuration, targetTime - accumulatedTime));
          break;
        }
        accumulatedTime += videoDuration;
      }

      return { percentage: percentage * 100, targetVideoIndex, timeInVideo };
    },
    [videoDurations, totalDuration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      dragStateRef.current.isDragging = true;
      dragStateRef.current.lastClientX = e.clientX;
      setIsDragging(true);
      onDragStart?.();

      // Immediately preview the frame at mouse position
      const result = calculateSeekPosition(e.clientX);
      if (result) {
        console.log(
          "[ProgressBar] MouseDown - seeking to video",
          result.targetVideoIndex,
          "at",
          result.timeInVideo.toFixed(2),
          "s - isDragging: true"
        );
        setDragProgress(result.percentage);
        onSeek(result.targetVideoIndex, result.timeInVideo, true);
      }
    },
    [onDragStart, calculateSeekPosition, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;

      dragStateRef.current.lastClientX = e.clientX;

      // Cancel previous RAF if exists
      if (dragStateRef.current.rafId !== null) {
        cancelAnimationFrame(dragStateRef.current.rafId);
      }

      // Use RAF for smooth 60fps updates
      dragStateRef.current.rafId = requestAnimationFrame(() => {
        const result = calculateSeekPosition(e.clientX);
        if (result) {
          setDragProgress(result.percentage);

          // Throttle seeks to every 16ms (60fps) minimum
          const now = performance.now();
          const timeSinceLastSeek = now - dragStateRef.current.lastSeekTime;

          if (timeSinceLastSeek >= 8) {
            // ~120fps max, or every other frame
            dragStateRef.current.lastSeekTime = now;
            console.log(
              "[ProgressBar] MouseMove - seeking to video",
              result.targetVideoIndex,
              "at",
              result.timeInVideo.toFixed(3),
              "s - isDragging: true"
            );
            onSeek(result.targetVideoIndex, result.timeInVideo, true);
          }
        }
        dragStateRef.current.rafId = null;
      });
    },
    [calculateSeekPosition, onSeek]
  );

  const handleMouseUp = useCallback(
    (_e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;

      console.log("[ProgressBar] MouseUp - ending drag");

      // Cancel any pending RAF
      if (dragStateRef.current.rafId !== null) {
        cancelAnimationFrame(dragStateRef.current.rafId);
        dragStateRef.current.rafId = null;
      }

      dragStateRef.current.isDragging = false;
      setIsDragging(false);
      setDragProgress(null);
      onDragEnd?.();
    },
    [onDragEnd]
  );

  // Set up global mouse event listeners with passive: false for better control
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="overflow-visible px-0 relative z-20">
      <div
        ref={progressBarRef}
        className="relative h-2 bg-gray-300 dark:bg-gray-700 cursor-pointer transition-all group rounded-full shadow-sm hover:shadow-md"
        onMouseDown={handleMouseDown}
        title="Drag to seek"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 dark:from-cyan-500 dark:to-cyan-600"
          style={{
            width: `${displayProgress}%`,
            transition: isDragging ? "none" : "width 75ms linear",
          }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-cyan-300 to-cyan-500 dark:from-cyan-400 dark:to-cyan-600 rounded-full shadow-lg ring-2 ring-white dark:ring-gray-800 ${
            isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-100"
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            left: `calc(${displayProgress}% - 8px)`,
            pointerEvents: "none",
            transition: isDragging ? "none" : "opacity 200ms, scale 200ms",
          }}
        />
      </div>
    </div>
  );
}
