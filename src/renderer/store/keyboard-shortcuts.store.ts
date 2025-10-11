import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShortcutAction = "refresh" | "refresh-alt" | "devtools" | "toggle-history";

export type KeyboardShortcut = {
  id: ShortcutAction;
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
