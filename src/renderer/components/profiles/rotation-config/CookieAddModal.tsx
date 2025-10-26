import { Zap, AlertCircle, Settings, RefreshCw, Clock, X } from "lucide-react";
import { useState } from "react";
import { Cookie, ApiResponse } from "@/shared/types";
import Modal from "../../common/Modal";

type RotationMethod = "headless" | "refreshCreds" | "rotateCookie";

interface RotationConfig {
  rotationUrl: string;
  requiredCookies: string[];
  rotationIntervalMinutes: number;
  enabledRotationMethods: RotationMethod[];
  rotationMethodOrder: RotationMethod[];
  launchWorkerOnStartup: boolean;
}

interface CookieEditModalProps {
  isOpen: boolean;
  profileId: string | null;
  mode: "manual" | "extract";
  onClose: () => void;
  onSuccess: () => void;
}

export function CookieAddModal({ isOpen, profileId, mode, onClose, onSuccess }: CookieEditModalProps) {
  const [domain, setDomain] = useState("");
  const [rawCookieString, setRawCookieString] = useState("");
  const [service, setService] = useState("gemini");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string>("");

  // Rotation configuration state
  const [rotationConfig, setRotationConfig] = useState<RotationConfig>({
    rotationUrl: "https://www.youtube.com",
    requiredCookies: ["__Secure-3PSIDCC"],
    rotationIntervalMinutes: 60,
    enabledRotationMethods: ["headless", "refreshCreds"],
    rotationMethodOrder: ["refreshCreds", "rotateCookie", "headless"],
    launchWorkerOnStartup: false,
  });

  const handleClose = () => {
    // Reset form
    setDomain("");
    setRawCookieString("");
    setService("gemini");
    setUrl("");
    setError("");
    setRotationConfig({
      rotationUrl: "https://www.youtube.com",
      requiredCookies: ["__Secure-3PSIDCC"],
      rotationIntervalMinutes: 60,
      enabledRotationMethods: ["headless", "refreshCreds"],
      rotationMethodOrder: ["refreshCreds", "rotateCookie", "headless"],
      launchWorkerOnStartup: false,
    });
    onClose();
  };

  const handleToggleMethod = (method: RotationMethod) => {
    const enabled = rotationConfig.enabledRotationMethods.includes(method);
    const newMethods = enabled
      ? rotationConfig.enabledRotationMethods.filter((m) => m !== method)
      : [...rotationConfig.enabledRotationMethods, method];
    setRotationConfig({ ...rotationConfig, enabledRotationMethods: newMethods });
  };

  const handleAddCookie = () => {
    const cookieName = prompt("Enter cookie name (e.g., __Secure-1PSID):");
    if (cookieName && cookieName.trim()) {
      setRotationConfig({
        ...rotationConfig,
        requiredCookies: [...rotationConfig.requiredCookies, cookieName.trim()],
      });
    }
  };

  const handleRemoveCookie = (cookie: string) => {
    setRotationConfig({
      ...rotationConfig,
      requiredCookies: rotationConfig.requiredCookies.filter((c) => c !== cookie),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !domain.trim() || !rawCookieString.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Convert domain to full URL if not already a URL
      const fullUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: ApiResponse<Cookie> = await (window.electronAPI as any).cookies.createCookie(profileId, fullUrl, {
        rawCookieString,
        service,
        rotationConfig: {
          rotation_url: rotationConfig.rotationUrl,
          required_cookies: JSON.stringify(rotationConfig.requiredCookies),
          rotation_interval_minutes: rotationConfig.rotationIntervalMinutes,
          enabled_rotation_methods: JSON.stringify(rotationConfig.enabledRotationMethods),
          rotation_method_order: JSON.stringify(rotationConfig.rotationMethodOrder),
          launch_worker_on_startup: rotationConfig.launchWorkerOnStartup ? 1 : 0,
        },
      });
      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.error || "Failed to create cookie");
      }
    } catch (err) {
      console.error("Failed to create cookie:", err);
      setError("Failed to create cookie");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractCookie = async () => {
    if (!profileId || !service.trim() || !url.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setExtracting(true);
    setError("");
    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: ApiResponse<Cookie> = await (window.electronAPI as any).cookies.extractAndCreateCookie(
        profileId,
        service,
        fullUrl,
        false, // visible browser (headless = false)
        {
          rotation_url: rotationConfig.rotationUrl,
          required_cookies: JSON.stringify(rotationConfig.requiredCookies),
          rotation_interval_minutes: rotationConfig.rotationIntervalMinutes,
          enabled_rotation_methods: JSON.stringify(rotationConfig.enabledRotationMethods),
          rotation_method_order: JSON.stringify(rotationConfig.rotationMethodOrder),
          launch_worker_on_startup: rotationConfig.launchWorkerOnStartup ? 1 : 0,
        }
      );
      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.error || "Failed to extract cookie");
      }
    } catch (err) {
      console.error("Failed to extract cookie:", err);
      setError("Failed to extract cookie from URL");
    } finally {
      setExtracting(false);
    }
  };

  const modalContent = (
    <div className="space-y-4">
      {mode === "manual" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cookie Information Section */}
          <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cookie Information
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="gemini">Gemini</option>
                <option value="flow">Flow</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., google.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Cookie String</label>
              <textarea
                value={rawCookieString}
                onChange={(e) => setRawCookieString(e.target.value)}
                placeholder="Paste your cookie string here"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Rotation Configuration Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Rotation Configuration
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotation URL</label>
              <input
                type="url"
                value={rotationConfig.rotationUrl}
                onChange={(e) => setRotationConfig({ ...rotationConfig, rotationUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://www.youtube.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rotationConfig.launchWorkerOnStartup}
                  onChange={(e) => setRotationConfig({ ...rotationConfig, launchWorkerOnStartup: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Launch worker on startup</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rotation Methods</label>
              <div className="space-y-2">
                {(["headless", "refreshCreds", "rotateCookie"] as RotationMethod[]).map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rotationConfig.enabledRotationMethods.includes(method)}
                      onChange={() => handleToggleMethod(method)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Rotation Interval (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={rotationConfig.rotationIntervalMinutes}
                onChange={(e) =>
                  setRotationConfig({ ...rotationConfig, rotationIntervalMinutes: parseInt(e.target.value) || 60 })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Cookies</label>
                <button
                  type="button"
                  onClick={handleAddCookie}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add Cookie
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {rotationConfig.requiredCookies.map((cookie) => (
                  <span
                    key={cookie}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    {cookie}
                    <button type="button" onClick={() => handleRemoveCookie(cookie)} className="text-red-600 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Cookie Extraction Section */}
          <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cookie Extraction
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="gemini">Gemini</option>
                <option value="flow">Flow</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold mb-1">How it works:</p>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Opens the URL in your browser profile and automatically extracts cookies. Make sure you're logged in.
              </p>
            </div>
          </div>

          {/* Rotation Configuration Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Rotation Configuration
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rotation URL</label>
              <input
                type="url"
                value={rotationConfig.rotationUrl}
                onChange={(e) => setRotationConfig({ ...rotationConfig, rotationUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://www.youtube.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rotationConfig.launchWorkerOnStartup}
                  onChange={(e) => setRotationConfig({ ...rotationConfig, launchWorkerOnStartup: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Launch worker on startup</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rotation Methods</label>
              <div className="space-y-2">
                {(["headless", "refreshCreds", "rotateCookie"] as RotationMethod[]).map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rotationConfig.enabledRotationMethods.includes(method)}
                      onChange={() => handleToggleMethod(method)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Rotation Interval (minutes)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={rotationConfig.rotationIntervalMinutes}
                onChange={(e) =>
                  setRotationConfig({ ...rotationConfig, rotationIntervalMinutes: parseInt(e.target.value) || 60 })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Cookies</label>
                <button
                  type="button"
                  onClick={handleAddCookie}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Add Cookie
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {rotationConfig.requiredCookies.map((cookie) => (
                  <span
                    key={cookie}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    {cookie}
                    <button type="button" onClick={() => handleRemoveCookie(cookie)} className="text-red-600 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              disabled={extracting}
            >
              Cancel
            </button>
            <button
              onClick={handleExtractCookie}
              disabled={extracting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
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
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={"Cookie"} size="md" closeOnEscape={true} closeOnOverlay={true}>
      {modalContent}
    </Modal>
  );
}
