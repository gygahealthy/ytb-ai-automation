/**
 * Cookie Service Constants
 * Defines all available cookie service types
 */

export const COOKIE_SERVICES = {
  GEMINI: "gemini",
  FLOW: "flow",
  CHATGPT: "chatgpt",
  ELEVENLABS: "elevenlabs",
  MINIMAX: "minimax",
} as const;

export type CookieService =
  (typeof COOKIE_SERVICES)[keyof typeof COOKIE_SERVICES];

/**
 * List of all available services
 */
export const AVAILABLE_SERVICES: CookieService[] = [
  COOKIE_SERVICES.GEMINI,
  COOKIE_SERVICES.FLOW,
  COOKIE_SERVICES.CHATGPT,
  COOKIE_SERVICES.ELEVENLABS,
  COOKIE_SERVICES.MINIMAX,
];

/**
 * Service descriptions for UI/logging
 */
export const SERVICE_DESCRIPTIONS: Record<CookieService, string> = {
  [COOKIE_SERVICES.GEMINI]: "Google Gemini API",
  [COOKIE_SERVICES.FLOW]: "Google Flow (VEO3)",
  [COOKIE_SERVICES.CHATGPT]: "OpenAI ChatGPT",
  [COOKIE_SERVICES.ELEVENLABS]: "ElevenLabs Text-to-Speech",
  [COOKIE_SERVICES.MINIMAX]: "Minimax AI API",
};

/**
 * Check if a service string is valid
 */
export function isValidService(service: string): service is CookieService {
  return AVAILABLE_SERVICES.includes(service as CookieService);
}
