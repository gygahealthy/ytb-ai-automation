import React from "react";
import { Video, ExternalLink, TrendingUp } from "lucide-react";
import { VideoAnalysis } from "../../../main/modules/channel-management/youtube.types";
import {
  formatNumber,
  formatRelativeTime,
} from "../../../shared/utils/formatters";

interface Props {
  channelId: string;
  videos: VideoAnalysis[];
  onRefresh: () => void;
}

const RecentVideos: React.FC<Props> = ({ videos }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Video className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Performance
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Latest video analytics
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Video className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              No videos analyzed yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Videos will appear here once analyzed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.slice(0, 5).map((video) => (
              <div
                key={video.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 group/link"
                    >
                      <span className="line-clamp-2">{video.videoTitle}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="font-medium">
                          {formatNumber(video.views)}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">
                          views
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <span>👍</span>
                        <span className="font-medium">
                          {formatNumber(video.likes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <span>💬</span>
                        <span className="font-medium">
                          {formatNumber(video.comments)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(video.publishedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentVideos;
