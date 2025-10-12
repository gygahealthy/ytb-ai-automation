import { Download, FileText, FolderOpen, Image, Music, Video, X } from "lucide-react";
import { useEffect, useState } from "react";
import veo3IPC from "../../ipc/veo3";
import { useVideoCreationStore } from "../../store/video-creation.store";
import { VideoCreationJob } from "../../types/video-creation.types";

interface JobDetailsModalProps {
  job: VideoCreationJob | null;
  onClose: () => void;
  onShowInFolder?: (path: string) => void;
  onDownload?: (url: string) => void;
}

export default function JobDetailsModal({ job, onClose, onShowInFolder, onDownload }: JobDetailsModalProps) {
  const [pollingProgress, setPollingProgress] = useState(0);
  const { updateJobStatus } = useVideoCreationStore();

  // Polling logic for processing jobs
  useEffect(() => {
    if (!job) {
      setPollingProgress(0);
      return;
    }

    if (!job.generationId) {
      setPollingProgress(0);
      return;
    }

    if (job.status !== "processing") {
      setPollingProgress(0);
      return;
    }

    console.log(`[JobDetailsModal] Starting polling for job: ${job.id}, generationId: ${job.generationId}`);

    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    let currentProgress = 0;

    const animateProgress = () => {
      progressInterval = setInterval(() => {
        currentProgress += 1;
        if (currentProgress <= 98) {
          setPollingProgress(currentProgress);
        }
      }, 1000);
    };

    animateProgress();

    const pollStatus = async () => {
      try {
        const result = await veo3IPC.checkGenerationStatus(job.generationId!);

        if (result.success && result.data) {
          const { status, videoUrl, errorMessage, completedAt } = result.data;

          if (status === "completed") {
            console.log(`[JobDetailsModal] Video generation completed!`);
            setPollingProgress(100);
            clearInterval(pollInterval);
            clearInterval(progressInterval);

            updateJobStatus(job.id, "completed", {
              videoUrl,
              completedAt,
              progress: 100,
            });

            return;
          } else if (status === "failed") {
            console.error(`[JobDetailsModal] Video generation failed: ${errorMessage}`);
            setPollingProgress(0);
            clearInterval(pollInterval);
            clearInterval(progressInterval);

            updateJobStatus(job.id, "failed", {
              error: errorMessage,
              progress: 0,
            });

            return;
          } else {
            clearInterval(progressInterval);
            animateProgress();
          }
        }
      } catch (error) {
        console.error(`[JobDetailsModal] Error checking status:`, error);
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 10000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(progressInterval);
    };
  }, [job?.id, job?.generationId, job?.status, updateJobStatus]);

  if (!job) return null;

  // Mock video metadata - In real implementation, this would come from the job data
  const videoMetadata = {
    aspectRatio: "16:9",
    resolution: "1920x1080",
    fileSize: "45.2 MB",
    duration: "30s",
    format: "MP4",
    codec: "H.264",
    fps: 30,
  };

  const handleShowInFolder = () => {
    if (job.videoUrl && onShowInFolder) {
      onShowInFolder(job.videoUrl);
    }
  };

  const handleDownload = () => {
    if (job.videoUrl && onDownload) {
      onDownload(job.videoUrl);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Video Details</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Created {new Date(job.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status</h4>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  job.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : job.status === "processing"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : job.status === "failed"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>

            {/* Progress - only show if not displaying video loading state */}
            {job.status === "processing" && !job.videoUrl && job.progress !== undefined && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h4>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{job.progress}% complete</p>
              </div>
            )}

            {/* Error */}
            {job.error && (
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Error</h4>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{job.error}</p>
                </div>
              </div>
            )}

            {/* Prompt */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Prompt</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{job.promptText}</p>
              </div>
            </div>

            {/* Video Output or Loading */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Video Output</h4>
              <div className="space-y-3">
                {job.videoUrl ? (
                  <>
                    <video
                      src={job.videoUrl}
                      controls
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={handleShowInFolder}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Show in Folder
                      </button>
                    </div>
                  </>
                ) : job.status === "processing" ? (
                  <div className="w-full h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full border-4 border-t-primary-500 border-gray-200 dark:border-gray-600 animate-spin"
                      aria-hidden="true"
                    />
                    <div className="text-center px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium block">Generating video...</span>
                      <span className="text-xs text-gray-400 mt-1 block">{pollingProgress}%</span>
                    </div>
                    <div className="w-48 mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(Math.max(pollingProgress, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <span className="text-sm text-gray-400">No video yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Metadata */}
            {job.videoUrl && job.status === "completed" && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Video Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Aspect Ratio</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.aspectRatio}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolution</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.resolution}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">File Size</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.fileSize}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.duration}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Format</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.format}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">FPS</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{videoMetadata.fps}</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Path */}
            {job.videoUrl && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">File Location</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{job.videoUrl}</p>
                </div>
              </div>
            )}

            {/* Resources */}
            {job.resources && job.resources.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Additional Resources</h4>
                <div className="grid grid-cols-2 gap-3">
                  {["image", "video", "audio", "transcript"].map((type) => {
                    const count = job.resources?.filter((r) => r.type === type).length || 0;
                    const Icon = type === "image" ? Image : type === "video" ? Video : type === "audio" ? Music : FileText;

                    return (
                      <div key={type} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <Icon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{type}s</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Timeline</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Created:</span> {new Date(job.createdAt).toLocaleString()}
                </p>
                {job.completedAt && (
                  <p>
                    <span className="font-medium">Completed:</span> {new Date(job.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
