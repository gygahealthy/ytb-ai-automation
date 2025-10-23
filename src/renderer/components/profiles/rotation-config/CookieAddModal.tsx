import { Zap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Cookie, ApiResponse } from "@/shared/types";
import Modal from "../../common/Modal";

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

  const handleClose = () => {
    // Reset form
    setDomain("");
    setRawCookieString("");
    setService("gemini");
    setUrl("");
    setError("");
    onClose();
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
        false
      ); // visible browser (headless = false)
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
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
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

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold mb-1">How it works:</p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This will open the URL in your browser profile and automatically extract cookies. Make sure you're logged in to the
              service.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "manual" ? "Add Cookie Manually" : "Extract Cookie from URL"}
      size="md"
      closeOnEscape={true}
      closeOnOverlay={true}
    >
      {modalContent}
    </Modal>
  );
}
