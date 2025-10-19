/**
 * Profile Validation Utility
 * Validates that a profile has the necessary configuration to call AI (Gemini cookies)
 */

export interface ProfileValidationResult {
  valid: boolean;
  profileExists: boolean;
  hasCookies: boolean;
  hasActiveCookies: boolean;
  errorMessage?: string;
}

/**
 * Validate profile configuration for AI calls
 * Checks if profile exists and has active Gemini cookies
 */
export async function validateProfileForAI(
  profileId: string
): Promise<ProfileValidationResult> {
  try {
    // Check if profile exists
    const profileResult = await window.electronAPI.profile.getById(profileId);

    if (!profileResult || !profileResult.data) {
      return {
        valid: false,
        profileExists: false,
        hasCookies: false,
        hasActiveCookies: false,
        errorMessage: `Profile not found: ${profileId}. Please create a profile first.`,
      };
    }

    // Check if profile has cookies
    const cookiesResult = await (
      window as any
    ).electronAPI.cookies.getCookiesByProfile(profileId);

    if (
      !cookiesResult.success ||
      !cookiesResult.data ||
      cookiesResult.data.length === 0
    ) {
      return {
        valid: false,
        profileExists: true,
        hasCookies: false,
        hasActiveCookies: false,
        errorMessage: `No cookies found for profile "${profileId}". Please log into Gemini (https://gemini.google.com) using this profile's browser first.`,
      };
    }

    // Check if any Gemini cookies are active
    const hasActiveCookies = cookiesResult.data.some(
      (c: any) => c.service === "gemini" && c.status === "active"
    );

    if (!hasActiveCookies) {
      const availableServices = cookiesResult.data.map((c: any) => ({
        service: c.service,
        status: c.status,
      }));

      return {
        valid: false,
        profileExists: true,
        hasCookies: true,
        hasActiveCookies: false,
        errorMessage: `No active Gemini cookies found for profile "${profileId}". Available services: ${JSON.stringify(
          availableServices
        )}. Please re-login to Gemini using this profile.`,
      };
    }

    return {
      valid: true,
      profileExists: true,
      hasCookies: true,
      hasActiveCookies: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during validation";
    return {
      valid: false,
      profileExists: false,
      hasCookies: false,
      hasActiveCookies: false,
      errorMessage: `Profile validation failed: ${errorMessage}`,
    };
  }
}
