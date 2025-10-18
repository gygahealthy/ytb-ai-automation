import {
  Trash2,
  RefreshCw,
  Zap,
  Calendar,
  Clock,
  RotateCw,
} from "lucide-react";
import { Cookie } from "../../../../shared/types";

interface CookieCardProps {
  cookie: Cookie;
  rotationInterval: number;
  extractingCookieId: string | null;
  onUpdateInterval: (cookieId: string, interval: number) => void;
  onExtractCookie: (cookieId: string) => void;
  onDeleteCookie: (cookieId: string) => void;
  onRotationIntervalChange: (value: number) => void;
  getStatusColor: (status: string, cookie?: Cookie) => string;
  getStatusBg: (status: string, cookie?: Cookie) => string;
  getStatusLabel: (status: string, cookie?: Cookie) => string;
}

export default function CookieCard({
  cookie,
  rotationInterval,
  extractingCookieId,
  onUpdateInterval,
  onExtractCookie,
  onDeleteCookie,
  onRotationIntervalChange,
  getStatusColor,
  getStatusBg,
  getStatusLabel,
}: CookieCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {cookie.url}
            </h3>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap ${getStatusBg(
                cookie.status,
                cookie
              )} ${getStatusColor(cookie.status, cookie)}`}
            >
              {getStatusLabel(cookie.status, cookie)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded">
              {cookie.id.substring(0, 8)}...
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
              {cookie.service}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Left (Info) + Right (Actions) */}
      <div className="flex gap-4">
        {/* Left side - Info (2/3 width) */}
        <div className="flex-1">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Last Rotated */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Last Rotated
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {cookie.lastRotatedAt
                  ? new Date(cookie.lastRotatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </p>
            </div>

            {/* Expiration */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Expiration
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded inline-block">
                {cookie.spidExpiration
                  ? new Date(cookie.spidExpiration).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </p>
            </div>

            {/* Rotation Interval */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <RotateCw className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Rotation Interval
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {cookie.rotationIntervalMinutes} min
              </p>
            </div>

            {/* Created */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Created
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(cookie.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Rotation Interval Editor */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rotationInterval}
              onChange={(e) =>
                onRotationIntervalChange(parseInt(e.target.value) || 1440)
              }
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              placeholder="Rotation interval in minutes"
            />
            <button
              onClick={() => onUpdateInterval(cookie.id, rotationInterval)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-all"
            >
              <RefreshCw size={14} />
              Update
            </button>
          </div>
        </div>

        {/* Right side - Action Buttons (1/3 width) */}
        <div className="w-1/3 flex flex-col gap-2">
          <button
            onClick={() => onExtractCookie(cookie.id)}
            disabled={extractingCookieId === cookie.id}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-semibold transition-all border border-green-200 dark:border-green-800/50"
          >
            {extractingCookieId === cookie.id ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-green-700 dark:border-green-400 border-t-transparent rounded-full animate-spin"></span>
              </>
            ) : (
              <Zap size={15} />
            )}
            <span className="hidden sm:inline">
              {extractingCookieId === cookie.id ? "Updating..." : "Extract"}
            </span>
          </button>
          <button
            onClick={() => onDeleteCookie(cookie.id)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold transition-all border border-red-200 dark:border-red-800/50"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
