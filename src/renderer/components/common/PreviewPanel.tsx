export default function PreviewPanel({ job, pollingProgress }: { job: any; pollingProgress: number }) {
  if (job?.videoUrl) {
    return <video src={job.videoUrl} className="w-full h-full object-contain" controls />;
  }

  if (job?.status === "processing" && job?.generationId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-t-primary-500 border-gray-200 animate-spin" aria-hidden="true" />
          <div className="text-center px-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium block">Generating video...</span>
            <span className="text-xs text-gray-400 mt-1 block">{pollingProgress}%</span>
          </div>
          <div className="w-36 mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(Math.max(pollingProgress, 0), 100)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      {/* <div className="w-12 h-12 text-gray-400">No video</div> */}
      <span className="text-xs text-gray-400">No video yet</span>
    </div>
  );
}
