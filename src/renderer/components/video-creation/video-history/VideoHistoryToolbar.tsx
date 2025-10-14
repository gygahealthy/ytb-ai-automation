import React from "react";
import { Video, RefreshCw } from "lucide-react";
import { useVideoHistory } from "../../../contexts/VideoHistoryContext";
import DateRangePicker from "./DateRangePicker";

const VideoHistoryToolbar: React.FC = () => {
  const { filter, globalPreview, statusCounts, setFilter, setGlobalPreview } = useVideoHistory();

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Video className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Creation History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {statusCounts.all} total videos • {statusCounts.processing} in progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Preview Button */}
          <button
            onClick={() => setGlobalPreview(!globalPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {globalPreview ? "Hide Previews" : "Show Previews"}
          </button>

          {/* Date Range Picker moved to the right to avoid sidebar overlap on narrow layouts */}
          <div className="hidden lg:block">
            <DateRangePicker
              startDate={filter.startDate}
              endDate={filter.endDate}
              onDateRangeChange={(startDate, endDate) => {
                setFilter({
                  ...filter,
                  startDate,
                  endDate,
                });
              }}
            />
          </div>

          {/* Modern Refresh All button */}
          <ToolbarRefreshAll />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mt-4">
        {(["all", "processing", "completed", "failed", "pending"] as const).map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilter({
                ...filter,
                status,
              })
            }
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter.status === status
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>
    </div>
  );
};

const ToolbarRefreshAll: React.FC = () => {
  const { handleRefreshAll, loading } = useVideoHistory();

  return (
    <button
      onClick={handleRefreshAll}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Refresh All"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      <span className="text-sm">Refresh All</span>
    </button>
  );
};

export default VideoHistoryToolbar;
