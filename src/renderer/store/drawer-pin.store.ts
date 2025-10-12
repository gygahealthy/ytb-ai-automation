import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DrawerPinStore {
  pinnedDrawers: Record<string, boolean>;
  setPinned: (drawerId: string, isPinned: boolean) => void;
  isPinned: (drawerId: string) => boolean;
  clearAll: () => void;
}

export const useDrawerPinStore = create<DrawerPinStore>()(
  persist(
    (set, get) => ({
      pinnedDrawers: {},

      setPinned: (drawerId: string, isPinned: boolean) =>
        set((state) => ({
          pinnedDrawers: {
            ...state.pinnedDrawers,
            [drawerId]: isPinned,
          },
        })),

      isPinned: (drawerId: string) => {
        const state = get();
        return state.pinnedDrawers[drawerId] || false;
      },

      clearAll: () => set({ pinnedDrawers: {} }),
    }),
    {
      name: "drawer-pin-storage",
    }
  )
);
