/**
 * Application configuration with environment-based settings
 */

import path from "path";
import type { AppConfig, EnvironmentConfig } from "../types/index.js";

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || "development") as
    | "development"
    | "production"
    | "test";
  const logLevel = (process.env.LOG_LEVEL || "info") as
    | "debug"
    | "info"
    | "warn"
    | "error";
  const cacheDir = process.env.CACHE_DIR || path.resolve(".cookies");

  return {
    nodeEnv,
    logLevel,
    cacheDir,
  };
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  geminiBaseUrl: process.env.GEMINI_BASE_URL || "https://gemini.google.com",
  apiEndpoint:
    process.env.API_ENDPOINT ||
    "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate",
  userAgent:
    process.env.USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  timeout: parseInt(process.env.TIMEOUT || "30000", 10),
  outputDir: process.env.OUTPUT_DIR || "./output",
};

/**
 * Endpoints configuration
 */
export const endpoints = {
  init: `${config.geminiBaseUrl}/app`,
  generate: config.apiEndpoint,
  rotateCookies: "https://accounts.google.com/RotateCookies",
  upload: "https://content-push.googleapis.com/upload",
} as const;

/**
 * HTTP headers configuration
 */
export const headers = {
  common: {
    "User-Agent": config.userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  gemini: {
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    Host: "gemini.google.com",
    Origin: "https://gemini.google.com",
    Referer: "https://gemini.google.com/",
    "X-Same-Domain": "1",
  },
  rotateCookies: {
    "Content-Type": "application/json",
  },
} as const;
