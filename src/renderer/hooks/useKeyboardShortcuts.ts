import { useEffect } from "react";
import electronApi from "../ipc";
import { useKeyboardShortcutsStore } from "../store/keyboard-shortcuts.store";
import { useLogStore } from "../store/log.store";
import React from "react";
import CookieRotationDrawerContent from "@/renderer/components/common/drawers/cookie-rotation/CookieRotationDrawerContent";
import ImageGalleryDrawer from "@/renderer/components/common/drawers/image-gallery/ImageGalleryDrawer";
import { RefreshCw, Image } from "lucide-react";

type ShortcutHandler = () => void;

const shortcutHandlers: Record<string, ShortcutHandler> = {
  refresh: () => {
    console.log("[Keyboard] Refresh triggered");
    window.location.reload();
  },
  "refresh-alt": () => {
    console.log("[Keyboard] Refresh (alt) triggered");
    window.location.reload();
  },
  devtools: () => {
    console.log("[Keyboard] DevTools triggered");
    electronApi.devtools.toggle();
  },
  "toggle-history": () => {
    console.log("[Keyboard] Toggle Creation History triggered");
    // Use direct window API (exposed by DrawerProvider)
    try {
      const api = (window as any).__veo3_drawer_api;
      if (api && typeof api.toggle === "function") {
        api.toggle({
          title: "Creation History",
          icon: undefined,
          children: "History opened via shortcut",
        });
      } else {
        console.warn("[Keyboard] Drawer API not available yet");
      }
    } catch (err) {
      console.error("[Keyboard] Error toggling drawer:", err);
    }
  },
  "toggle-profile-select": () => {
    console.log("[Keyboard] Toggle Profile Selection triggered");
    // Prefer calling the profile drawer API if the page registered it, otherwise fallback to custom event
    try {
      const api = (window as any).__veo3_profile_drawer_api;
      if (api && typeof api.toggle === "function") {
        api.toggle();
        return;
      }
    } catch (err) {
      console.warn("[Keyboard] profile drawer api not available", err);
    }

    // Fallback: dispatch event
    window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
  },
  "toggle-logs": () => {
    console.log("[Keyboard] Toggle System Logs triggered");
    const logStore = useLogStore.getState();
    // If pinned, unpin it first, then toggle will work normally
    if (logStore.isPinned) {
      logStore.togglePin(); // This will unpin
    }
    logStore.toggleDrawer();
  },
  "pin-drawer": () => {
    console.log("[Keyboard] Pin/Unpin Drawer triggered");
    // Try to pin the log drawer if it's open
    const logStore = useLogStore.getState();
    if (logStore.isDrawerOpen) {
      logStore.togglePin();
      return;
    }

    // Try to pin other drawers via custom event
    window.dispatchEvent(new CustomEvent("pin-drawer"));
  },
  "open-cookie-rotation": () => {
    console.log("[Keyboard] Open Cookie Rotation drawer triggered");
    try {
      const api = (window as any).__veo3_drawer_api;
      const props = {
        title: "Cookie Rotation",
        // small rounded icon to appear in the drawer header (matches other drawers)
        icon: React.createElement(
          "div",
          { className: "p-1 rounded bg-green-500 shadow-sm flex items-center justify-center" },
          React.createElement(RefreshCw, { className: "w-4 h-4 text-white" })
        ),
        // create element without JSX because this file is .ts
        children: React.createElement(CookieRotationDrawerContent, null),
        side: "right",
        width: "w-96",
        enablePin: true,
        drawerId: "cookie-rotation",
      } as any;

      if (api) {
        // Prefer toggle API if available to avoid close->reopen behavior
        if (typeof api.toggle === "function") {
          api.toggle(props);
        } else {
          // Fallback: check isOpen then close or open
          try {
            const isOpen = !!api.isOpen;
            if (isOpen) {
              api.close && api.close();
            } else {
              api.open && api.open(props);
            }
          } catch (err) {
            // If checking failed, fallback to open
            api.open && api.open(props);
          }
        }
      } else {
        console.warn("[Keyboard] Drawer API not available yet");
      }
    } catch (err) {
      console.error("[Keyboard] Error opening cookie rotation drawer:", err);
    }
  },
  "navigate-back": () => {
    console.log("[Keyboard] Navigate Back triggered");
    try {
      if (window.history && typeof window.history.back === "function") {
        window.history.back();
      }
    } catch (err) {
      console.error("[Keyboard] Error navigating back:", err);
    }
  },
  "navigate-forward": () => {
    console.log("[Keyboard] Navigate Forward triggered");
    try {
      if (window.history && typeof window.history.forward === "function") {
        window.history.forward();
      }
    } catch (err) {
      console.error("[Keyboard] Error navigating forward:", err);
    }
  },
  "open-settings": () => {
    console.log("[Keyboard] Open Settings triggered");
    try {
      window.dispatchEvent(new CustomEvent("open-settings-modal"));
    } catch (err) {
      console.error("[Keyboard] Error opening settings modal:", err);
    }
  },
  "open-image-gallery": () => {
    console.log("[Keyboard] Open Image Gallery drawer triggered");
    try {
      const api = (window as any).__veo3_drawer_api;
      if (api) {
        const props = {
          title: "Image Gallery",
          icon: React.createElement(
            "div",
            { className: "p-1 rounded bg-purple-500 shadow-sm flex items-center justify-center" },
            React.createElement(Image, { className: "w-4 h-4 text-white" })
          ),
          children: React.createElement(ImageGalleryDrawer, null),
          side: "right",
          width: "w-96",
          enablePin: true,
          drawerId: "image-gallery",
        } as any;

        if (typeof api.toggle === "function") {
          api.toggle(props);
        } else if (api.open) {
          api.open(props);
        }
      } else {
        console.warn("[Keyboard] Drawer API not available yet");
      }
    } catch (err) {
      console.error("[Keyboard] Error opening image gallery drawer:", err);
    }
  },
  "toggle-video-properties": () => {
    console.log("[Keyboard] Toggle Video Properties triggered");
    // Dispatch custom event that VideoStudioPage will listen to
    window.dispatchEvent(new CustomEvent("toggle-video-properties"));
  },
};

/**
 * Hook to listen for keyboard shortcuts and execute corresponding actions.
 * Should be used once at the app root level.
 */
export function useKeyboardShortcuts() {
  const { shortcuts } = useKeyboardShortcutsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build current key combination
      const pressedKeys: string[] = [];
      if (e.ctrlKey) pressedKeys.push("Ctrl");
      if (e.shiftKey) pressedKeys.push("Shift");
      if (e.altKey) pressedKeys.push("Alt");
      if (e.metaKey) pressedKeys.push("Meta");

      // Normalize the main key
      let mainKey = e.key;
      if (mainKey.startsWith("F") && mainKey.length <= 3) {
        mainKey = mainKey.toUpperCase();
      } else if (mainKey === " ") {
        mainKey = "Space";
      } else if (mainKey.length === 1) {
        mainKey = mainKey.toUpperCase();
      }

      // Don't add modifier keys as main key
      if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        pressedKeys.push(mainKey);
      }

      // Check if this matches any registered shortcut
      for (const shortcut of shortcuts) {
        if (keysMatch(pressedKeys, shortcut.keys)) {
          e.preventDefault();
          e.stopPropagation();

          const handler = shortcutHandlers[shortcut.id];
          if (handler) {
            handler();
          } else {
            console.warn(`[Keyboard] No handler found for shortcut: ${shortcut.id}`);
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    console.log("[Keyboard] Keyboard shortcuts listener attached");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      console.log("[Keyboard] Keyboard shortcuts listener detached");
    };
  }, [shortcuts]);
}

/**
 * Compare two key arrays to see if they match
 */
function keysMatch(pressed: string[], configured: string[]): boolean {
  if (pressed.length !== configured.length) return false;

  const normalizedPressed = pressed.map((k) => k.toLowerCase()).sort();
  const normalizedConfigured = configured.map((k) => k.toLowerCase()).sort();

  return normalizedPressed.every((key, index) => key === normalizedConfigured[index]);
}
