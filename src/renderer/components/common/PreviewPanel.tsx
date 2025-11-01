import { useEffect, useState, useRef } from "react";
import { useVideoCache } from "../../contexts/VideoCacheContext";

interface PreviewJob {
  status?: string;
  videoPath?: string;
  videoUrl?: string;
  generationId?: string;
}

export default function PreviewPanel({ job, pollingProgress }: { job: PreviewJob | undefined; pollingProgress: number }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { loadVideoDataUrl } = useVideoCache();

  // Intersection Observer for lazy loading - only load videos that are visible
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: "100px", // Preload videos 100px before entering viewport (smoother experience)
        threshold: 0.01,
      }
    );

    observer.observe(currentContainer);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Prefer local video_path over remote videoUrl (videoPath is from downloaded/completed videos)
  // Only load when visible (lazy loading optimization)
  useEffect(() => {
    let isMounted = true;

    async function loadVideo() {
      if (!isMounted) return;

      // Clear previous video if videoPath changed (different video)
      // This prevents showing old video while new one loads
      if (job?.videoPath && videoSrc && !videoSrc.includes(job.videoPath.replace(/\\/g, "/"))) {
        setVideoSrc(null);
      }

      // Only load local files via worker if videoPath exists and looks like a local path (not a URL)
      if (job?.videoPath && !job.videoPath.startsWith("http") && isVisible) {
        try {
          setLoading(true);
          // Use cache context to load video file non-blocking via worker threads
          const dataUrl = await loadVideoDataUrl(job.videoPath);
          if (isMounted && dataUrl) {
            setVideoSrc(dataUrl);
          } else if (isMounted) {
            // Fallback to remote URL if local file can't be loaded
            setVideoSrc(job.videoUrl || null);
          }
        } catch (error) {
          console.error("[PreviewPanel] Failed to load local video:", error);
          if (isMounted) {
            setVideoSrc(job.videoUrl || null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else if (job?.videoUrl && isVisible) {
        // No local file, use remote URL (will expire after some time)
        if (isMounted) {
          setVideoSrc(job.videoUrl);
        }
      }
      // CRITICAL: Do NOT clear videoSrc when !isVisible
      // Keep the cached video element visible for smooth scrolling
    }

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [job?.videoPath, job?.videoUrl, isVisible, loadVideoDataUrl, videoSrc]);

  if (loading) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-t-primary-500 border-gray-200 animate-spin" />
      </div>
    );
  }

  if (videoSrc) {
    return (
      <div ref={containerRef}>
        <video src={videoSrc} className="w-full h-full object-contain" controls />
      </div>
    );
  }

  if (job?.status === "processing" && job?.generationId) {
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-t-primary-500 border-gray-200 animate-spin" aria-hidden="true" />
          <div className="text-center px-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium block">Generating video...</span>
            <span className="text-xs text-gray-400 mt-1 block">{pollingProgress}%</span>
          </div>
          <div className="w-36 mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(Math.max(pollingProgress, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-2">
      {/* <div className="w-12 h-12 text-gray-400">No video</div> */}
      <span className="text-xs text-gray-400">No video yet</span>
    </div>
  );
}
