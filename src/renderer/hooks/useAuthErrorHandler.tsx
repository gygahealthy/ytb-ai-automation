import { useState } from "react";
import profileIPC from "../ipc/profile";

interface AuthError {
  message: string;
  profileId?: string;
  profileName?: string;
}

export function useAuthErrorHandler() {
  const [authError, setAuthError] = useState<AuthError | null>(null);

  const handleAuthError = async (
    error: string,
    profileId?: string,
    profileName?: string
  ) => {
    // Check if error is authentication-related
    const authKeywords = [
      "authentication failed",
      "session has expired",
      "not logged in",
      "please login",
      "please log in",
      "authentication required",
      "unauthorized",
      "cookies",
      "cookie",
    ];

    const isAuthError = authKeywords.some((keyword) =>
      error.toLowerCase().includes(keyword)
    );

    if (isAuthError) {
      // If profile name not provided but profileId is, try to fetch it
      let finalProfileName = profileName;
      if (profileId && !profileName) {
        try {
          const response = await profileIPC.getAll();
          if (response.success && response.data) {
            const profile = response.data.find((p: any) => p.id === profileId);
            if (profile) {
              finalProfileName = profile.name;
            }
          }
        } catch (err) {
          console.error(
            "[AuthErrorHandler] Failed to fetch profile name:",
            err
          );
        }
      }

      setAuthError({
        message: error,
        profileId,
        profileName: finalProfileName,
      });
      return true; // Indicates this was an auth error
    }

    return false; // Not an auth error, caller should handle normally
  };

  const closeDialog = () => {
    setAuthError(null);
  };

  return {
    authError,
    handleAuthError,
    closeDialog,
  };
}
