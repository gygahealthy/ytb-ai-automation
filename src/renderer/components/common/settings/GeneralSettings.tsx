import clsx from "clsx";
import { Maximize2, Moon, Palette, Sun, Type, Zap } from "lucide-react";
// no default React import needed with modern JSX transform
import { ColorScheme, FontSize, useSettingsStore } from "../../../store/settings.store";
import ToggleSwitch from "../ToggleSwitch";

const colorSchemes: { value: ColorScheme; label: string; color: string }[] = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
  { value: "teal", label: "Teal", color: "bg-teal-500" },
  { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
];

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: "xs", label: "Extra Small", size: "text-xs" },
  { value: "sm", label: "Small", size: "text-sm" },
  { value: "md", label: "Medium", size: "text-base" },
  { value: "lg", label: "Large", size: "text-lg" },
];

export default function GeneralSettings() {
  const {
    theme,
    colorScheme,
    compactMode,
    fontSize,
    streamingEnabled,
    setTheme,
    setColorScheme,
    setCompactMode,
    setFontSize,
    setStreamingEnabled,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Theme</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme("light")}
            className={clsx(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
              theme === "light"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-600 dark:text-white"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-800"
            )}
          >
            <Sun className="w-4 h-4" />
            <span className="text-gray-800 dark:text-gray-100">Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={clsx(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
              theme === "dark"
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-600 dark:text-white"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-800"
            )}
          >
            <Moon className="w-4 h-4" />
            <span className="text-gray-800 dark:text-gray-100">Dark</span>
          </button>
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Color Scheme</label>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.value}
              onClick={() => setColorScheme(scheme.value)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 font-medium transition-all",
                colorScheme === scheme.value
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-600 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <div className={clsx("w-4 h-4 rounded-full", scheme.color)} />
              <span className="text-sm text-gray-800 dark:text-gray-100">{scheme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Compact Mode</label>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <span className="text-gray-700 dark:text-gray-300">Reduce spacing and padding</span>
          <ToggleSwitch checked={compactMode} onChange={setCompactMode} size="md" color="primary" />
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Font Size</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className={clsx(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
                fontSize === size.value
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-600 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <span className={clsx(size.size, "text-gray-800 dark:text-gray-100")}>{size.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Streaming Response */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <label className="font-semibold text-gray-900 dark:text-gray-100">Streaming Response</label>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
          <span className="text-gray-700 dark:text-gray-300">Stream chat responses in real-time</span>
          <ToggleSwitch checked={streamingEnabled} onChange={setStreamingEnabled} size="md" color="primary" />
        </div>
      </div>
    </div>
  );
}
