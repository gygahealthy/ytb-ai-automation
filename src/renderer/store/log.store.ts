import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  args: any[];
  timestamp: number;
}

interface LogStore {
  logs: LogEntry[];
  isDrawerOpen: boolean;
  isPinned: boolean;
  maxLogs: number;
  sortOrder: "latest" | "oldest";
  addLog: (log: Omit<LogEntry, "id">) => void;
  clearLogs: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  togglePin: () => void;
  closeAndUnpin: () => void;
  setSortOrder: (order: "latest" | "oldest") => void;
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      logs: [],
      isDrawerOpen: false,
      isPinned: false,
      maxLogs: 1000,
      sortOrder: "latest",

      addLog: (log) =>
        set((state) => {
          const newLog: LogEntry = {
            ...log,
            id: `${Date.now()}-${Math.random()}`,
          };

          const updatedLogs = [...state.logs, newLog];

          // Keep only the last maxLogs entries
          if (updatedLogs.length > state.maxLogs) {
            return { logs: updatedLogs.slice(-state.maxLogs) };
          }

          return { logs: updatedLogs };
        }),

      clearLogs: () => set({ logs: [] }),

      toggleDrawer: () =>
        set((state) => {
          // If pinned, unpin and close when toggled from sidebar/shortcut
          if (state.isPinned) {
            return { isPinned: false, isDrawerOpen: false } as any;
          }

          // If opening, close any generic drawer that's not pinned
          if (!state.isDrawerOpen) {
            // Use window API to close generic drawer
            if (typeof window !== "undefined" && (window as any).__veo3_drawer_api) {
              const api = (window as any).__veo3_drawer_api;
              // Check if generic drawer is open and not pinned
              if (api.isOpen && !api.isPinned) {
                api.close();
              }
            }
          }

          return { isDrawerOpen: !state.isDrawerOpen } as any;
        }),

      openDrawer: () => {
        // Close any generic drawer that's not pinned
        if (typeof window !== "undefined" && (window as any).__veo3_drawer_api) {
          const api = (window as any).__veo3_drawer_api;
          // Check if generic drawer is open and not pinned
          if (api.isOpen && !api.isPinned) {
            api.close();
          }
        }
        return set({ isDrawerOpen: true });
      },

      closeDrawer: () => set((state) => (state.isPinned ? state : { isDrawerOpen: false })),

      togglePin: () => set((state) => ({ isPinned: !state.isPinned, isDrawerOpen: true })),
      // Force close and unpin (used by sidebar toggle to ensure drawer can be hidden)
      closeAndUnpin: () => set(() => ({ isPinned: false, isDrawerOpen: false })),
      setSortOrder: (order) => set(() => ({ sortOrder: order })),
    }),
    {
      name: "log-drawer-storage",
      partialize: (state) => ({
        isPinned: state.isPinned,
        isDrawerOpen: state.isDrawerOpen,
        sortOrder: state.sortOrder,
        // Don't persist logs themselves, only UI state
      }),
    }
  )
);
