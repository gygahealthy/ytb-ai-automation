import { useContext } from "react";
import { DrawerContext } from "../contexts/DrawerContext";

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
