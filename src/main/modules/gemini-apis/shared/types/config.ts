/**
 * Configuration type definitions
 */

/**
 * Application configuration
 */
export interface AppConfig {
  geminiBaseUrl: string;
  apiEndpoint: string;
  userAgent: string;
  timeout: number;
  outputDir: string;
}

/**
 * HTTP request configuration
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  followRedirects?: boolean;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheDir: string;
}
