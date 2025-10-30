import clsx from "clsx";
import { Palette, Globe, Keyboard, FolderOpen, Video } from "lucide-react";
import { useState } from "react";
import GeneralSettings from "./GeneralSettings";
import BrowsersSettings from "./BrowsersSettings";
import KeyboardShortcutsSettings from "./KeyboardShortcutsSettings";
import FilePathsSettings from "./FilePathsSettings";
import FlowVeo3Settings from "./FlowVeo3Settings";
import { useSettingsStore } from "../../../store/settings.store";

type SettingsSection = "general" | "browsers" | "keyboard" | "filePaths" | "flowVeo3";

const menuItems: { id: SettingsSection; label: string; icon: any }[] = [
  { id: "general", label: "General", icon: Palette },
  { id: "browsers", label: "Browsers", icon: Globe },
  { id: "keyboard", label: "Keyboard Shortcuts", icon: Keyboard },
  { id: "filePaths", label: "File Paths & Naming", icon: FolderOpen },
  { id: "flowVeo3", label: "Flow VEO3", icon: Video },
];

export default function SettingsForm() {
  const {
    addBrowserPath,
    visibleSections = {
      general: true,
      browsers: true,
      keyboard: true,
      filePaths: true,
      flowVeo3: true,
    },
  } = useSettingsStore();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  // Handler passed down to BrowsersSettings which triggers the existing dialog flow
  const handleAddBrowser = async () => {
    try {
      setValidationError(null);
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: "Select Browser Executable",
        properties: ["openFile"],
        filters: [
          { name: "Executable", extensions: ["exe"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      const dialogResult = (result as any).success ? (result as any).data : result;
      if (dialogResult.canceled) return;
      if (!dialogResult.filePaths || dialogResult.filePaths.length === 0) return;
      const path = dialogResult.filePaths[0];

      // Validate via electron API
      const validationResult = await window.electronAPI.validateBrowserPath(path);
      const validation = (validationResult as any).success ? (validationResult as any).data : validationResult;
      if (!validation.valid) {
        setValidationError(validation.error || "Invalid browser executable");
        return;
      }

      // Add to store
      addBrowserPath({
        name: validation.detectedName || "Browser",
        path,
        isDefault: false,
        note: validation.version,
      });
      setValidationError(null);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex h-[600px] overflow-hidden">
      {/* Left Sidebar Navigation */}
      <div className="w-56 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0 overflow-y-auto">
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
                    ? "bg-primary-500 text-white shadow-sm dark:bg-primary-600 dark:shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                )}
              >
                <Icon
                  className={clsx("w-5 h-5", activeSection === item.id ? "text-white" : "text-gray-600 dark:text-gray-300")}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 mb-4">
              <div className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5">!</div>
              <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
            </div>
          )}

          {activeSection === "general" &&
            (visibleSections.general ? (
              <GeneralSettings />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                This section is hidden. Click the icon in the sidebar to show it.
              </div>
            ))}

          {activeSection === "browsers" &&
            (visibleSections.browsers ? (
              <BrowsersSettings onAdd={handleAddBrowser} />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                This section is hidden. Click the icon in the sidebar to show it.
              </div>
            ))}

          {activeSection === "keyboard" &&
            (visibleSections.keyboard ? (
              <KeyboardShortcutsSettings />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                This section is hidden. Click the icon in the sidebar to show it.
              </div>
            ))}

          {activeSection === "filePaths" &&
            (visibleSections.filePaths ? (
              <FilePathsSettings />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                This section is hidden. Click the icon in the sidebar to show it.
              </div>
            ))}

          {activeSection === "flowVeo3" &&
            (visibleSections.flowVeo3 ? (
              <FlowVeo3Settings />
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                This section is hidden. Click the icon in the sidebar to show it.
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
