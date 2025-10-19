import { Zap } from "lucide-react";
import { useState } from "react";
import { Cookie, ApiResponse } from "../../../../shared/types";

interface AddCookieModalProps {
  profileId: string | null;
  mode: "manual" | "extract";
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCookieModal({
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
      // Convert domain to full URL if not already a URL
      const fullUrl =
        domain.startsWith("http://") || domain.startsWith("https://")
          ? domain
          : `https://${domain}`;

      const response: ApiResponse<Cookie> = await (
        window as any
      ).electronAPI.cookies.createCookie(profileId, fullUrl, {
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
      // Ensure URL has protocol
      const fullUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;

      const response: ApiResponse<Cookie> = await (
        window as any
      ).electronAPI.cookies.extractAndCreateCookie(profileId, service, fullUrl);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6 shadow-lg">
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

            <div className="flex gap-2 justify-end pt-2">
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

            <div className="flex gap-2 justify-end pt-2">
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded flex items-center gap-2 transition-all"
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
