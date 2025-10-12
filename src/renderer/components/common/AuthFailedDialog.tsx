import { AlertTriangle, LogIn, X } from "lucide-react";
import { useState } from "react";

interface AuthFailedDialogProps {
  isOpen: boolean;
  profileId?: string;
  profileName?: string;
  errorMessage: string;
  onClose: () => void;
  onLogin?: (profileId: string) => void;
}

export default function AuthFailedDialog({
  isOpen,
  profileId,
  profileName,
  errorMessage,
  onClose,
  onLogin,
}: AuthFailedDialogProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    if (!profileId || !onLogin) return;

    setIsLoggingIn(true);
    try {
      await onLogin(profileId);
      // Keep dialog open so user can see the result
      // Parent component should handle closing after successful login
    } finally {
      setIsLoggingIn(false);
    }
  };

  const showLoginButton = !!profileId && !!onLogin;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Failed</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoggingIn}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="mb-2">{errorMessage}</p>
            {profileName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Profile: {profileName}</p>
            )}
          </div>

          {showLoginButton && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Your session has expired. Click the button below to open a browser and login again.
              </p>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Opening browser...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login to {profileName || "Profile"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoggingIn}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
