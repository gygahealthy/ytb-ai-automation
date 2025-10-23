import { RefreshCw } from "lucide-react";

interface RotationMethodsProps {
  rotateViaHeadless: boolean;
  rotateViaRefreshCreds: boolean;
  onToggleHeadless: () => void;
  onToggleRefreshCreds: () => void;
}

export default function RotationMethods({
  rotateViaHeadless,
  rotateViaRefreshCreds,
  onToggleHeadless,
  onToggleRefreshCreds,
}: RotationMethodsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 flex flex-col gap-4 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rotation Methods</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select strategies</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {/* Headless */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Via Headless</span>
          <input type="checkbox" checked={rotateViaHeadless} onChange={onToggleHeadless} className="sr-only peer" />
          <div className="relative w-10 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:border after:border-gray-300 after:transition-all peer-checked:bg-purple-500 dark:peer-checked:bg-purple-600 shadow-sm group-hover:shadow-md" />
        </label>

        {/* Refresh Credentials */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Via Refresh Creds</span>
          <input type="checkbox" checked={rotateViaRefreshCreds} onChange={onToggleRefreshCreds} className="sr-only peer" />
          <div className="relative w-10 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:border after:border-gray-300 after:transition-all peer-checked:bg-purple-500 dark:peer-checked:bg-purple-600 shadow-sm group-hover:shadow-md" />
        </label>
      </div>
    </div>
  );
}
