import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, FileText } from "lucide-react";
import CookieRotationPanel from "./CookieRotationPanel";
import CookieRotationLogsPanel from "./CookieRotationLogsPanel";
import type { RotationStatus, ProfileWithCookies } from "./types";
import type { ApiResponse, Cookie } from "@/shared/types";
import { useAlert } from "@/renderer/hooks/useAlert";

export default function CookieRotationDrawerContent() {
  const [status, setStatus] = useState<RotationStatus | null>(null);
  const [profiles, setProfiles] = useState<ProfileWithCookies[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs">("dashboard");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { show } = useAlert();

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
      show({ title: "Cookie Rotation", message: String(err), severity: "error" });
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
          message: `Failed to fetch profiles: ${result.error || "unknown error"}`,
          severity: "warning",
        });
    } catch (err) {
      console.error("Failed to fetch profiles", err);
      show({ title: "Cookie Rotation", message: String(err), severity: "error" });
    }
  };

  const handleStartWorker = async (profileId: string, cookieId: string) => {
    try {
      const result = await window.electronAPI.cookieRotation.startWorker(profileId, cookieId);
      if (!result || !result.success) {
        const msg = result?.error || "Failed to start worker";
        show({ title: "Start Worker", message: String(msg), severity: "error" });
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
      const result = await window.electronAPI.cookieRotation.stopWorker(profileId, cookieId);
      if (!result || !result.success) {
        const msg = result?.error || "Failed to stop worker";
        show({ title: "Stop Worker", message: String(msg), severity: "warning" });
      }
      await fetchStatus();
      await fetchProfiles();
    } catch (err) {
      console.error("Failed to stop worker", err);
      show({ title: "Stop Worker", message: String(err), severity: "error" });
    }
  };

  const performCookieExtraction = async (
    profileId: string,
    cookieId: string,
    service: string,
    url: string,
    headlessMode: boolean,
    profileName?: string
  ) => {
    const titleBase = headlessMode ? "Headless Refresh" : "Visible Refresh";
    const modeDescription = headlessMode ? "headless" : "visible";
    const electronCookies = (window.electronAPI as any).cookies;
    const profileLabel = profileName || profileId;
    const shortCookieId = cookieId.length > 8 ? `${cookieId.slice(0, 8)}…` : cookieId;

    try {
      if (!electronCookies || typeof electronCookies.extractAndCreateCookie !== "function") {
        show({ title: `${titleBase} Unavailable`, message: "Cookie extraction IPC bridge is not available.", severity: "error" });
        return;
      }

      const response: ApiResponse<Cookie> = await electronCookies.extractAndCreateCookie(profileId, service, url, headlessMode);

      if (response.success) {
        const raw = response.data?.rawCookieString ?? "";
        const cookieCount = raw ? raw.split(";").filter((c) => c.trim()).length : 0;
        const cookieCountLabel = cookieCount > 0 ? `${cookieCount} cookie${cookieCount === 1 ? "" : "s"}` : "cookies";

        show({
          title: `${titleBase} Successful`,
          message: `Extracted ${cookieCountLabel} for ${service} cookie ${shortCookieId} on ${profileLabel} in ${modeDescription} mode.`,
          severity: "success",
          duration: 4000,
        });
      } else {
        show({
          title: `${titleBase} Failed`,
          message: response.error || `Failed to extract cookies for ${service} cookie ${shortCookieId}.`,
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Failed to extract cookies", { profileId, cookieId, service, err });
      show({
        title: `${titleBase} Error`,
        message: `Error extracting cookies for ${service} cookie ${shortCookieId}: ${String(err)}`,
        severity: "error",
      });
    } finally {
      await fetchStatus();
      await fetchProfiles();
    }
  };

  const handleForceHeadlessRefresh = (profileId: string, cookieId: string, service: string, url: string, profileName?: string) =>
    performCookieExtraction(profileId, cookieId, service, url, true, profileName);

  const handleForceVisibleRefresh = (profileId: string, cookieId: string, service: string, url: string, profileName?: string) =>
    performCookieExtraction(profileId, cookieId, service, url, false, profileName);

  useEffect(() => {
    fetchStatus();
    fetchProfiles();

    const unsubscribe = window.electronAPI.cookieRotation.onStatusUpdate((data: RotationStatus) => {
      setStatus(data);
      setLoading(false);
    });

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

  const panelNode = useMemo(() => {
    if (!status) return null;
    return (
      <CookieRotationPanel
        status={status}
        profiles={profiles}
        onClose={() => {
          /* Drawer onClose will be injected by DrawerProvider when opening */
        }}
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
        onViewLogs={() => setActiveTab("logs")}
        ref={panelRef}
      />
    );
  }, [status, profiles]);

  if (loading) return <div className="p-4 text-sm">Loading...</div>;
  if (!status) return <div className="p-4 text-sm">No status</div>;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Compact Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex h-10">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === "dashboard"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
          }`}
          title="Dashboard"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 px-3 py-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
            activeTab === "logs"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
          }`}
          title="Logs"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Logs</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "dashboard" ? (
          panelNode
        ) : (
          <CookieRotationLogsPanel profiles={profiles} onBack={() => setActiveTab("dashboard")} ref={panelRef} />
        )}
      </div>
    </div>
  );
}
