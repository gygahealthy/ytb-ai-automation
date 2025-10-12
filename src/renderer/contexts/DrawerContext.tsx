import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Drawer, { DrawerProps } from "../components/common/Drawer";
import { useLogStore } from "../store/log.store";

interface DrawerContextValue {
  openDrawer: (props: Omit<DrawerProps, "isOpen" | "onClose">) => void;
  closeDrawer: () => void;
  isOpen: boolean;
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawerProps, setDrawerProps] = useState<Omit<DrawerProps, "isOpen" | "onClose"> | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  const openDrawer = (props: Omit<DrawerProps, "isOpen" | "onClose">) => {
    // Close LogDrawer if it's open and not pinned
    const logStore = useLogStore.getState();
    if (logStore.isDrawerOpen && !logStore.isPinned) {
      logStore.closeDrawer();
    }

    // If a drawer is already open and not pinned, close it first
    if (drawerProps && !isPinned) {
      setDrawerProps(null);
      // Small delay to allow close animation before opening new drawer
      setTimeout(() => {
        setDrawerProps(props);
      }, 50);
    } else {
      setDrawerProps(props);
    }
  };

  const closeDrawer = () => {
    setDrawerProps(null);
    setIsPinned(false);
  };

  // Expose a simple drawer API on window so other runtime code (keyboard handlers) can
  // call open/close directly without needing React context.
  // Use the context methods directly to avoid stale closures.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__veo3_drawer_api) return; // Already created

    let isCurrentlyOpen = false;
    let isCurrentlyPinned = false;

    (window as any).__veo3_drawer_api = {
      open: (props: Omit<DrawerProps, "isOpen" | "onClose">) => {
        console.log("[Drawer API] open called");

        // Close LogDrawer if it's open and not pinned
        const logStore = useLogStore.getState();
        if (logStore.isDrawerOpen && !logStore.isPinned) {
          logStore.closeDrawer();
        }

        // If a drawer is already open and not pinned, close it first
        if (isCurrentlyOpen && !isCurrentlyPinned) {
          isCurrentlyOpen = false;
          isCurrentlyPinned = false;
          setDrawerProps(null);
          setIsPinned(false);
          // Small delay to allow close animation
          setTimeout(() => {
            isCurrentlyOpen = true;
            setDrawerProps(props);
          }, 50);
        } else {
          isCurrentlyOpen = true;
          setDrawerProps(props);
        }
      },
      close: () => {
        console.log("[Drawer API] close called");
        isCurrentlyOpen = false;
        isCurrentlyPinned = false;
        setDrawerProps(null);
        setIsPinned(false);
      },
      get isOpen() {
        return isCurrentlyOpen;
      },
      get isPinned() {
        return isCurrentlyPinned;
      },
      setPinned: (pinned: boolean) => {
        isCurrentlyPinned = pinned;
      },
      toggle: (props: Omit<DrawerProps, "isOpen" | "onClose">) => {
        console.log("[Drawer API] toggle called, tracked state:", isCurrentlyOpen ? "open" : "closed");
        if (isCurrentlyOpen) {
          console.log("[Drawer API] Closing drawer");
          isCurrentlyOpen = false;
          isCurrentlyPinned = false;
          setDrawerProps(null);
          setIsPinned(false);
        } else {
          console.log("[Drawer API] Opening drawer");

          // Close LogDrawer if it's open and not pinned
          const logStore = useLogStore.getState();
          if (logStore.isDrawerOpen && !logStore.isPinned) {
            logStore.closeDrawer();
          }

          isCurrentlyOpen = true;
          setDrawerProps(props);
        }
      },
    };

    // Expose a secondary API specifically for profile drawer toggling so keyboard handler
    // can call it directly. We dispatch a custom event so the page component can
    // provide the actual drawer content (avoids wiring UI into this context).
    (window as any).__veo3_profile_drawer_api = {
      toggle: () => {
        try {
          window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
        } catch (err) {
          console.warn("[Drawer API] Failed to dispatch profile toggle event", err);
        }
      },
      isOpen: () => isCurrentlyOpen,
    };

    console.log("[Drawer API] API created and attached to window");
  }, []); // Empty deps - create only once

  // Sync the tracked state with React state
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__veo3_drawer_api) {
      const api = (window as any).__veo3_drawer_api;
      if (api.setPinned) {
        api.setPinned(isPinned);
      }
    }
  }, [isPinned, drawerProps]);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen: !!drawerProps, isPinned, setIsPinned }}>
      {children}
      {drawerProps && <Drawer {...drawerProps} isOpen={true} onClose={closeDrawer} onPinChange={setIsPinned} />}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within DrawerProvider");
  }
  return context;
}

// Safe hook that returns the drawer context or undefined when not inside a provider.
export function useOptionalDrawer() {
  return useContext(DrawerContext);
}
