interface ProgressBarProps {
  currentVideoIndex: number;
  currentTime: number;
  videoDurations: number[];
  onSeek: (videoIndex: number, time: number) => void;
}

export default function ProgressBar({ currentVideoIndex, currentTime, videoDurations, onSeek }: ProgressBarProps) {
  // Calculate total duration of all videos
  const totalDuration = videoDurations.reduce((sum, dur) => sum + dur, 0);

  // Calculate elapsed time up to current video
  const elapsedBeforeCurrent = videoDurations.slice(0, currentVideoIndex).reduce((sum, dur) => sum + dur, 0);

  // Calculate total progress percentage
  const totalProgress = totalDuration > 0 ? ((elapsedBeforeCurrent + currentTime) / totalDuration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
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

    onSeek(targetVideoIndex, timeInVideo);
  };

  return (
    <div className="overflow-visible py-2 px-0 relative z-20">
      <div
        className="relative h-2 bg-gray-300 dark:bg-gray-700 cursor-pointer transition-all group rounded-full shadow-sm hover:shadow-md"
        onClick={handleClick}
        title="Click to seek"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 dark:from-cyan-500 dark:to-cyan-600 transition-all duration-75 rounded-full"
          style={{ width: `${totalProgress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-cyan-300 to-cyan-500 dark:from-cyan-400 dark:to-cyan-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none ring-2 ring-white dark:ring-gray-800"
          style={{ left: `calc(${totalProgress}% - 8px)` }}
        />
      </div>
    </div>
  );
}
