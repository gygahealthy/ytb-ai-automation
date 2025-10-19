import React, { createContext, useContext, useState, useCallback } from "react";
import {
  ToastMessage,
  ToastType,
  ToastPosition,
  ToastContainer,
} from "../components/common/Toast";

interface ToastContextValue {
  showToast: (options: {
    type: ToastType;
    title?: string;
    message: string;
    duration?: number | null;
    position?: ToastPosition;
  }) => void;
  success: (
    message: string,
    title?: string,
    duration?: number,
    position?: ToastPosition
  ) => void;
  error: (
    message: string,
    title?: string,
    duration?: number,
    position?: ToastPosition
  ) => void;
  info: (
    message: string,
    title?: string,
    duration?: number,
    position?: ToastPosition
  ) => void;
  warning: (
    message: string,
    title?: string,
    duration?: number,
    position?: ToastPosition
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback(
    (options: {
      type: ToastType;
      title?: string;
      message: string;
      duration?: number | null;
      position?: ToastPosition;
    }) => {
      const id = generateId();
      const newToast: ToastMessage = {
        id,
        type: options.type,
        title: options.title,
        message: options.message,
        duration: options.duration ?? 4000, // Default 4s auto-dismiss
        position: options.position ?? "bottom-right", // Default position
      };

      setToasts((prev) => [...prev, newToast]);

      // Return a function to manually dismiss the toast
      return () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      };
    },
    [generateId]
  );

  const success = useCallback(
    (
      message: string,
      title?: string,
      duration?: number,
      position?: ToastPosition
    ) => {
      showToast({ type: "success", title, message, duration, position });
    },
    [showToast]
  );

  const error = useCallback(
    (
      message: string,
      title?: string,
      duration?: number,
      position?: ToastPosition
    ) => {
      showToast({ type: "error", title, message, duration, position });
    },
    [showToast]
  );

  const info = useCallback(
    (
      message: string,
      title?: string,
      duration?: number,
      position?: ToastPosition
    ) => {
      showToast({ type: "info", title, message, duration, position });
    },
    [showToast]
  );

  const warning = useCallback(
    (
      message: string,
      title?: string,
      duration?: number,
      position?: ToastPosition
    ) => {
      showToast({ type: "warning", title, message, duration, position });
    },
    [showToast]
  );

  const handleClose = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn(
      "useToast used outside ToastProvider - falling back to console"
    );
    return {
      showToast: (options: {
        type: ToastType;
        title?: string;
        message: string;
        duration?: number | null;
        position?: ToastPosition;
      }) => console.log("Toast:", options),
      success: (
        _message: string,
        _title?: string,
        _duration?: number,
        _position?: ToastPosition
      ) => console.log("Success"),
      error: (
        _message: string,
        _title?: string,
        _duration?: number,
        _position?: ToastPosition
      ) => console.error("Error"),
      info: (
        _message: string,
        _title?: string,
        _duration?: number,
        _position?: ToastPosition
      ) => console.info("Info"),
      warning: (
        _message: string,
        _title?: string,
        _duration?: number,
        _position?: ToastPosition
      ) => console.warn("Warning"),
    };
  }
  return context;
};
