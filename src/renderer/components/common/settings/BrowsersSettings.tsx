// no default React import needed with modern JSX transform
import { Globe, Plus, Trash2, Check } from "lucide-react";
import { useSettingsStore } from "../../../store/settings.store";
import clsx from "clsx";

export default function BrowsersSettings({ onAdd }: { onAdd: () => void }) {
  const { browserPaths, setDefaultBrowserPath, removeBrowserPath } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Browser Executables</label>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Browser
        </button>
      </div>

      {browserPaths.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">
          <Globe className="w-12 h-12 mx-auto mb-2 opacity-60 dark:opacity-40" />
          <p className="text-sm text-gray-800 dark:text-gray-100">No browser paths configured</p>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">Click "Add Browser" to add a Chromium-based browser</p>
        </div>
      ) : (
        <div className="space-y-2">
          {browserPaths.map((bp) => (
            <div
              key={bp.id}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                bp.isDefault
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-600 dark:text-white"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{bp.name}</h4>
                  {bp.isDefault && <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">Default</span>}
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={bp.path}>
                  {bp.path}
                </p>
                {bp.note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{bp.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                {!bp.isDefault && (
                  <button
                    onClick={() => setDefaultBrowserPath(bp.id)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Set as default"
                  >
                    <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => removeBrowserPath(bp.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove browser"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
