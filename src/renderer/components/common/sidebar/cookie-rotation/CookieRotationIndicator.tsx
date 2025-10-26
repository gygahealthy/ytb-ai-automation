import { useEffect, useState, useRef } from "react";
import { useAlert } from "@/renderer/hooks/useAlert";
import { useDrawer } from "@/renderer/hooks/useDrawer";
import CookieRotationDrawerContent from "./CookieRotationDrawerContent";
import type { RotationStatus } from "./types";

export function CookieRotationIndicatorInner() {
  // All state and hooks MUST be declared unconditionally at the top
  const [status, setStatus] = useState<RotationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { show } = useAlert();
  const drawer = useDrawer();

  const fetchStatus = async () => {
    try {
      const result = await window.electronAPI.cookieRotation.getStatus();
      if (result.success) setStatus(result.data);
      else
        show({
          title: "Cookie Rotation",
          message: `Failed to fetch status: ${result.error || "unknown error"}`,
          severity: "warning",
        });
    } catch (err) {
      console.error("Failed to fetch rotation status", err);
      show({
        title: "Cookie Rotation",
        message: `Failed to fetch rotation status: ${String(err)}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Indicator only needs status for badge / counts. Full profile list lives in the drawer content.

  // drawer content handles profiles and interactive handlers. The indicator keeps a lightweight status fetch

  useEffect(() => {
    // initial fetch and subscribe to status updates
    fetchStatus();
    const unsubscribe = window.electronAPI.cookieRotation.onStatusUpdate((data: RotationStatus) => {
      setStatus(data);
      setLoading(false);
    });

    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // no overlay logic in indicator; Drawer will hold the panel

  // Early returns for conditional rendering (now safe because all hooks are called above)
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!status) return null;

  const s = status;

  const getHealthStatus = (st: RotationStatus) => {
    if (st.expired > 0) return "critical" as const;
    if (st.degraded > 0 || st.error > 0) return "warning" as const;
    if (st.healthy > 0 && st.running > 0) return "healthy" as const;
    return "unknown" as const;
  };

  const healthStatus = getHealthStatus(s);

  const statusColors = {
    healthy: "bg-green-500 dark:bg-green-400",
    warning: "bg-yellow-500 dark:bg-yellow-400",
    critical: "bg-red-500 dark:bg-red-400",
    unknown: "bg-gray-400 dark:bg-gray-500",
  } as const;

  const statusLabels = {
    healthy: "All sessions healthy",
    warning: "Some sessions need attention",
    critical: "Expired sessions detected",
    unknown: "Status unknown",
  } as const;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() =>
          drawer.openDrawer({
            title: "Cookie Rotation",
            icon: undefined,
            children: <CookieRotationDrawerContent />,
            side: "right",
            width: "w-96",
            enablePin: true,
            drawerId: "cookie-rotation",
          })
        }
        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors bg-transparent dark:bg-transparent"
        title={statusLabels[healthStatus]}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[healthStatus]} ${
              s.isRunning ? "animate-pulse" : ""
            } ring-1 ring-white/10 dark:ring-black/40`}
            aria-hidden
          />
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm text-gray-700 dark:text-gray-200">Cookie Rotation</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{statusLabels[healthStatus]}</span>
          </div>
        </div>

        <div className="ml-2 flex items-center gap-2">
          <div className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-medium text-gray-800 dark:text-gray-100">
            {s.workersCount}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">|</div>
          <div className="text-xs text-gray-700 dark:text-gray-200">
            {s.running}/{s.total}
          </div>
        </div>
      </button>
    </div>
  );
}

export default CookieRotationIndicatorInner;
