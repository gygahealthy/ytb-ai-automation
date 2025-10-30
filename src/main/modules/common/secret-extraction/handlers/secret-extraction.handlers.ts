import { flowSecretExtractionService } from "../services/secret-extraction.service";
import { SecretType, SecretExtractionConfig } from "../types";

/**
 * Handler: Extract secrets for a profile
 * Channel: secret-extraction:extract
 */
export async function handleExtractFlowSecrets(req: { profileId: string; config?: Partial<SecretExtractionConfig> }) {
  try {
    const { profileId, config } = req;
    const result = await flowSecretExtractionService.extractSecrets(profileId, config);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Get a valid secret for a profile
 * Channel: secret-extraction:get
 */
export async function handleGetValidFlowSecret(req: { profileId: string; secretType?: SecretType }) {
  try {
    const { profileId, secretType = "FLOW_NEXT_KEY" } = req;
    const secretValue = await flowSecretExtractionService.getValidSecret(profileId, secretType);
    return {
      success: true,
      secretValue,
      found: secretValue !== null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Get all secrets for a profile
 * Channel: secret-extraction:get-all
 */
export async function handleGetAllSecrets(req: { profileId?: string }) {
  try {
    const { profileId } = req;
    if (profileId) {
      const secrets = await flowSecretExtractionService.getAllSecrets(profileId);
      return { success: true, secrets };
    } else {
      // Get all valid secrets across all profiles
      const secrets = await flowSecretExtractionService.getAllValidSecrets();
      return { success: true, secrets };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Refresh secrets for a profile
 * Channel: secret-extraction:refresh
 */
export async function handleRefreshSecrets(req: { profileId: string; config?: Partial<SecretExtractionConfig> }) {
  try {
    const { profileId, config } = req;
    const result = await flowSecretExtractionService.refreshSecrets(profileId, config);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Invalidate all secrets for a profile
 * Channel: secret-extraction:invalidate
 */
export async function handleInvalidateSecrets(req: { profileId: string }) {
  try {
    const { profileId } = req;
    await flowSecretExtractionService.invalidateSecrets(profileId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Check browser status
 * Channel: secret-extraction:browser-status
 */
export async function handleGetBrowserStatus(_req: Record<string, never>) {
  try {
    const isActive = flowSecretExtractionService.isBrowserActive();
    return { success: true, isActive };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Handler: Cleanup browser resources
 * Channel: secret-extraction:cleanup
 */
export async function handleCleanup(_req: Record<string, never>) {
  try {
    await flowSecretExtractionService.cleanup();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
