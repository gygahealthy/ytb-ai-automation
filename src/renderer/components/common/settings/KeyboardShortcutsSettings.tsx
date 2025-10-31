import {
  Code,
  History,
  Keyboard,
  Pin,
  RefreshCw,
  Terminal,
  User,
  ArrowLeft,
  ArrowRight,
  Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useKeyboardShortcutsStore } from "../../../store/keyboard-shortcuts.store";

export default function KeyboardShortcutsSettings() {
  const {
    shortcuts,
    setShortcut,
    resetShortcut: resetShortcutInStore,
  } = useKeyboardShortcutsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState<string[]>([]);
  const recordingRef = useRef<boolean>(false);

  // Map icon names to components
  const iconMap: Record<string, any> = {
    RefreshCw,
    Code,
    History,
    User,
    Terminal,
    Pin,
    ArrowLeft,
    ArrowRight,
    Menu,
  };

  // Handle key recording when editing a shortcut
  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!recordingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      if (e.ctrlKey) keys.push("Ctrl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      if (e.metaKey) keys.push("Meta");

      // Add the main key if it's not a modifier
      const mainKey = e.key;
      if (!["Control", "Shift", "Alt", "Meta"].includes(mainKey)) {
        // Normalize special keys
        if (mainKey.startsWith("F") && mainKey.length <= 3) {
          keys.push(mainKey.toUpperCase());
        } else if (mainKey === " ") {
          keys.push("Space");
        } else if (mainKey.length === 1) {
          keys.push(mainKey.toUpperCase());
        } else {
          keys.push(mainKey);
        }
      }

      if (keys.length > 0) {
        setRecordingKeys(keys);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!recordingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      // Save the recorded keys when user releases the key
      if (recordingKeys.length > 0) {
        setShortcut(editingId as any, recordingKeys);
        setEditingId(null);
        setRecordingKeys([]);
        recordingRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingId, recordingKeys, setShortcut]);

  const startRecording = (id: string) => {
    setEditingId(id);
    setRecordingKeys([]);
    recordingRef.current = true;
  };

  const cancelRecording = () => {
    setEditingId(null);
    setRecordingKeys([]);
    recordingRef.current = false;
  };

  const handleResetShortcut = (id: string) => {
    resetShortcutInStore(id as any);
  };

  const formatKeys = (keys: string[]) => {
    return keys.join(" + ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Keyboard Shortcuts
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Customize keyboard shortcuts for quick actions. Click on a shortcut to
          record a new key combination.
        </p>
      </div>

      <div className="space-y-3">
        {shortcuts.map((shortcut) => {
          const Icon = iconMap[shortcut.icon] || Keyboard;
          const isEditing = editingId === shortcut.id;

          return (
            <div
              key={shortcut.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {shortcut.label}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {shortcut.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => startRecording(shortcut.id)}
                  disabled={isEditing}
                  className={`px-4 py-2 rounded-lg font-mono text-sm font-medium border transition-all ${
                    isEditing
                      ? "bg-primary-500 text-white border-primary-500 animate-pulse"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500"
                  }`}
                  title="Click to change shortcut"
                >
                  {isEditing && recordingKeys.length > 0
                    ? formatKeys(recordingKeys)
                    : isEditing
                    ? "Press keys..."
                    : formatKeys(shortcut.keys)}
                </button>

                {isEditing ? (
                  <button
                    onClick={cancelRecording}
                    className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => handleResetShortcut(shortcut.id)}
                    className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">How to customize shortcuts:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Click on a shortcut key to start recording</li>
              <li>Press your desired key combination</li>
              <li>The shortcut will be saved automatically</li>
              <li>Click "Reset" to restore the default shortcut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
