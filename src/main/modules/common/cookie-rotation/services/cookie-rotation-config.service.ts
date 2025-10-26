/**
 * Cookie Rotation Configuration Service
 * Manages per-cookie rotation configuration settings
 */

import { CookieRepository } from "../../cookie/repository/cookie.repository.js";
import { CookieRotationMonitorRepository } from "../repository/cookie-rotation-monitor.repository.js";
import { logger } from "../../../../utils/logger-backend.js";

export type RotationMethod = "refreshCreds" | "rotateCookie" | "headless";

export interface CookieRotationConfig {
  cookieId: string;
  launchWorkerOnStartup: boolean;
  enabledRotationMethods: RotationMethod[];
  rotationMethodOrder: RotationMethod[];
  rotationIntervalMinutes: number;
  // Optional fields for logging context (added by parent when forking child workers)
  profileId?: string;
  profileName?: string;
  service?: string;
}

export interface ProfileWithCookieConfig {
  profileId: string;
  profileName?: string;
  cookies: Array<{
    cookieId: string;
    service: string;
    url: string;
    status: string;
    rawCookieString?: string | null;
    workerStatus?: string;
    sessionHealth?: string;
    lastRotatedAt?: string;
    config: CookieRotationConfig;
  }>;
}

export class CookieRotationConfigService {
  constructor(private cookieRepository: CookieRepository, private monitorRepository: CookieRotationMonitorRepository) {}

  async getProfilesWithConfigs(): Promise<ProfileWithCookieConfig[]> {
    const activeCookies = await this.cookieRepository.findByStatus("active");

    const profileMap = new Map<string, ProfileWithCookieConfig>();

    for (const cookie of activeCookies) {
      if (!profileMap.has(cookie.profileId)) {
        profileMap.set(cookie.profileId, {
          profileId: cookie.profileId,
          profileName: undefined,
          cookies: [],
        });
      }

      const profile = profileMap.get(cookie.profileId)!;

      // Get monitor info if exists to include worker status
      const monitor = await this.monitorRepository.findByProfileAndCookie(cookie.profileId, cookie.id);

      profile.cookies.push({
        cookieId: cookie.id,
        service: cookie.service,
        url: cookie.url,
        rawCookieString: cookie.rawCookieString,
        status: cookie.status,
        workerStatus: monitor?.workerStatus,
        sessionHealth: monitor?.sessionHealth,
        lastRotatedAt: cookie.lastRotatedAt,
        config: {
          cookieId: cookie.id,
          launchWorkerOnStartup: cookie.launchWorkerOnStartup === 1,
          enabledRotationMethods: this.parseJsonArray(cookie.enabledRotationMethods),
          rotationMethodOrder: this.parseJsonArray(cookie.rotationMethodOrder),
          rotationIntervalMinutes: cookie.rotationIntervalMinutes,
        },
      });
    }

    const { profileRepository } = await import("../../../profile-management/repository/profile.repository.js");
    for (const profile of profileMap.values()) {
      try {
        const profileEntity = await profileRepository.findById(profile.profileId);
        if (profileEntity?.name) {
          profile.profileName = profileEntity.name;
        }
      } catch (error) {
        logger.warn(`[CookieRotationConfigService] Failed to fetch profile name for ${profile.profileId}`);
      }
    }

    return Array.from(profileMap.values());
  }

  async updateCookieConfig(cookieId: string, config: Partial<Omit<CookieRotationConfig, "cookieId">>): Promise<void> {
    const updateData: any = {};

    if (config.launchWorkerOnStartup !== undefined) {
      updateData.launchWorkerOnStartup = config.launchWorkerOnStartup ? 1 : 0;
    }

    if (config.enabledRotationMethods !== undefined) {
      updateData.enabledRotationMethods = JSON.stringify(config.enabledRotationMethods);
    }

    if (config.rotationMethodOrder !== undefined) {
      updateData.rotationMethodOrder = JSON.stringify(config.rotationMethodOrder);
    }

    if (config.rotationIntervalMinutes !== undefined) {
      updateData.rotationIntervalMinutes = config.rotationIntervalMinutes;
    }

    await this.cookieRepository.updateRotationConfig(cookieId, updateData);

    logger.info(`[CookieRotationConfigService] Updated config for cookie ${cookieId}`);
  }

  async getCookieConfig(cookieId: string): Promise<CookieRotationConfig | null> {
    const cookie = await this.cookieRepository.findById(cookieId);
    if (!cookie) {
      return null;
    }

    const enabledMethods = cookie.enabledRotationMethods
      ? this.parseJsonArray(cookie.enabledRotationMethods)
      : ["refreshCreds", "rotateCookie"];

    const methodOrder = cookie.rotationMethodOrder
      ? this.parseJsonArray(cookie.rotationMethodOrder)
      : ["refreshCreds", "rotateCookie"];

    const intervalMinutes = cookie.rotationIntervalMinutes || 60;

    return {
      cookieId: cookie.id,
      launchWorkerOnStartup: cookie.launchWorkerOnStartup === 1,
      enabledRotationMethods: enabledMethods as RotationMethod[],
      rotationMethodOrder: methodOrder as RotationMethod[],
      rotationIntervalMinutes: intervalMinutes,
    };
  }

  private parseJsonArray(jsonString: string): RotationMethod[] {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed as RotationMethod[];
      }
    } catch (error) {
      logger.warn(`[CookieRotationConfigService] Failed to parse JSON array: ${jsonString}`);
    }
    return ["refreshCreds", "rotateCookie"];
  }
}

export default CookieRotationConfigService;

/**
 * Backing holder singleton used by IPC handlers and module loader.
 * The real implementation requires a CookieRepository and CookieRotationMonitorRepository instance (needs DB).
 * Modules can call `init` with constructed repositories to wire the service.
 */
class CookieRotationConfigServiceHolder {
  private impl: CookieRotationConfigService | null = null;

  init(cookieRepository: any, monitorRepository: any) {
    this.impl = new CookieRotationConfigService(cookieRepository, monitorRepository);
  }

  async getAll() {
    if (!this.impl) return [];
    return this.impl.getProfilesWithConfigs();
  }

  async update(id: string, patch: any) {
    if (!this.impl) throw new Error("CookieRotationConfigService not initialized");
    return this.impl.updateCookieConfig(id, patch);
  }

  async getCookieConfig(id: string) {
    if (!this.impl) return null;
    return this.impl.getCookieConfig(id);
  }
}

export const cookieRotationConfigService = new CookieRotationConfigServiceHolder();
