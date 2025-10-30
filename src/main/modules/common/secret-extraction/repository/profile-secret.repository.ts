import { BaseRepository } from "../../../../storage/repositories/base.repository";
import { SQLiteDatabase } from "../../../../storage/sqlite-database";
import { database } from "../../../../storage/database";
import { generateUuid as generateId } from "../../../../../core/id";
import { ProfileSecret, SecretType, UpsertProfileSecretInput } from "../types";

/**
 * Database row structure for profile_secrets table
 */
interface ProfileSecretRow {
  id: string;
  profile_id: string;
  cookie_id: string | null;
  secret_type: string;
  secret_value: string;
  extracted_at: string;
  is_valid: number;
  last_validated_at: string | null;
  metadata: string | null;
}

/**
 * Repository for managing profile secrets in the database
 */
export class ProfileSecretRepository extends BaseRepository<ProfileSecret> {
  constructor(db?: SQLiteDatabase) {
    super("profile_secrets", db || database.getSQLiteDatabase());
  }

  /**
   * Convert database row to ProfileSecret entity
   */
  protected rowToEntity(row: unknown): ProfileSecret {
    const secretRow = row as ProfileSecretRow;
    return {
      id: secretRow.id,
      profileId: secretRow.profile_id,
      cookieId: secretRow.cookie_id || undefined,
      secretType: secretRow.secret_type as SecretType,
      secretValue: secretRow.secret_value,
      extractedAt: secretRow.extracted_at,
      isValid: secretRow.is_valid === 1,
      lastValidatedAt: secretRow.last_validated_at || undefined,
      metadata: secretRow.metadata ? JSON.parse(secretRow.metadata) : undefined,
    };
  }

  /**
   * Convert ProfileSecret entity to database row
   */
  protected entityToRow(entity: Partial<ProfileSecret>): Record<string, unknown> {
    return {
      id: entity.id,
      profile_id: entity.profileId,
      cookie_id: entity.cookieId || null,
      secret_type: entity.secretType,
      secret_value: entity.secretValue,
      extracted_at: entity.extractedAt,
      is_valid: entity.isValid ? 1 : 0,
      last_validated_at: entity.lastValidatedAt || null,
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : null,
    };
  }

  /**
   * Find all secrets for a profile
   */
  async findByProfileId(profileId: string): Promise<ProfileSecret[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE profile_id = ? ORDER BY extracted_at DESC`,
      [profileId]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Find a valid secret by profile ID and type
   */
  async findValidSecret(profileId: string, secretType: SecretType): Promise<ProfileSecret | null> {
    const row = await this.db.get(
      `SELECT * FROM ${this.tableName} 
       WHERE profile_id = ? AND secret_type = ? AND is_valid = 1 
       ORDER BY extracted_at DESC LIMIT 1`,
      [profileId, secretType]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find secret by profile ID and type (regardless of validity)
   */
  async findByProfileAndType(profileId: string, secretType: SecretType): Promise<ProfileSecret | null> {
    const row = await this.db.get(
      `SELECT * FROM ${this.tableName} 
       WHERE profile_id = ? AND secret_type = ? 
       ORDER BY extracted_at DESC LIMIT 1`,
      [profileId, secretType]
    );
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Find all secrets by type across all profiles
   */
  async findByType(secretType: SecretType): Promise<ProfileSecret[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE secret_type = ? ORDER BY extracted_at DESC`,
      [secretType]
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Upsert a profile secret (insert or update based on profile + type)
   */
  async upsert(input: UpsertProfileSecretInput): Promise<ProfileSecret> {
    const existing = await this.findByProfileAndType(input.profileId, input.secretType);
    const now = new Date().toISOString();

    const secret: ProfileSecret = {
      id: existing?.id || generateId(),
      profileId: input.profileId,
      cookieId: input.cookieId,
      secretType: input.secretType,
      secretValue: input.secretValue,
      extractedAt: now,
      isValid: true,
      lastValidatedAt: now,
      metadata: input.metadata,
    };

    if (existing) {
      await this.update(secret.id, secret);
    } else {
      await this.insert(secret);
    }

    return secret;
  }

  /**
   * Invalidate a specific secret
   */
  async invalidate(id: string): Promise<void> {
    await this.db.run(
      `UPDATE ${this.tableName} SET is_valid = 0, last_validated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  }

  /**
   * Invalidate all secrets for a profile
   */
  async invalidateAll(profileId: string): Promise<void> {
    await this.db.run(
      `UPDATE ${this.tableName} SET is_valid = 0, last_validated_at = ? WHERE profile_id = ?`,
      [new Date().toISOString(), profileId]
    );
  }

  /**
   * Invalidate all secrets of a specific type for a profile
   */
  async invalidateByType(profileId: string, secretType: SecretType): Promise<void> {
    await this.db.run(
      `UPDATE ${this.tableName} SET is_valid = 0, last_validated_at = ? WHERE profile_id = ? AND secret_type = ?`,
      [new Date().toISOString(), profileId, secretType]
    );
  }

  /**
   * Delete all secrets for a profile
   */
  async deleteByProfileId(profileId: string): Promise<void> {
    await this.db.run(`DELETE FROM ${this.tableName} WHERE profile_id = ?`, [profileId]);
  }

  /**
   * Get all valid secrets (for admin/debugging)
   */
  async getAllValid(): Promise<ProfileSecret[]> {
    const rows = await this.db.all(
      `SELECT * FROM ${this.tableName} WHERE is_valid = 1 ORDER BY profile_id, secret_type`
    );
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Count secrets by profile
   */
  async countByProfileId(profileId: string): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE profile_id = ?`,
      [profileId]
    );
    return result?.count || 0;
  }
}

// Export singleton using lazy Proxy pattern (worker thread safe)
let _profileSecretRepositoryInstance: ProfileSecretRepository | null = null;

function getProfileSecretRepository(): ProfileSecretRepository {
  if (!_profileSecretRepositoryInstance) {
    _profileSecretRepositoryInstance = new ProfileSecretRepository();
  }
  return _profileSecretRepositoryInstance;
}

export const profileSecretRepository = new Proxy({} as ProfileSecretRepository, {
  get(_target, prop) {
    return getProfileSecretRepository()[prop as keyof ProfileSecretRepository];
  },
});
