import clsx from "clsx";
import { ArrowDown, ArrowUp, Pin, PinOff, Search, Terminal, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogEntry, useLogStore } from "../store/log.store";
import LogLine from "./LogLine";

export default function LogDrawer() {
  const { logs, isDrawerOpen, isPinned, closeDrawer, clearLogs, togglePin, sortOrder, setSortOrder } = useLogStore();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | LogEntry["level"]>("all");

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current && isDrawerOpen) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isDrawerOpen]);

  // Subscribe to backend logs
  useEffect(() => {
    console.log("[LogDrawer] Setting up log subscription...");

    if (typeof window === "undefined") {
      console.warn("[LogDrawer] Window is undefined, cannot subscribe");
      return;
    }

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) {
      console.warn("[LogDrawer] electronAPI not available");
      return;
    }

    if (!electronAPI.logger) {
      console.warn("[LogDrawer] electronAPI.logger not available");
      return;
    }

    console.log("[LogDrawer] Subscribing to logs...");
    const unsubscribe = electronAPI.logger.onLog((data: any) => {
      console.log("[LogDrawer] Received log:", data);
      useLogStore.getState().addLog({
        level: data.level as "info" | "warn" | "error" | "debug",
        message: data.message,
        args: data.args || [],
        timestamp: data.timestamp,
      });
    });

    console.log("[LogDrawer] Log subscription active");

    return () => {
      console.log("[LogDrawer] Unsubscribing from logs");
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen for pin-drawer keyboard shortcut
  useEffect(() => {
    const handlePinDrawer = () => {
      if (isDrawerOpen) {
        togglePin();
      }
    };

    window.addEventListener("pin-drawer", handlePinDrawer);
    return () => window.removeEventListener("pin-drawer", handlePinDrawer);
  }, [isDrawerOpen, togglePin]);

  // helper timestamp formatter used by lines
  // timestamp formatting is handled in LogLine component

  const formatArgs = (args: any[]) => {
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

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSearch =
      searchQuery === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatArgs(log.args).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // sort
  const sortedLogs = [...filteredLogs].sort((a, b) =>
    sortOrder === "latest" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  );

  const handleClose = () => {
    if (!isPinned) {
      closeDrawer();
    }
  };

  if (!isDrawerOpen && !isPinned) return null;

  const drawerWidth = isPinned ? "w-1/4" : "w-1/4";

  return (
    <>
      {/* Backdrop - only show when not pinned */}
      {!isPinned && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={handleClose} />}

      {/* Drawer - Right Side */}
      <div
        className={clsx(
          "fixed right-0 top-0 bottom-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 shadow-2xl flex flex-col transform transition-all duration-300 border-l border-gray-200 dark:border-gray-800",
          drawerWidth,
          isPinned ? "z-30" : "z-50"
        )}
      >
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Logs</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Sort toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`Sort: ${sortOrder === "latest" ? "Newest first" : "Oldest first"}`}
              >
                {sortOrder === "latest" ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
              </button>
              <button
                onClick={togglePin}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  isPinned
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={isPinned ? "Unpin drawer (Ctrl+N)" : "Pin drawer (Ctrl+N)"}
              >
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
              <button
                onClick={clearLogs}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Clear all logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {!isPinned && (
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Close (Ctrl+G)"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="px-4 pb-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "info", "warn", "error", "debug"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    levelFilter === level
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  )}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Content */}
        <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Terminal className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">{logs.length === 0 ? "No logs yet" : "No logs match your filters"}</p>
              <p className="text-xs mt-1">
                {logs.length === 0 ? "Logs will appear here as the application runs" : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            sortedLogs.map((log, idx) => <LogLine key={log.id} log={log} highlight={idx === 0} />)
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Total: <span className="font-semibold text-gray-700 dark:text-gray-300">{logs.length}</span>
            </span>
            <div className="flex gap-3">
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
              <span>
                Debug:{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {logs.filter((l) => l.level === "debug").length}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
