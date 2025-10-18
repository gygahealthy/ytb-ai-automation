import { Plus, Trash2, RefreshCw, AlertCircle, Zap } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Cookie, ApiResponse } from "../../../shared/types";

interface CookieManagementModalProps {
  isOpen: boolean;
  profileId: string | null;
  onClose: () => void;
}

export default function CookieManagementModal({
  isOpen,
  profileId,
  onClose,
}: CookieManagementModalProps) {
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(1440);
  const [addMode, setAddMode] = useState<"manual" | "extract">("manual");

  const loadCookies = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const response: ApiResponse<Cookie[]> = await (
        window as any
      ).electronAPI.cookies.getCookiesByProfile(profileId);
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

  const handleDeleteCookie = async (cookieId: string) => {
    if (!confirm("Are you sure you want to delete this cookie?")) return;

    try {
      const response: ApiResponse<void> = await (
        window as any
      ).electronAPI.cookies.deleteCookie(cookieId);
      if (response.success) {
        await loadCookies();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to delete cookie:", error);
      alert("Failed to delete cookie");
    }
  };

  const handleUpdateInterval = async (
    cookieId: string,
    newInterval: number
  ) => {
    try {
      const response: ApiResponse<void> = await (
        window as any
      ).electronAPI.cookies.updateRotationInterval(cookieId, newInterval);
      if (response.success) {
        await loadCookies();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to update rotation interval:", error);
      alert("Failed to update rotation interval");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "expired":
        return "text-yellow-600";
      case "renewal_failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100";
      case "expired":
        return "bg-yellow-100";
      case "renewal_failed":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cookie Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Add Cookie Button */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setAddMode("manual");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Cookie Manually
          </button>
          <button
            onClick={() => {
              setAddMode("extract");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Zap size={16} />
            Extract from URL
          </button>
        </div>

        {/* Cookies List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex gap-1 mb-3">
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Loading cookies...
            </p>
          </div>
        ) : cookies.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-gray-500">
            <AlertCircle size={20} />
            No cookies found. Add one to get started.
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cookies.map((cookie) => (
              <div
                key={cookie.id}
                className="border rounded-lg p-4 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{cookie.url}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {cookie.id.substring(0, 8)}...
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBg(
                      cookie.status
                    )} ${getStatusColor(cookie.status)}`}
                  >
                    {cookie.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Last Rotated
                    </p>
                    <p>
                      {cookie.lastRotatedAt
                        ? new Date(cookie.lastRotatedAt).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Rotation Interval
                    </p>
                    <p>{cookie.rotationIntervalMinutes} minutes</p>
                  </div>
                </div>

                {/* Rotation Interval Editor */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    value={rotationInterval}
                    onChange={(e) =>
                      setRotationInterval(parseInt(e.target.value) || 1440)
                    }
                    className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="1"
                  />
                  <button
                    onClick={() =>
                      handleUpdateInterval(cookie.id, rotationInterval)
                    }
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
                  >
                    <RefreshCw size={14} />
                    Update
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteCookie(cookie.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Cookie Modal */}
        {showAddModal && (
          <AddCookieModal
            profileId={profileId}
            mode={addMode}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadCookies();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface AddCookieModalProps {
  profileId: string | null;
  mode: "manual" | "extract";
  onClose: () => void;
  onSuccess: () => void;
}

function AddCookieModal({
  profileId,
  mode,
  onClose,
  onSuccess,
}: AddCookieModalProps) {
  const [domain, setDomain] = useState("");
  const [rawCookieString, setRawCookieString] = useState("");
  const [service, setService] = useState("gemini");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !domain.trim() || !rawCookieString.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response: ApiResponse<Cookie> = await (
        window as any
      ).electronAPI.cookies.createCookie(profileId, domain, {
        rawCookieString,
        service,
      });
      if (response.success) {
        onSuccess();
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Failed to create cookie:", error);
      alert("Failed to create cookie");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractCookie = async () => {
    if (!profileId || !service.trim() || !url.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setExtracting(true);
    setError("");
    try {
      const response: ApiResponse<Cookie> = await (
        window as any
      ).electronAPI.cookies.extractAndCreateCookie(profileId, service, url);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || "Failed to extract cookie");
      }
    } catch (error) {
      console.error("Failed to extract cookie:", error);
      setError("Failed to extract cookie from URL");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">
          {mode === "manual"
            ? "Add Cookie Manually"
            : "Extract Cookie from URL"}
        </h3>

        {mode === "manual" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="gemini">Gemini</option>
                <option value="flow">Flow</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., google.com"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cookie String
              </label>
              <textarea
                value={rawCookieString}
                onChange={(e) => setRawCookieString(e.target.value)}
                placeholder="Paste your cookie string here"
                rows={4}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="gemini">Gemini</option>
                <option value="flow">Flow</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://example.com"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">How it works:</p>
              <p>
                This will open the URL in your browser profile and automatically
                extract cookies. Make sure you're logged in to the service.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-xs text-red-800 dark:text-red-300">
                <p className="font-semibold mb-1">Error:</p>
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                disabled={extracting}
              >
                Cancel
              </button>
              <button
                onClick={handleExtractCookie}
                disabled={extracting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-75 transition-all"
              >
                {extracting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Extracting...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Extract
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
