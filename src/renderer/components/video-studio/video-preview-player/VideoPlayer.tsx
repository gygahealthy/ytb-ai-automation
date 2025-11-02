import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  isMuted: boolean;
  className?: string;
  onEnded: () => void;
  onTimeUpdate: (time: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
}

export interface VideoPlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getReadyState: () => number;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ src, isActive, isMuted, className = "", onEnded, onTimeUpdate, onLoadedMetadata }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (videoRef.current) {
          await videoRef.current.play();
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
      getReadyState: () => {
        return videoRef.current?.readyState || 0;
      },
    }));

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
      }
    }, [isMuted]);

    return (
      <video
        ref={videoRef}
        src={src}
        onEnded={onEnded}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          onTimeUpdate(video.currentTime, video.duration);
        }}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          onLoadedMetadata(video.duration);
        }}
        className={
          className ||
          `w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${
            isActive ? "opacity-100 z-10" : "opacity-0 z-0"
          }`
        }
        playsInline
        preload="auto"
      />
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
