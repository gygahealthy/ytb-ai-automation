import { AlertCircle, RefreshCw } from "lucide-react";

interface AuthErrorDialogProps {
  isOpen: boolean;
  errorMessage: string;
  profileId?: string;
  onClose: () => void;
  onForceVisibleRefresh?: (profileId: string) => Promise<void>;
}

export default function AuthErrorDialog({
  isOpen,
  errorMessage,
  profileId,
  onClose,
  onForceVisibleRefresh,
}: AuthErrorDialogProps) {
  if (!isOpen) return null;

  const handleVisibleRefresh = async () => {
    if (profileId && onForceVisibleRefresh) {
      await onForceVisibleRefresh(profileId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Failed</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Your session has expired or you are not logged in. Please log in to the profile again to fetch projects.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{errorMessage}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {profileId && onForceVisibleRefresh && (
            <button
              onClick={handleVisibleRefresh}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Login in Browser</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
