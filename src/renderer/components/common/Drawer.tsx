import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  width?: string;
}

export default function Drawer({ isOpen, onClose, title, icon, children, side = "right", width = "w-96" }: DrawerProps) {
  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClass = side === "left" ? "left-0" : "right-0";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`fixed ${sideClass} top-0 bottom-0 ${width} bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto transform transition-transform`}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
