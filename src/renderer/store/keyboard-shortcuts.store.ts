import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShortcutAction =
  | "refresh"
  | "refresh-alt"
  | "devtools"
  | "toggle-history"
  | "toggle-profile-select"
  | "toggle-logs"
  | "pin-drawer"
  | "open-cookie-rotation"
  | "open-settings"
  | "open-image-gallery"
  | "toggle-video-properties";

// Added navigation shortcuts
export type NavigationShortcutAction = "navigate-back" | "navigate-forward";

// Merge navigation actions into ShortcutAction union
export type AllShortcutAction = ShortcutAction | NavigationShortcutAction;

export type KeyboardShortcut = {
  id: AllShortcutAction;
  label: string;
  description: string;
  keys: string[];
  icon: string;
};

type KeyboardShortcutsState = {
  shortcuts: KeyboardShortcut[];
  setShortcut: (id: ShortcutAction, keys: string[]) => void;
  resetShortcut: (id: ShortcutAction) => void;
  resetAll: () => void;
  getShortcutById: (id: ShortcutAction) => KeyboardShortcut | undefined;
};

export const defaultShortcuts: KeyboardShortcut[] = [
  {
    id: "refresh",
    label: "Refresh Page",
    description: "Reload the current page content",
    keys: ["F5"],
    icon: "RefreshCw",
  },
  {
    id: "refresh-alt",
    label: "Refresh Page (Alt)",
    description: "Alternative shortcut to reload the page",
    keys: ["Ctrl", "R"],
    icon: "RefreshCw",
  },
  {
    id: "devtools",
    label: "Open DevTools",
    description: "Open the Chrome/Electron DevTools for debugging",
    keys: ["Ctrl", "Shift", "I"],
    icon: "Code",
  },
  {
    id: "toggle-history",
    label: "Toggle Creation History",
    description: "Open/close the creation history drawer",
    keys: ["Ctrl", "D"],
    icon: "History",
  },
  {
    id: "toggle-profile-select",
    label: "Toggle Profile Selection",
    description: "Open/close the profile & project selection drawer",
    keys: ["Ctrl", "F"],
    icon: "User",
  },
  {
    id: "toggle-logs",
    label: "Toggle System Logs",
    description: "Open/close the system logs drawer",
    keys: ["Ctrl", "G"],
    icon: "Terminal",
  },
  {
    id: "pin-drawer",
    label: "Pin/Unpin Drawer",
    description: "Pin or unpin the currently open drawer",
    keys: ["Ctrl", "N"],
    icon: "Pin",
  },
  {
    id: "open-cookie-rotation",
    label: "Open Cookie Rotation",
    description: "Open the Cookie Rotation drawer",
    keys: ["Ctrl", "T"],
    icon: "RefreshCw",
  },
  // Navigation: Alt + ArrowLeft / Alt + ArrowRight
  {
    id: "navigate-back",
    label: "Navigate Back",
    description: "Go back in the page history",
    keys: ["Alt", "ArrowLeft"],
    icon: "ArrowLeft",
  },
  {
    id: "navigate-forward",
    label: "Navigate Forward",
    description: "Go forward in the page history",
    keys: ["Alt", "ArrowRight"],
    icon: "ArrowRight",
  },
  {
    id: "open-settings",
    label: "Open Settings",
    description: "Open the Settings modal",
    keys: ["Ctrl", "S"],
    icon: "Settings",
  },
  {
    id: "open-image-gallery",
    label: "Open Image Gallery",
    description: "Open the Image Gallery drawer for ingredients",
    keys: ["Ctrl", "M"],
    icon: "Images",
  },
  {
    id: "toggle-video-properties",
    label: "Toggle Video Properties",
    description: "Open/close the video properties panel in Video Studio",
    keys: ["Ctrl", "P"],
    icon: "Settings2",
  },
];

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcuts,

      setShortcut: (id, keys) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, keys } : s)),
        }));
      },

      resetShortcut: (id) => {
        const defaultShortcut = defaultShortcuts.find((s) => s.id === id);
        if (defaultShortcut) {
          set((state) => ({
            shortcuts: state.shortcuts.map((s) => (s.id === id ? { ...s, keys: defaultShortcut.keys } : s)),
          }));
        }
      },

      resetAll: () => {
        set({ shortcuts: defaultShortcuts });
      },

      getShortcutById: (id) => {
        return get().shortcuts.find((s) => s.id === id);
      },
    }),
    {
      name: "keyboard-shortcuts-storage",
    }
  )
);
