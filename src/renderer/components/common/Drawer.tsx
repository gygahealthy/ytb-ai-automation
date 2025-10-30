import clsx from "clsx";
import { Pin, PinOff, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useDrawerPinStore } from "../../store/drawer-pin.store";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  width?: string;
  enablePin?: boolean;
  drawerId?: string; // Unique identifier for this drawer to persist its pin state
  onPinChange?: (pinned: boolean) => void; // Callback when pin state changes
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  icon,
  children,
  side = "right",
  width = "w-96",
  enablePin = true,
  drawerId,
  onPinChange,
}: DrawerProps) {
  const drawerPinStore = useDrawerPinStore();

  // Use persistent pin state if drawerId is provided, otherwise use local state
  const getInitialPinState = () => {
    if (drawerId && enablePin) {
      return drawerPinStore.isPinned(drawerId);
    }
    return false;
  };

  const [isPinned, setIsPinnedLocal] = useState(getInitialPinState);

  // Sync with store when pin state changes
  const setIsPinned = (pinned: boolean) => {
    setIsPinnedLocal(pinned);
    if (drawerId && enablePin) {
      drawerPinStore.setPinned(drawerId, pinned);
    }
    // Notify parent component about pin state change
    if (onPinChange) {
      onPinChange(pinned);
    }
  };

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPinned) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isPinned]);

  // Listen for pin-drawer keyboard shortcut
  useEffect(() => {
    if (!enablePin) return;

    const handlePinDrawer = () => {
      if (isOpen) {
        setIsPinned(!isPinned);
      }
    };

    window.addEventListener("pin-drawer", handlePinDrawer);
    return () => window.removeEventListener("pin-drawer", handlePinDrawer);
  }, [isOpen, isPinned, enablePin]);

  // Don't reset pin state when drawer closes if we're using persistent storage
  // Only reset for non-persistent drawers
  useEffect(() => {
    if (!isOpen && !drawerId) {
      setIsPinned(false);
    }
  }, [isOpen, drawerId]);

  if (!isOpen && !isPinned) return null;

  const sideClass = side === "left" ? "left-0" : "right-0";

  const handleClose = () => {
    if (!isPinned) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop - only show when not pinned */}
      {!isPinned && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={handleClose} />}

      {/* Drawer */}
      <div
        className={clsx(
          "fixed top-0 bottom-0 bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 flex flex-col",
          sideClass,
          width,
          isPinned ? "z-30" : "z-50"
        )}
      >
        <div className="flex-none sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {enablePin && (
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  isPinned
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title={isPinned ? "Unpin drawer (Ctrl+N)" : "Pin drawer (Ctrl+N)"}
              >
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </button>
            )}
            {!isPinned && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
