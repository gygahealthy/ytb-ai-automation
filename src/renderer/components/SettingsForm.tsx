import clsx from "clsx";
import {
  Maximize2,
  Moon,
  Palette,
  Sun,
  Type,
  Globe,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import {
  ColorScheme,
  FontSize,
  useSettingsStore,
} from "../store/settings.store";

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

type SettingsSection = "general" | "browsers";

const menuItems: { id: SettingsSection; label: string; icon: any }[] = [
  { id: "general", label: "General", icon: Palette },
  { id: "browsers", label: "Browsers", icon: Globe },
];

export default function SettingsForm() {
  const {
    theme,
    colorScheme,
    compactMode,
    fontSize,
    browserPaths,
    setTheme,
    setColorScheme,
    setCompactMode,
    setFontSize,
    addBrowserPath,
    removeBrowserPath,
    setDefaultBrowserPath,
  } = useSettingsStore();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");

  const handleAddBrowser = async () => {
    try {
      setValidationError(null);
      
      console.log("=== START ADD BROWSER ===");
      console.log("Current browserPaths:", browserPaths);
      console.log("Opening file dialog...");
      
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: "Select Browser Executable",
        properties: ["openFile"],
        filters: [
          { name: "Executable", extensions: ["exe"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      console.log("Dialog result:", JSON.stringify(result, null, 2));

      // Handle wrapped response format
      const dialogResult = (result as any).success ? (result as any).data : result;

      if (dialogResult.canceled) {
        console.log("Dialog was canceled by user");
        return;
      }

      if (!dialogResult.filePaths || dialogResult.filePaths.length === 0) {
        console.log("No file paths in result");
        return;
      }

      const path = dialogResult.filePaths[0];
      console.log("Selected path:", path);

      // Check if path already exists
      const exists = browserPaths.some((bp) => bp.path === path);
      console.log("Path already exists?", exists);
      
      if (exists) {
        const errorMsg = "This browser path already exists";
        console.log("ERROR:", errorMsg);
        setValidationError(errorMsg);
        return;
      }

      // Validate the browser path
      console.log("Calling validateBrowserPath...");
      const validationResult = await window.electronAPI.validateBrowserPath(path);
      console.log("Validation result:", JSON.stringify(validationResult, null, 2));
      
      // Handle wrapped response format
      const validation = (validationResult as any).success ? (validationResult as any).data : validationResult;
      console.log("Unwrapped validation:", validation);
      
      if (!validation.valid) {
        const errorMsg = validation.error || "Invalid browser executable";
        console.log("Validation failed:", errorMsg);
        setValidationError(errorMsg);
        return;
      }

      // Add the browser
      const newBrowser = {
        name: validation.detectedName || "Browser",
        path,
        isDefault: browserPaths.length === 0,
        note: validation.version,
      };
      
      console.log("Adding browser to store:", newBrowser);
      addBrowserPath(newBrowser);
      
      console.log("Browser added successfully");
      console.log("Updated browserPaths should now include:", newBrowser);
      console.log("=== END ADD BROWSER ===");
      
      setValidationError(null);
    } catch (error) {
      console.error("=== ERROR IN ADD BROWSER ===");
      console.error("Error details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
      setValidationError(`Failed to add browser: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRemoveBrowser = (id: string) => {
    removeBrowserPath(id);
  };

  const handleSetDefault = (id: string) => {
    setDefaultBrowserPath(id);
  };

  return (
    <div className="flex h-[600px] overflow-hidden">
      {/* Left Sidebar Navigation */}
      <div className="w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 overflow-y-auto">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-medium transition-all",
                  activeSection === item.id
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* General Section */}
          {activeSection === "general" && (
            <div className="space-y-6">
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
                      <div
                        className={clsx("w-4 h-4 rounded-full", scheme.color)}
                      />
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
                      compactMode
                        ? "bg-primary-500"
                        : "bg-gray-300 dark:bg-gray-600"
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
          )}

          {/* Browsers Tab */}
          {activeSection === "browsers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <label className="font-semibold">Browser Executables</label>
                </div>
                <button
                  onClick={handleAddBrowser}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Browser
                </button>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {validationError}
                  </p>
                </div>
              )}

              {browserPaths.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No browser paths configured</p>
                  <p className="text-xs mt-1">
                    Click "Add Browser" to add a Chromium-based browser
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {browserPaths.map((bp) => (
                    <div
                      key={bp.id}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        bp.isDefault
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{bp.name}</h4>
                          {bp.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs text-gray-600 dark:text-gray-400 truncate"
                          title={bp.path}
                        >
                          {bp.path}
                        </p>
                        {bp.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {bp.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!bp.isDefault && (
                          <button
                            onClick={() => handleSetDefault(bp.id)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Set as default"
                          >
                            <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveBrowser(bp.id)}
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
          )}
        </div>
      </div>
    </div>
  );
}
