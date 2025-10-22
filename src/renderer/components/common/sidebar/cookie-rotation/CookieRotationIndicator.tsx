import { useEffect, useState, useRef, useMemo } from "react";
import { useAlert } from "@/renderer/hooks/useAlert";
import { useOverlayPortal } from "@/renderer/contexts/OverlayPortalContext";
import CookieRotationPanel from "./CookieRotationPanel";
import type { RotationStatus, ProfileWithCookies } from "./types";

export function CookieRotationIndicatorInner() {
  // All state and hooks MUST be declared unconditionally at the top
  const [status, setStatus] = useState<RotationStatus | null>(null);
  const [profiles, setProfiles] = useState<ProfileWithCookies[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { showOverlay, updateOverlay, hideOverlay } = useOverlayPortal();
  const { show } = useAlert();
  const [overlayId, setOverlayId] = useState<string | null>(null);

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

  const fetchProfiles = async () => {
    try {
      const result = await window.electronAPI.cookieRotation.getProfiles();
      if (result.success) setProfiles(result.data);
      else
        show({
          title: "Cookie Rotation",
          message: `Failed to fetch profiles: ${
            result.error || "unknown error"
          }`,
          severity: "warning",
        });
    } catch (err) {
      console.error("Failed to fetch profiles", err);
      show({
        title: "Cookie Rotation",
        message: `Failed to fetch profiles: ${String(err)}`,
        severity: "error",
      });
    }
  };

  const handleStartWorker = async (profileId: string, cookieId: string) => {
    try {
      const result = await window.electronAPI.cookieRotation.startWorker(
        profileId,
        cookieId
      );
      if (!result || !result.success) {
        const msg = result?.error || "Failed to start worker";
        show({
          title: "Start Worker",
          message: String(msg),
          severity: "error",
        });
      }
      await fetchStatus();
      await fetchProfiles();
    } catch (err) {
      console.error("Failed to start worker", err);
      show({ title: "Start Worker", message: String(err), severity: "error" });
    }
  };

  const handleStopWorker = async (profileId: string, cookieId: string) => {
    try {
      const result = await window.electronAPI.cookieRotation.stopWorker(
        profileId,
        cookieId
      );
      if (!result || !result.success) {
        const msg = result?.error || "Failed to stop worker";
        show({
          title: "Stop Worker",
          message: String(msg),
          severity: "warning",
        });
      }
      await fetchStatus();
      await fetchProfiles();
    } catch (err) {
      console.error("Failed to stop worker", err);
      show({ title: "Stop Worker", message: String(err), severity: "error" });
    }
  };

  const handleForceHeadlessRefresh = async (
    profileId: string,
    cookieId: string
  ) => {
    try {
      const result =
        await window.electronAPI.cookieRotation.forceHeadlessRefresh(
          profileId,
          cookieId
        );
      if (!result || !result.success) {
        const msg = result?.error || "Failed to perform headless refresh";
        show({
          title: "Headless Refresh",
          message: String(msg),
          severity: "warning",
        });
      }
      await fetchStatus();
      await fetchProfiles();
    } catch (err) {
      console.error("Failed to perform headless refresh", err);
      show({
        title: "Headless Refresh",
        message: String(err),
        severity: "error",
      });
    }
  };

  const handleForceVisibleRefresh = async (
    profileId: string,
    cookieId: string
  ) => {
    try {
      const result =
        await window.electronAPI.cookieRotation.forceVisibleRefresh(
          profileId,
          cookieId
        );
      if (!result || !result.success) {
        const msg = result?.error || "Failed to perform visible refresh";
        show({
          title: "Visible Refresh",
          message: String(msg),
          severity: "warning",
        });
      }
      await fetchStatus();
      await fetchProfiles();
    } catch (err) {
      console.error("Failed to perform visible refresh", err);
      show({
        title: "Visible Refresh",
        message: String(err),
        severity: "error",
      });
    }
  };

  // Memoize panel node to prevent constant re-creation of overlay
  const panelNode = useMemo(
    () =>
      status ? (
        <CookieRotationPanel
          status={status}
          profiles={profiles}
          onClose={() => setShowDetails(false)}
          onRefresh={async () => {
            await fetchStatus();
            await fetchProfiles();
          }}
          onStartAll={async () => {
            await window.electronAPI.cookieRotation.startAll();
            await fetchStatus();
            await fetchProfiles();
          }}
          onStartWorker={handleStartWorker}
          onStopWorker={handleStopWorker}
          onForceHeadlessRefresh={handleForceHeadlessRefresh}
          onForceVisibleRefresh={handleForceVisibleRefresh}
          ref={panelRef}
        />
      ) : null,
    [
      status,
      profiles,
      handleStartWorker,
      handleStopWorker,
      handleForceHeadlessRefresh,
      handleForceVisibleRefresh,
    ]
  );

  useEffect(() => {
    // initial fetch and subscribe to status updates
    fetchStatus();
    fetchProfiles();

    const unsubscribe = window.electronAPI.cookieRotation.onStatusUpdate(
      (data: RotationStatus) => {
        setStatus(data);
        setLoading(false);
      }
    );

    const interval = setInterval(() => {
      fetchStatus();
      fetchProfiles();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showDetails) {
      if (overlayId) {
        hideOverlay(overlayId);
        setOverlayId(null);
      }
      return;
    }

    const anchor = buttonRef.current;
    if (!anchor || !panelNode) return;

    // Only create overlay if not already showing
    if (!overlayId) {
      const id = showOverlay(panelNode, {
        anchor,
        direction: "top-right",
        gap: 8,
      });
      setOverlayId(id);
    } else {
      // Update existing overlay with new panel node and anchor
      updateOverlay(overlayId, panelNode, {
        anchor,
        direction: "top-right",
        gap: 8,
      });
    }

    const onDocClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      const btn = buttonRef.current;
      if (!panel || !btn) return;
      if (
        !(e.target instanceof Node) ||
        panel.contains(e.target) ||
        btn.contains(e.target)
      )
        return;
      setShowDetails(false);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDetails(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    const onResize = () => {
      if (overlayId)
        updateOverlay(overlayId, panelNode, {
          anchor,
          direction: "top-right",
          gap: 8,
        });
    };
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onResize);
    };
  }, [
    showDetails,
    panelNode,
    overlayId,
    showOverlay,
    updateOverlay,
    hideOverlay,
  ]);

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
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title={statusLabels[healthStatus]}
      >
        <div
          className={`w-2 h-2 rounded-full ${statusColors[healthStatus]} ${
            s.isRunning ? "animate-pulse" : ""
          }`}
        />
        <span className="text-gray-700 dark:text-gray-300">
          Cookie Rotation
        </span>
        {s.workersCount > 0 && (
          <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">
            {s.workersCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default CookieRotationIndicatorInner;
