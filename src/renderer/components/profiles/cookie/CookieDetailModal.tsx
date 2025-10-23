import { X, Copy, Download } from "lucide-react";
import { Cookie } from "@/shared/types";
import { useState } from "react";

interface CookieDetailModalProps {
  isOpen: boolean;
  cookie: Cookie | null;
  onClose: () => void;
}

export default function CookieDetailModal({ isOpen, cookie, onClose }: CookieDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !cookie) return null;

  const parseCookieString = (cookieString: string | undefined) => {
    if (!cookieString) return [];
    return cookieString.split("; ").map((item) => {
      const [key, ...valueParts] = item.split("=");
      return { key: key.trim(), value: valueParts.join("=").trim() };
    });
  };

  const cookies = parseCookieString(cookie.rawCookieString);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = () => {
    const cookieData = {
      url: cookie.url,
      service: cookie.service,
      createdAt: cookie.createdAt,
      spidExpiration: cookie.spidExpiration,
      rawCookieString: cookie.rawCookieString,
      cookies: cookies,
    };

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cookieData, null, 2)));
    element.setAttribute("download", `${cookie.service}-cookies.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cookie Details
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {cookie.service} • {cookie.url}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Cookie Metadata */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Metadata</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Service</p>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                  {cookie.service}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">URL</p>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white break-all">
                  {cookie.url}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Created</p>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                  {new Date(cookie.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Expiration</p>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 mt-1 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                  {cookie.spidExpiration
                    ? new Date(cookie.spidExpiration).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Cookies List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Cookies ({cookies.length})
              </h3>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-all"
              >
                <Download size={14} />
                Download JSON
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {cookies.map((cookie, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                >
                  {/* Cookie Key */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Key</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded text-blue-600 dark:text-blue-400 break-all">
                        {cookie.key}
                      </code>
                      <button
                        onClick={() => handleCopy(cookie.key, `key-${index}`)}
                        className={`p-1.5 rounded transition-all ${
                          copiedKey === `key-${index}`
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500"
                        }`}
                        title="Copy key"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Cookie Value */}
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Value</p>
                    <div className="flex items-start gap-2">
                      <code className="flex-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded text-amber-600 dark:text-amber-400 break-all max-h-24 overflow-auto">
                        {cookie.value}
                      </code>
                      <button
                        onClick={() => handleCopy(cookie.value, `value-${index}`)}
                        className={`p-1.5 rounded transition-all flex-shrink-0 ${
                          copiedKey === `value-${index}`
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500"
                        }`}
                        title="Copy value"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {cookies.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No cookies found in the cookie string</p>
              </div>
            )}
          </div>

          {/* Raw Cookie String */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Raw Cookie String
            </h3>
            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
              <code className="text-xs font-mono text-gray-300 break-all">
                {cookie.rawCookieString || "No raw cookie string available"}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
