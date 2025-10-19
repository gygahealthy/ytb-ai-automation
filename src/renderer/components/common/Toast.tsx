import React, { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";
export type ToastPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number | null;
  position?: ToastPosition;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
  animationClass?: string;
}

const toastStyles: Record<
  ToastType,
  {
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: <CheckCircle2 size={20} className="flex-shrink-0" />,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: <AlertCircle size={20} className="flex-shrink-0" />,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: <Info size={20} className="flex-shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: <AlertTriangle size={20} className="flex-shrink-0" />,
  },
};

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
  animationClass = "animate-in slide-in-from-right-full",
}) => {
  useEffect(() => {
    if (!duration || duration <= 0) return;

    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const style = toastStyles[type];

  return (
    <div
      className={`
        ${animationClass} duration-300 ease-out
        ${style.bg} border ${style.border} rounded-lg shadow-lg p-4 
        flex items-start gap-3 max-w-md w-full
      `}
      role="alert"
    >
      <div className={style.text}>{style.icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`${style.text} font-semibold text-sm mb-1`}>{title}</p>
        )}
        <p className={`${style.text} text-sm whitespace-pre-wrap break-words`}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className={`${style.text} hover:opacity-70 transition flex-shrink-0`}
        aria-label="Dismiss toast"
      >
        <X size={18} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

const getPositionClasses = (position: ToastPosition): string => {
  const baseClasses = "fixed flex flex-col gap-3 pointer-events-none z-50";

  switch (position) {
    case "top-left":
      return `${baseClasses} top-6 left-6`;
    case "top-right":
      return `${baseClasses} top-6 right-6`;
    case "bottom-left":
      return `${baseClasses} bottom-6 left-6`;
    case "bottom-right":
    default:
      return `${baseClasses} bottom-6 right-6`;
  }
};

const getAnimationClasses = (position: ToastPosition): string => {
  switch (position) {
    case "top-left":
      return "animate-in slide-in-from-left-full";
    case "top-right":
      return "animate-in slide-in-from-right-full";
    case "bottom-left":
      return "animate-in slide-in-from-left-full";
    case "bottom-right":
    default:
      return "animate-in slide-in-from-right-full";
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  // Group toasts by position
  const toastsByPosition: Record<ToastPosition, ToastMessage[]> = {
    "top-left": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-right": [],
  };

  toasts.forEach((toast) => {
    const position = toast.position || "bottom-right";
    toastsByPosition[position].push(toast);
  });

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={getPositionClasses(position as ToastPosition)}
          role="region"
          aria-live="polite"
          aria-atomic="false"
        >
          {positionToasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast
                {...toast}
                onClose={onClose}
                animationClass={getAnimationClasses(
                  toast.position || "bottom-right"
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default Toast;
