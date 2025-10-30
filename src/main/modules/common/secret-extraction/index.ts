/**
 * Secret Extraction Module
 * 
 * Extracts and manages API secrets from Next.js applications (like Google Labs Flow)
 * for use in authenticated API requests across profiles.
 */

export * from './types';
export { SecretExtractionService } from './services/secret-extraction.service';
export { ProfileSecretRepository } from './repository/profile-secret.repository';
export { registrations } from './handlers/registrations';
