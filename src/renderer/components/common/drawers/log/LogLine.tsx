import clsx from "clsx";
import { useEffect, useRef } from "react";
import { LogEntry } from "../../../../store/log.store";

export default function LogLine({ log, highlight }: { log: LogEntry; highlight?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || !highlight) return;
    const el = ref.current;
    el.classList.add("log-highlight");
    const t = setTimeout(() => el.classList.remove("log-highlight"), 1500);
    return () => clearTimeout(t);
  }, [highlight]);

  return (
    <div
      ref={ref}
      className="group relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4"
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <span
              className={clsx(
                "inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold uppercase",
                log.level === "info"
                  ? "text-blue-600 bg-blue-50"
                  : log.level === "warn"
                  ? "text-amber-600 bg-amber-50"
                  : log.level === "error"
                  ? "text-red-600 bg-red-50"
                  : "text-purple-600 bg-purple-50"
              )}
            >
              {log.level}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium break-words">{log.message}</p>
            {log.args.length > 0 && (
              <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-950 rounded text-xs text-gray-700 dark:text-gray-300 font-mono overflow-x-auto border border-gray-200 dark:border-gray-800">
                {log.args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
