/**
 * Types for secret extraction and management
 */

/**
 * Secret types that can be extracted from Next.js applications
 */
export type SecretType = 
  | 'FLOW_NEXT_KEY'      // Google Labs Flow API key (AIzaSy...)
  | 'BEARER_TOKEN'       // Bearer tokens for Authorization headers
  | 'API_KEY'            // Generic API keys
  | 'AUTH_TOKEN';        // Authentication tokens

/**
 * Profile secret stored in database
 */
export interface ProfileSecret {
  id: string;
  profileId: string;
  cookieId?: string;
  secretType: SecretType;
  secretValue: string;
  extractedAt: string;
  isValid: boolean;
  lastValidatedAt?: string;
  metadata?: SecretMetadata;
}

/**
 * Metadata about secret extraction
 */
export interface SecretMetadata {
  sourceUrl?: string;
  scriptFile?: string;
  extractionMethod?: 'browser_automation' | 'manual' | 'api_response';
  totalMatches?: number;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Configuration for secret extraction
 */
export interface SecretExtractionConfig {
  targetUrl: string;
  scriptPattern: RegExp;
  secretPatterns: SecretPattern[];
  timeout?: number;
  retryAttempts?: number;
  headless?: boolean;
}

/**
 * Pattern for matching secrets in script content
 */
export interface SecretPattern {
  type: SecretType;
  regex: RegExp;
  validator?: (value: string) => boolean;
  priority?: number; // Higher priority patterns checked first
}

/**
 * Result of secret extraction operation
 */
export interface SecretExtractionResult {
  success: boolean;
  secrets: ExtractedSecret[];
  error?: string;
  metadata?: {
    duration?: number;
    scriptsAnalyzed?: number;
    profileId?: string;
    [key: string]: any;
  };
}

/**
 * Individual extracted secret
 */
export interface ExtractedSecret {
  type: SecretType;
  value: string;
  source: string;
  matches?: number;
  confidence?: number;
}

/**
 * Result of secret validation
 */
export interface SecretValidationResult {
  isValid: boolean;
  secretType: SecretType;
  testedAt: string;
  error?: string;
  responseStatus?: number;
}

/**
 * Input for upserting a profile secret
 */
export interface UpsertProfileSecretInput {
  profileId: string;
  cookieId?: string;
  secretType: SecretType;
  secretValue: string;
  metadata?: SecretMetadata;
}

/**
 * Script content extracted from browser
 */
export interface ExtractedScriptContent {
  scriptUrl: string;
  content: string;
  size: number;
  fetchedAt: string;
}
