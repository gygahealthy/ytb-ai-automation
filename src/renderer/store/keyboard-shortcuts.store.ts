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
  | "toggle-video-properties"
  | "toggle-sidebar";

// Added navigation shortcuts
export type NavigationShortcutAction = "navigate-back" | "navigate-forward";

// Page-specific shortcuts (only work on certain pages)
export type PageSpecificShortcutAction = "cycle-video-creation-mode";

// Merge all actions into AllShortcutAction union
export type AllShortcutAction = ShortcutAction | NavigationShortcutAction | PageSpecificShortcutAction;

export type KeyboardShortcut = {
  id: AllShortcutAction;
  label: string;
  description: string;
  keys: string[];
  icon: string;
};

type KeyboardShortcutsState = {
  shortcuts: KeyboardShortcut[];
  version: number; // Used to track schema changes
  setShortcut: (id: ShortcutAction, keys: string[]) => void;
  resetShortcut: (id: ShortcutAction) => void;
  resetAll: () => void;
  getShortcutById: (id: ShortcutAction) => KeyboardShortcut | undefined;
};

// Current version - increment when adding new shortcuts
const CURRENT_VERSION = 3;

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
  {
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    description: "Show/hide the navigation sidebar",
    keys: ["Ctrl", "B"],
    icon: "Menu",
  },
  // Page-specific shortcuts
  {
    id: "cycle-video-creation-mode",
    label: "Cycle Video Creation Mode",
    description: "Switch between Text to Video and Ingredients tabs",
    keys: ["Ctrl", "Q"],
    icon: "LayoutGrid",
  },
];

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: defaultShortcuts,
      version: CURRENT_VERSION,

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
        set({ shortcuts: defaultShortcuts, version: CURRENT_VERSION });
      },

      getShortcutById: (id) => {
        return get().shortcuts.find((s) => s.id === id);
      },
    }),
    {
      name: "keyboard-shortcuts-storage",
      version: CURRENT_VERSION,
      migrate: (persistedState: any, version: number) => {
        // If version is outdated or missing, merge new shortcuts with existing customizations
        if (!persistedState || version < CURRENT_VERSION) {
          const oldShortcuts = persistedState?.shortcuts || [];
          const mergedShortcuts = defaultShortcuts.map((defaultShortcut) => {
            // Find if user has customized this shortcut
            const customized = oldShortcuts.find((s: KeyboardShortcut) => s.id === defaultShortcut.id);
            return customized || defaultShortcut;
          });

          return {
            shortcuts: mergedShortcuts,
            version: CURRENT_VERSION,
          };
        }
        return persistedState;
      },
    }
  )
);

// Auto-merge new shortcuts on store initialization
// This ensures new shortcuts are added even if migration doesn't work as expected
const mergeNewShortcuts = () => {
  const state = useKeyboardShortcutsStore.getState();

  // Check if we need to add new shortcuts
  const existingIds = new Set(state.shortcuts.map((s) => s.id));
  const missingShortcuts = defaultShortcuts.filter((s) => !existingIds.has(s.id));

  if (missingShortcuts.length > 0 || state.version < CURRENT_VERSION) {
    console.log(`[Keyboard Shortcuts] Merging ${missingShortcuts.length} new shortcuts`);

    // Merge: keep existing (possibly customized) shortcuts and add new ones
    const mergedShortcuts = [
      ...state.shortcuts.map((existing) => {
        // Update with latest metadata (label, description, icon) but keep custom keys
        const latest = defaultShortcuts.find((d) => d.id === existing.id);
        if (latest && (latest.label !== existing.label || latest.description !== existing.description)) {
          return { ...latest, keys: existing.keys }; // Keep user's custom keys
        }
        return existing;
      }),
      ...missingShortcuts,
    ];

    useKeyboardShortcutsStore.setState({
      shortcuts: mergedShortcuts,
      version: CURRENT_VERSION,
    });
  }
};

// Run merge on module load
if (typeof window !== "undefined") {
  // Use setTimeout to ensure store is fully initialized
  setTimeout(mergeNewShortcuts, 0);
}
