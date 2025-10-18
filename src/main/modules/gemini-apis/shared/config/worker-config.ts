/**
 * Cookie Rotation Worker Configuration
 * Configurable intervals for PSIDTS rotation and SIDCC refresh
 * Inspired by HanaokaYuzu/Gemini-API Python implementation
 */

/**
 * Worker preset configurations
 */
export const WORKER_PRESETS = {
  /**
   * Default preset - suitable for standard always-on services
   * PSIDTS rotation: 9 minutes (540s)
   * SIDCC refresh: 2 minutes (120s)
   */
  DEFAULT: {
    rotationInterval: 540,
    refreshInterval: 120,
    description: "Standard configuration for always-on services",
  },

  /**
   * Aggressive preset - for high-traffic services
   * Rotates more frequently to maintain fresh sessions
   * PSIDTS rotation: 5 minutes (300s)
   * SIDCC refresh: 1 minute (60s)
   */
  AGGRESSIVE: {
    rotationInterval: 300,
    refreshInterval: 60,
    description: "High-traffic configuration with frequent rotation",
  },

  /**
   * Conservative preset - for low-traffic services
   * Reduces rotation frequency to minimize server hits
   * PSIDTS rotation: 15 minutes (900s)
   * SIDCC refresh: 3 minutes (180s)
   */
  CONSERVATIVE: {
    rotationInterval: 900,
    refreshInterval: 180,
    description: "Low-traffic configuration with reduced rotation",
  },

  /**
   * Testing preset - for development and testing
   * Very frequent rotation to test the worker
   * PSIDTS rotation: 30 seconds
   * SIDCC refresh: 10 seconds
   */
  TESTING: {
    rotationInterval: 30,
    refreshInterval: 10,
    description: "Testing configuration with frequent rotation",
  },

  /**
   * Minimal preset - absolute minimum intervals
   * PSIDTS rotation: 2 minutes (120s)
   * SIDCC refresh: 30 seconds
   */
  MINIMAL: {
    rotationInterval: 120,
    refreshInterval: 30,
    description: "Minimal configuration for very aggressive rotation",
  },
} as const;

/**
 * Cache freshness intervals
 * These prevent rate limiting by checking if we rotated recently
 */
export const CACHE_FRESHNESS = {
  /**
   * How long to consider PSIDTS rotation cache fresh (seconds)
   * If rotated within this time, skip rotation to avoid rate limiting
   */
  ROTATION: 60,

  /**
   * How long to consider SIDCC refresh cache fresh (seconds)
   * If refreshed within this time, skip refresh to avoid rate limiting
   */
  REFRESH: 30,
} as const;

/**
 * Get worker configuration from environment or preset
 */
export function getWorkerConfig() {
  const preset = (process.env.WORKER_PRESET ||
    "DEFAULT") as keyof typeof WORKER_PRESETS;
  const customRotation = process.env.WORKER_ROTATION_INTERVAL
    ? parseInt(process.env.WORKER_ROTATION_INTERVAL, 10)
    : undefined;
  const customRefresh = process.env.WORKER_REFRESH_INTERVAL
    ? parseInt(process.env.WORKER_REFRESH_INTERVAL, 10)
    : undefined;

  const presetConfig = WORKER_PRESETS[preset] || WORKER_PRESETS.DEFAULT;

  return {
    rotationInterval: customRotation ?? presetConfig.rotationInterval,
    refreshInterval: customRefresh ?? presetConfig.refreshInterval,
    preset,
    description: presetConfig.description,
  };
}

/**
 * Validate worker configuration
 */
export function validateWorkerConfig(config: {
  rotationInterval: number;
  refreshInterval: number;
}): {
  valid: boolean;
  error?: string;
} {
  const MIN_INTERVAL = 10; // Minimum 10 seconds
  const MAX_INTERVAL = 3600; // Maximum 1 hour

  if (
    config.rotationInterval < MIN_INTERVAL ||
    config.rotationInterval > MAX_INTERVAL
  ) {
    return {
      valid: false,
      error: `rotationInterval must be between ${MIN_INTERVAL}s and ${MAX_INTERVAL}s, got ${config.rotationInterval}s`,
    };
  }

  if (
    config.refreshInterval < MIN_INTERVAL ||
    config.refreshInterval > MAX_INTERVAL
  ) {
    return {
      valid: false,
      error: `refreshInterval must be between ${MIN_INTERVAL}s and ${MAX_INTERVAL}s, got ${config.refreshInterval}s`,
    };
  }

  // Refresh should be more frequent than rotation (or equal)
  if (config.refreshInterval > config.rotationInterval) {
    console.warn(
      `⚠️  Warning: refreshInterval (${config.refreshInterval}s) is greater than rotationInterval (${config.rotationInterval}s). ` +
        `Consider making refresh more frequent than rotation.`
    );
  }

  return { valid: true };
}

/**
 * Environment variable configuration
 *
 * Usage:
 * export WORKER_PRESET=AGGRESSIVE
 * export WORKER_ROTATION_INTERVAL=300
 * export WORKER_REFRESH_INTERVAL=60
 *
 * Preset options: DEFAULT, AGGRESSIVE, CONSERVATIVE, TESTING, MINIMAL
 */
