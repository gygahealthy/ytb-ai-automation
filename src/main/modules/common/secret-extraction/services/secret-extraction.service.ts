import { Logger } from '../../../../../shared/utils/logger';
import { BrowserAutomationHelper } from '../helpers/browser-automation.helper';
import { ScriptParserHelper, SECRET_PATTERNS } from '../helpers/script-parser.helper';
import { ProfileSecretRepository } from '../repository/profile-secret.repository';
import {
  ProfileSecret,
  SecretType,
  SecretExtractionResult,
  SecretExtractionConfig,
  UpsertProfileSecretInput,
} from '../types';

/**
 * Default configuration for Google Labs Flow secret extraction
 */
const DEFAULT_FLOW_EXTRACTION_CONFIG: SecretExtractionConfig = {
  targetUrl: 'https://labs.google/fx',
  scriptPattern: /_next\/static\/chunks\/pages\/_app-[a-f0-9]+\.js/,
  secretPatterns: [SECRET_PATTERNS.FLOW_NEXT_KEY],
  timeout: 30000,
  retryAttempts: 3,
  headless: true,
};

/**
 * Service for extracting and managing API secrets from Next.js applications
 */
export class SecretExtractionService {
  private browserHelper: BrowserAutomationHelper;
  private parserHelper: ScriptParserHelper;
  private logger: Logger;

  constructor(
    private repository: ProfileSecretRepository,
    logger?: Logger,
    private executablePath?: string
  ) {
    this.logger = logger || new Logger('SecretExtractionService');
    this.browserHelper = new BrowserAutomationHelper(this.logger);
    this.parserHelper = new ScriptParserHelper();
  }

  /**
   * Extract secrets from a target URL for a specific profile
   */
  async extractSecrets(
    profileId: string,
    config: Partial<SecretExtractionConfig> = {}
  ): Promise<SecretExtractionResult> {
    const startTime = Date.now();
    const mergedConfig: SecretExtractionConfig = {
      ...DEFAULT_FLOW_EXTRACTION_CONFIG,
      ...config,
    };

    try {
      this.logger.info(`Starting secret extraction for profile ${profileId} from ${mergedConfig.targetUrl}`);

      // Initialize browser with optional executable path
      await this.browserHelper.initialize(this.executablePath);

      // Extract script content from the target URL
      const scripts = await this.browserHelper.extractScriptContent(
        mergedConfig.targetUrl,
        mergedConfig.scriptPattern,
        mergedConfig.timeout
      );

      if (scripts.length === 0) {
        throw new Error(`No matching script files found for pattern: ${mergedConfig.scriptPattern}`);
      }

      this.logger.info(`Extracted ${scripts.length} script file(s), parsing secrets...`);

      // Parse secrets from all extracted scripts
      const allExtractedSecrets: SecretExtractionResult['secrets'] = [];

      for (const script of scripts) {
        const extracted = this.parserHelper.extractSecrets(script.content, mergedConfig.secretPatterns);

        for (const secret of extracted) {
          allExtractedSecrets.push({
            ...secret,
            source: script.scriptUrl,
          });
        }
      }

      if (allExtractedSecrets.length === 0) {
        this.logger.warn(`No secrets found in ${scripts.length} script(s) for profile ${profileId}`);
        return {
          success: false,
          secrets: [],
          error: 'No secrets found in extracted scripts',
          metadata: {
            duration: Date.now() - startTime,
            scriptsAnalyzed: scripts.length,
            profileId,
          },
        };
      }

      this.logger.info(`Found ${allExtractedSecrets.length} potential secret(s), storing in database...`);

      // Group secrets by type and store the most likely candidate for each type
      const secretsByType = this.parserHelper.groupSecretsByType(allExtractedSecrets);

      for (const [secretType, secrets] of secretsByType) {
        const mostLikely = this.parserHelper.findMostLikelySecret(secrets);

        if (mostLikely) {
          const input: UpsertProfileSecretInput = {
            profileId,
            secretType,
            secretValue: mostLikely.value,
            metadata: {
              sourceUrl: mergedConfig.targetUrl,
              scriptFile: mostLikely.source,
              extractionMethod: 'browser_automation',
              totalMatches: mostLikely.matches,
              confidence: mostLikely.confidence,
            },
          };

          await this.repository.upsert(input);
          this.logger.info(`Stored ${secretType} secret for profile ${profileId} (confidence: ${mostLikely.confidence}%)`);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Secret extraction completed for profile ${profileId} in ${duration}ms`);

      return {
        success: true,
        secrets: allExtractedSecrets,
        metadata: {
          duration,
          scriptsAnalyzed: scripts.length,
          profileId,
        },
      };
    } catch (error) {
      this.logger.error(`Secret extraction failed for profile ${profileId}:`, error);
      return {
        success: false,
        secrets: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          duration: Date.now() - startTime,
          profileId,
        },
      };
    }
  }

  /**
   * Get a valid secret for a profile by type
   */
  async getValidSecret(profileId: string, secretType: SecretType = 'FLOW_NEXT_KEY'): Promise<string | null> {
    try {
      const secret = await this.repository.findValidSecret(profileId, secretType);
      
      if (!secret) {
        this.logger.warn(`No valid ${secretType} secret found for profile ${profileId}`);
        return null;
      }

      this.logger.info(`Retrieved ${secretType} secret for profile ${profileId}`);
      return secret.secretValue;
    } catch (error) {
      this.logger.error(`Failed to get secret for profile ${profileId}:`, error);
      return null;
    }
  }

  /**
   * Get all secrets for a profile
   */
  async getAllSecrets(profileId: string): Promise<ProfileSecret[]> {
    try {
      return await this.repository.findByProfileId(profileId);
    } catch (error) {
      this.logger.error(`Failed to get all secrets for profile ${profileId}:`, error);
      return [];
    }
  }

  /**
   * Refresh secrets for a profile (invalidate old and extract new)
   */
  async refreshSecrets(profileId: string, config?: Partial<SecretExtractionConfig>): Promise<SecretExtractionResult> {
    this.logger.info(`Refreshing secrets for profile ${profileId}`);
    
    // Invalidate all existing secrets
    await this.repository.invalidateAll(profileId);
    
    // Extract new secrets
    return await this.extractSecrets(profileId, config);
  }

  /**
   * Invalidate all secrets for a profile
   */
  async invalidateSecrets(profileId: string): Promise<void> {
    try {
      await this.repository.invalidateAll(profileId);
      this.logger.info(`Invalidated all secrets for profile ${profileId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate secrets for profile ${profileId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup browser resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.browserHelper.close();
      this.logger.info('Secret extraction service cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup service:', error);
    }
  }

  /**
   * Check if browser is currently active
   */
  isBrowserActive(): boolean {
    return this.browserHelper.isInitialized();
  }

  /**
   * Get all valid secrets across all profiles (for admin/debugging)
   */
  async getAllValidSecrets(): Promise<ProfileSecret[]> {
    try {
      return await this.repository.getAllValid();
    } catch (error) {
      this.logger.error('Failed to get all valid secrets:', error);
      return [];
    }
  }
}

// Export singleton instance
let _serviceInstance: SecretExtractionService | null = null;

function getSecretExtractionService(): SecretExtractionService {
  if (!_serviceInstance) {
    const repository = new ProfileSecretRepository();
    _serviceInstance = new SecretExtractionService(repository);
  }
  return _serviceInstance;
}

export const secretExtractionService = new Proxy({} as SecretExtractionService, {
  get(_target, prop) {
    return getSecretExtractionService()[prop as keyof SecretExtractionService];
  },
});
