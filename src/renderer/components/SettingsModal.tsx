import clsx from "clsx";
import { Maximize2, Moon, Palette, Sun, Type, X } from "lucide-react";
import { ColorScheme, FontSize, useSettingsStore } from "../store/settings.store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, colorScheme, compactMode, fontSize, setTheme, setColorScheme, setCompactMode, setFontSize } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Theme Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="font-semibold">Theme</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
                  theme === "light"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
                  theme === "dark"
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="font-semibold">Color Scheme</label>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.value}
                  onClick={() => setColorScheme(scheme.value)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 font-medium transition-all",
                    colorScheme === scheme.value
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div className={clsx("w-4 h-4 rounded-full", scheme.color)} />
                  <span className="text-sm">{scheme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="font-semibold">Compact Mode</label>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={clsx(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 font-medium transition-all",
                compactMode
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span>Reduce spacing and padding</span>
              <div
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  compactMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <div
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                    compactMode ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </div>
            </button>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="font-semibold">Font Size</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={clsx(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all",
                    fontSize === size.value
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <span className={size.size}>{size.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
