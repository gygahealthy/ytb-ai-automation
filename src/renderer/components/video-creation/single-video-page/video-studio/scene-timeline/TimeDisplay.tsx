interface TimeDisplayProps {
  currentTime: number;
  totalTime: number;
}

export default function TimeDisplay({ currentTime, totalTime }: TimeDisplayProps) {
  // Format time as MM:SS:MS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-2 pt-12 flex-shrink-0">
      <span className="px-2 py-1 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-700/50 text-xs font-semibold tabular-nums whitespace-nowrap">
        {formatTime(currentTime)}
      </span>
      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">/</span>
      <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-xs font-semibold tabular-nums whitespace-nowrap">
        {formatTime(totalTime)}
      </span>
    </div>
  );
}
