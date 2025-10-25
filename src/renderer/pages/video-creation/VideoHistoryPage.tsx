import React from "react";
import { VideoHistoryContent, VideoHistoryToolbar } from "@components/video-creation/video-history";
import { VideoHistoryProvider } from "@contexts/VideoHistoryContext";

/**
 * Video History Page - Main Container
 *
 * This page uses the VideoHistoryContext to manage state and provides:
 * - Date range filtering with quick filters (Today, Yesterday, Last 7/30 days)
 * - Status filtering (All, Processing, Completed, Failed, Pending)
 * - Infinite scroll with lazy loading (20 videos per page)
 * - Date-based grouping (Google Photos style)
 * - Real-time status counts
 * - Video preview toggle
 * - Refresh functionality
 */
const VideoHistoryPage: React.FC = () => {
  return (
    <VideoHistoryProvider pageSize={20}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative animate-fadeIn">
        <VideoHistoryToolbar />

        <VideoHistoryContent />
      </div>
    </VideoHistoryProvider>
  );
};

export default VideoHistoryPage;
