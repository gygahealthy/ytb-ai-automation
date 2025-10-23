import { Plus, AlertCircle, Zap } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Cookie, ApiResponse } from "../../../shared/types";
import { CookieCard, CookieAddModal, CookieDetailModal } from "./cookie";
import { useAlert } from "../../hooks/useAlert";

interface CookieManagementModalProps {
  isOpen: boolean;
  profileId: string | null;
  onClose: () => void;
}

export default function CookieModal({ isOpen, profileId, onClose }: CookieManagementModalProps) {
  const alert = useAlert();
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCookie, setSelectedCookie] = useState<Cookie | null>(null);
  const [rotationInterval, setRotationInterval] = useState(1440);
  const [addMode, setAddMode] = useState<"manual" | "extract">("manual");
  const [extractingCookieId, setExtractingCookieId] = useState<string | null>(null);

  const loadCookies = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const response: ApiResponse<Cookie[]> = await (window as any).electronAPI.cookies.getCookiesByProfile(profileId);
      if (response.success && response.data) {
        setCookies(response.data);
      }
    } catch (error) {
      console.error("Failed to load cookies:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Load cookies when modal opens
  useEffect(() => {
    if (isOpen && profileId) {
      loadCookies();
    }
  }, [isOpen, profileId, loadCookies]);

  // Close on Escape and lock body scroll / restore focus
  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      document.body.style.overflow = originalOverflow;
      try {
        prevActive?.focus?.();
      } catch (e) {
        // ignore
      }
      document.removeEventListener("keydown", onKey, true);
    };
  }, [isOpen, onClose]);

  const handleDeleteCookie = async (cookieId: string) => {
    if (!confirm("Are you sure you want to delete this cookie?")) return;

    try {
      const response: ApiResponse<void> = await (window as any).electronAPI.cookies.deleteCookie(cookieId);
      if (response.success) {
        await loadCookies();
      } else {
        alert.show({
          title: "Delete Failed",
          message: response.error || "Failed to delete cookie",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Failed to delete cookie:", error);
      alert.show({
        title: "Delete Error",
        message: "An unexpected error occurred while deleting the cookie",
        severity: "error",
      });
    }
  };

  const handleUpdateInterval = async (cookieId: string, newInterval: number) => {
    try {
      const response: ApiResponse<void> = await (window as any).electronAPI.cookies.updateRotationInterval(cookieId, newInterval);
      if (response.success) {
        await loadCookies();
      } else {
        alert.show({
          title: "Update Failed",
          message: response.error || "Failed to update rotation interval",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Failed to update rotation interval:", error);
      alert.show({
        title: "Update Error",
        message: "An unexpected error occurred while updating rotation interval",
        severity: "error",
      });
    }
  };

  const getStatusColor = (status: string, cookie?: Cookie) => {
    if (cookie && status === "active") {
      const isExpired = cookie.spidExpiration && new Date(cookie.spidExpiration) < new Date();
      if (isExpired) return "text-red-600 dark:text-red-400";
      return "text-green-600 dark:text-green-400";
    }
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "expired":
        return "text-yellow-600 dark:text-yellow-400";
      case "renewal_failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBg = (status: string, cookie?: Cookie) => {
    if (cookie && status === "active") {
      const isExpired = cookie.spidExpiration && new Date(cookie.spidExpiration) < new Date();
      if (isExpired) return "bg-red-100 dark:bg-red-900/30";
      return "bg-green-100 dark:bg-green-900/30";
    }
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/30";
      case "expired":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      case "renewal_failed":
        return "bg-red-100 dark:bg-red-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  const getStatusLabel = (status: string, cookie?: Cookie) => {
    if (cookie && status === "active") {
      const isExpired = cookie.spidExpiration && new Date(cookie.spidExpiration) < new Date();
      if (isExpired) return "Expired";
      return "Active";
    }
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  const handleExtractCookie = async (cookieId: string, headless: boolean) => {
    if (!profileId) return;
    setExtractingCookieId(cookieId);
    try {
      const cookie = cookies.find((c) => c.id === cookieId);
      if (!cookie) return;

      const response: ApiResponse<Cookie> = await (window as any).electronAPI.cookies.extractAndCreateCookie(
        profileId,
        cookie.service,
        cookie.url,
        headless
      );

      if (response.success) {
        // Count cookies from rawCookieString
        const cookieCount = response.data?.rawCookieString
          ? response.data.rawCookieString.split(";").filter((c) => c.trim()).length
          : 0;

        alert.show({
          title: "Cookie Extraction Successful",
          message: `Successfully extracted ${cookieCount} cookie${cookieCount !== 1 ? "s" : ""} in ${
            headless ? "headless" : "visible"
          } mode`,
          severity: "success",
          duration: 4000,
        });

        await loadCookies();
      } else {
        alert.show({
          title: "Cookie Extraction Failed",
          message: response.error || "Failed to extract cookies",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Failed to extract cookie:", error);
      alert.show({
        title: "Cookie Extraction Error",
        message: "An unexpected error occurred while extracting cookies",
        severity: "error",
      });
    } finally {
      setExtractingCookieId(null);
    }
  };

  const handleViewDetails = (cookie: Cookie) => {
    setSelectedCookie(cookie);
    setShowDetailModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cookie Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage authentication cookies for your profiles</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Add Cookie Button */}
        <div className="px-6 py-4 flex gap-2 bg-white dark:bg-gray-800">
          <button
            onClick={() => {
              setAddMode("manual");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            <Plus size={16} />
            Add Manually
          </button>
          <button
            onClick={() => {
              setAddMode("extract");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
          >
            <Zap size={16} />
            Extract from URL
          </button>
        </div>

        {/* Cookies List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Loading cookies...</p>
            </div>
          ) : cookies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
                <AlertCircle size={40} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cookies found</h3>
              <p className="text-gray-500 dark:text-gray-400">Add a cookie to get started with authentication</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cookies.map((cookie) => (
                <CookieCard
                  key={cookie.id}
                  cookie={cookie}
                  rotationInterval={rotationInterval}
                  extractingCookieId={extractingCookieId}
                  onUpdateInterval={handleUpdateInterval}
                  onExtractCookie={handleExtractCookie}
                  onDeleteCookie={handleDeleteCookie}
                  onViewDetails={handleViewDetails}
                  onRotationIntervalChange={setRotationInterval}
                  getStatusColor={getStatusColor}
                  getStatusBg={getStatusBg}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Cookie Modal */}
        <CookieAddModal
          isOpen={showAddModal}
          profileId={profileId}
          mode={addMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCookies();
          }}
        />

        {/* Cookie Detail Modal */}
        <CookieDetailModal
          isOpen={showDetailModal}
          cookie={selectedCookie}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCookie(null);
          }}
        />
      </div>
    </div>
  );
}
