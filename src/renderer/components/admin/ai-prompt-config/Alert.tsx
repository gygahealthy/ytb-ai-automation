import React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface AlertProps {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const isError = type === "error";

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border mb-4 ${
        isError
          ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
      }`}
      role="alert"
    >
      {isError ? (
        <AlertCircle className="flex-shrink-0" size={20} />
      ) : (
        <CheckCircle2 className="flex-shrink-0" size={20} />
      )}
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
