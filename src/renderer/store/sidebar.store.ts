import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,

      toggleCollapsed: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      },

      setCollapsed: (collapsed: boolean) => {
        set({ isCollapsed: collapsed });
      },
    }),
    {
      name: "sidebar-storage",
    }
  )
);
