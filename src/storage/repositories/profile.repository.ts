import { Profile } from "../../types";
import { sqliteDatabase } from "../sqlite-database";
import { BaseRepository } from "./base.repository";

interface ProfileRow {
  id: string;
  name: string;
  browser_path: string | null;
  user_data_dir: string;
  proxy_server: string | null;
  proxy_username: string | null;
  proxy_password: string | null;
  credit_remaining: number;
  cookies: string | null;
  cookie_expires: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Profile entities
 */
export class ProfileRepository extends BaseRepository<Profile> {
  constructor() {
    super("profiles", sqliteDatabase);
  }

  protected rowToEntity(row: ProfileRow): Profile {
    const profile: Profile = {
      id: row.id,
      name: row.name,
      browserPath: row.browser_path || undefined,
      userDataDir: row.user_data_dir,
      creditRemaining: row.credit_remaining,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // Parse proxy if exists
    if (row.proxy_server) {
      profile.proxy = {
        server: row.proxy_server,
        username: row.proxy_username || undefined,
        password: row.proxy_password || undefined,
      };
    }

    // Parse cookies if exists
    if (row.cookies) {
      try {
        profile.cookies = JSON.parse(row.cookies);
      } catch (e) {
        profile.cookies = undefined;
      }
    }

    // Parse cookie expires
    if (row.cookie_expires) {
      profile.cookieExpires = new Date(row.cookie_expires);
    }

    return profile;
  }

  protected entityToRow(entity: Partial<Profile>): Partial<ProfileRow> {
    const row: Partial<ProfileRow> = {};

    if (entity.id) row.id = entity.id;
    if (entity.name) row.name = entity.name;
    if (entity.browserPath !== undefined) row.browser_path = entity.browserPath || null;
    if (entity.userDataDir) row.user_data_dir = entity.userDataDir;
    if (entity.creditRemaining !== undefined) row.credit_remaining = entity.creditRemaining;

    // Serialize proxy
    if (entity.proxy) {
      row.proxy_server = entity.proxy.server;
      row.proxy_username = entity.proxy.username || null;
      row.proxy_password = entity.proxy.password || null;
    }

    // Serialize cookies
    if (entity.cookies !== undefined) {
      row.cookies = entity.cookies ? JSON.stringify(entity.cookies) : null;
    }

    // Serialize cookie expires
    if (entity.cookieExpires !== undefined) {
      row.cookie_expires = entity.cookieExpires ? entity.cookieExpires.toISOString() : null;
    }

    if (entity.createdAt) row.created_at = entity.createdAt.toISOString();
    if (entity.updatedAt) row.updated_at = entity.updatedAt.toISOString();

    return row;
  }

  /**
   * Update profile credit
   */
  async updateCredit(id: string, amount: number): Promise<void> {
    await this.db.run(`UPDATE ${this.tableName} SET credit_remaining = ?, updated_at = ? WHERE id = ?`, [
      amount,
      new Date().toISOString(),
      id,
    ]);
  }
}

export const profileRepository = new ProfileRepository();
