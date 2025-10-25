/**
 * Worker Log Viewer Component
 * Displays logs from worker log files via IPC
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Terminal, X, ArrowDown, ArrowUp, Search, RefreshCw, Trash2 } from "lucide-react";
import clsx from "clsx";

interface WorkerLogEntry {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  cookieId: string;
  service?: string;
  profileId?: string;
  args?: any[];
}

interface WorkerLogViewerProps {
  cookieId: string;
  profileId?: string;
  profileName?: string;
  onClose?: () => void;
  maxHeight?: string;
}

export default function WorkerLogViewer({
  cookieId,
  profileId,
  profileName,
  onClose,
  maxHeight = "400px",
}: WorkerLogViewerProps) {
  const [logs, setLogs] = useState<WorkerLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | WorkerLogEntry["level"]>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch logs from IPC
  const fetchLogs = async () => {
    try {
      setLoading(true);
      console.log("[WorkerLogViewer] Fetching logs for cookieId:", cookieId, "profileId:", profileId);
      const result = await window.electronAPI.cookieRotation.getWorkerLogs(cookieId, {
        tail: 500,
        profileId: profileId, // Filter logs to only show logs from this profile's cookie
      });
      console.log("[WorkerLogViewer] Result:", result);
      if (result.success && result.data) {
        console.log("[WorkerLogViewer] Setting logs, count:", result.data.length);
        setLogs(result.data);
      } else {
        console.log("[WorkerLogViewer] No data or failed:", result);
      }
    } catch (error) {
      console.error("[WorkerLogViewer] Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    try {
      const result = await window.electronAPI.cookieRotation.clearWorkerLogs(cookieId);
      if (result.success) {
        setLogs([]);
      }
    } catch (error) {
      console.error("[WorkerLogViewer] Failed to clear logs:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchLogs, 10000);

    return () => clearInterval(interval);
  }, [cookieId, profileId]);

  // Auto-scroll based on sort order when new logs arrive
  useEffect(() => {
    if (logContainerRef.current && logs.length > 0) {
      if (sortOrder === "latest") {
        logContainerRef.current.scrollTop = 0;
      } else {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }
  }, [logs, sortOrder]);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((log) => {
        const fullText = `${log.message} ${(log.args || []).join(" ")}`;
        return fullText.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => (sortOrder === "latest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp));

    return filtered;
  }, [logs, levelFilter, searchQuery, sortOrder]);

  const shortCookieId = cookieId.length > 8 ? `${cookieId.slice(0, 8)}...` : cookieId;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "info":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "warn":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
      case "error":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "debug":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour12: false });
  };

  const formatArgs = (args?: any[]) => {
    if (!args || args.length === 0) return "";
    return args
      .map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-500 shadow-sm">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Worker Logs</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {profileName ? `${profileName} • ` : ""}
                {shortCookieId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Refresh button */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            {/* Sort toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              title={`Sort: ${sortOrder === "latest" ? "Newest first" : "Oldest first"}`}
            >
              {sortOrder === "latest" ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
            </button>
            {/* Clear logs */}
            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-3 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "info", "warn", "error", "debug"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={clsx(
                  "px-2 py-1 rounded text-xs font-medium transition-all",
                  levelFilter === level
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                )}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Content */}
      <div
        ref={logContainerRef}
        className="overflow-y-auto p-3 space-y-1.5 bg-gray-50 dark:bg-gray-950 font-mono text-xs"
        style={{ maxHeight }}
      >
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <RefreshCw className="w-10 h-10 mb-2 opacity-50 animate-spin" />
            <p className="text-sm font-medium">Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <Terminal className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-medium">
              {logs.length === 0 ? "No logs for this worker yet" : "No logs match your filters"}
            </p>
            <p className="text-xs mt-1">
              {logs.length === 0 ? "Logs will appear here as the worker runs" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={`${log.timestamp}-${idx}`}
              className="flex gap-2 p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <span className="text-gray-500 dark:text-gray-500 flex-shrink-0">{formatTimestamp(log.timestamp)}</span>
              <span className={clsx("px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0", getLevelColor(log.level))}>
                {log.level.toUpperCase()}
              </span>
              {log.service && (
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                  {log.service.toUpperCase()}
                </span>
              )}
              <span className="text-gray-800 dark:text-gray-200 break-all">
                {log.message}
                {log.args && log.args.length > 0 && (
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{formatArgs(log.args)}</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredLogs.length}</span>
          </span>
          <div className="flex gap-2">
            <span>
              Info:{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {logs.filter((l) => l.level === "info").length}
              </span>
            </span>
            <span>
              Warn:{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {logs.filter((l) => l.level === "warn").length}
              </span>
            </span>
            <span>
              Error:{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                {logs.filter((l) => l.level === "error").length}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
