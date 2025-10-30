import { SecretPattern, SecretType, ExtractedSecret } from '../types';

/**
 * Pre-defined secret patterns for common API keys and tokens
 */
export const SECRET_PATTERNS: Record<string, SecretPattern> = {
  FLOW_NEXT_KEY: {
    type: 'FLOW_NEXT_KEY',
    regex: /(AIzaSy[A-Za-z0-9_-]{33})/g,
    validator: (value: string) => value.startsWith('AIzaSy') && value.length === 39,
    priority: 1,
  },
  BEARER_TOKEN: {
    type: 'BEARER_TOKEN',
    regex: /Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gi,
    validator: (value: string) => value.split('.').length === 3,
    priority: 2,
  },
  API_KEY: {
    type: 'API_KEY',
    regex: /(?:api[_-]?key|apikey)["\s:=]+([A-Za-z0-9_-]{20,})/gi,
    validator: (value: string) => value.length >= 20,
    priority: 3,
  },
};

/**
 * Helper class for parsing secrets from script content
 */
export class ScriptParserHelper {
  /**
   * Extract secrets from script content using predefined or custom patterns
   */
  extractSecrets(
    content: string,
    patterns: SecretPattern[] = Object.values(SECRET_PATTERNS)
  ): ExtractedSecret[] {
    const results = new Map<string, ExtractedSecret>();

    // Sort patterns by priority (higher priority first)
    const sortedPatterns = [...patterns].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const pattern of sortedPatterns) {
      // Reset regex lastIndex to ensure fresh matching
      pattern.regex.lastIndex = 0;
      
      const matches = [...content.matchAll(pattern.regex)];

      for (const match of matches) {
        // Extract the captured group (usually group 1) or full match
        const value = match[1] || match[0];

        // Validate the extracted value
        if (!pattern.validator || pattern.validator(value)) {
          const key = `${pattern.type}:${value}`;
          const existing = results.get(key);

          if (existing) {
            // Increment match count for duplicate finds
            existing.matches = (existing.matches || 1) + 1;
            existing.confidence = Math.min(100, (existing.confidence || 50) + 10);
          } else {
            results.set(key, {
              type: pattern.type,
              value,
              source: 'script_content',
              matches: 1,
              confidence: 70, // Base confidence
            });
          }
        }
      }
    }

    return Array.from(results.values());
  }

  /**
   * Find the most likely valid secret from a list of extracted secrets
   * Prioritizes by match count and confidence score
   */
  findMostLikelySecret(secrets: ExtractedSecret[]): ExtractedSecret | null {
    if (secrets.length === 0) {
      return null;
    }

    // Sort by matches (desc) then confidence (desc)
    const sorted = [...secrets].sort((a, b) => {
      const matchDiff = (b.matches || 0) - (a.matches || 0);
      if (matchDiff !== 0) return matchDiff;
      return (b.confidence || 0) - (a.confidence || 0);
    });

    return sorted[0];
  }

  /**
   * Group extracted secrets by type
   */
  groupSecretsByType(secrets: ExtractedSecret[]): Map<SecretType, ExtractedSecret[]> {
    const grouped = new Map<SecretType, ExtractedSecret[]>();

    for (const secret of secrets) {
      if (!grouped.has(secret.type)) {
        grouped.set(secret.type, []);
      }
      grouped.get(secret.type)!.push(secret);
    }

    return grouped;
  }

  /**
   * Validate a FLOW_NEXT_KEY format (Google API key)
   */
  validateFlowNextKey(key: string): boolean {
    return key.startsWith('AIzaSy') && key.length === 39 && /^[A-Za-z0-9_-]+$/.test(key);
  }

  /**
   * Validate a Bearer token format (JWT)
   */
  validateBearerToken(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Sanitize extracted value (remove quotes, whitespace, etc.)
   */
  sanitizeValue(value: string): string {
    return value.trim().replace(/^["']|["']$/g, '');
  }
}
