import { X } from "lucide-react";
import { useEffect, useRef, ReactNode } from "react";

export type ModalSize = "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  contentClassName?: string;
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-7xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  size = "md",
  contentClassName,
  closeOnEscape = true,
  closeOnOverlay = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    // Use capture phase on document to ensure we catch ESC before other handlers
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap inside modal when open
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const el = modalRef.current;
    const focusable =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(el.querySelectorAll(focusable)) as HTMLElement[];
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // focus the first element inside modal
    setTimeout(() => first?.focus(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Restore focus to previously focused element and lock body scroll when modal open
  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    // prevent background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
      try {
        prevActive?.focus?.();
      } catch (e) {
        // ignore
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Only close when clicking the overlay (not when clicking inside the modal)
  const handleOverlayMouseDown: React.MouseEventHandler<HTMLDivElement> = (
    e
  ) => {
    if (!closeOnOverlay) return;
    // If the target is the overlay (the element with data-overlay attribute), close.
    const target = e.target as HTMLElement | null;
    if (target && target.dataset && target.dataset.overlay === "true") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* overlay - listen for mouseDown to avoid stealing focus from modal */}
      <div
        className="absolute inset-0"
        data-overlay="true"
        onMouseDown={handleOverlayMouseDown}
      />

      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${
          sizeClasses[size]
        } flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] ${
          contentClassName ?? ""
        }`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body - Fixed height with scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className={`p-6 ${contentClassName ?? ""}`}>{children}</div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
