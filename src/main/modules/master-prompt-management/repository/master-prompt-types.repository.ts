import { SQLiteDatabase } from "../../../storage/sqlite-database";
import { database } from "../../../storage/database";

/**
 * Master Prompt Type
 * Represents a category/type of prompt (script, topic, video_prompt, audio_prompt)
 */
export interface MasterPromptType {
  id?: number;
  typeName: string;
  typeCode: string;
  description?: string;
  status: number; // 0 = inactive, 1 = active
  createdAt?: string;
}

export interface CreateMasterPromptTypeInput {
  typeName: string;
  typeCode: string;
  description?: string;
  status?: number;
}

export interface UpdateMasterPromptTypeInput {
  typeName?: string;
  typeCode?: string;
  description?: string;
  status?: number;
}

/**
 * Master Prompt Types Repository
 * Manages prompt type references in the database
 */
export class MasterPromptTypesRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get all prompt types
   */
  async getAll(): Promise<MasterPromptType[]> {
    const rows = await this.db.all<any>(`
			SELECT 
				id,
				type_name as typeName,
				type_code as typeCode,
				description,
				status,
				created_at as createdAt
			FROM master_prompt_types
			ORDER BY type_name
		`);

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          typeName: r.typeName,
          typeCode: r.typeCode,
          description: r.description,
          status: r.status ?? 1,
          createdAt: r.createdAt,
        } as MasterPromptType)
    );
  }

  /**
   * Get prompt type by ID
   */
  async getById(id: number): Promise<MasterPromptType | undefined> {
    const r = await this.db.get<any>(
      `
			SELECT 
				id,
				type_name as typeName,
				type_code as typeCode,
				description,
				status,
				created_at as createdAt
			FROM master_prompt_types
			WHERE id = ?
		`,
      [id]
    );

    if (!r) return undefined;
    return {
      id: r.id,
      typeName: r.typeName,
      typeCode: r.typeCode,
      description: r.description,
      status: r.status ?? 1,
      createdAt: r.createdAt,
    } as MasterPromptType;
  }

  /**
   * Get prompt type by name
   */
  async getByName(typeName: string): Promise<MasterPromptType | undefined> {
    const r = await this.db.get<any>(
      `
			SELECT 
				id,
				type_name as typeName,
				type_code as typeCode,
				description,
				status,
				created_at as createdAt
			FROM master_prompt_types
			WHERE type_name = ?
		`,
      [typeName]
    );

    if (!r) return undefined;
    return {
      id: r.id,
      typeName: r.typeName,
      typeCode: r.typeCode,
      description: r.description,
      status: r.status ?? 1,
      createdAt: r.createdAt,
    } as MasterPromptType;
  }

  /**
   * Create new prompt type
   */
  async create(input: CreateMasterPromptTypeInput): Promise<MasterPromptType> {
    const now = new Date().toISOString();
    const result = await this.db.run(
      `
			INSERT INTO master_prompt_types (
				type_name,
				type_code,
				description,
				status,
				created_at
			) VALUES (?, ?, ?, ?, ?)
		`,
      [
        input.typeName,
        input.typeCode,
        input.description || "",
        input.status ?? 1,
        now,
      ]
    );

    return (await this.getById(result.lastID!))!;
  }

  /**
   * Update prompt type
   */
  async update(
    id: number,
    updates: UpdateMasterPromptTypeInput
  ): Promise<MasterPromptType | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.typeName !== undefined) {
      fields.push("type_name = ?");
      values.push(updates.typeName);
    }
    if (updates.typeCode !== undefined) {
      fields.push("type_code = ?");
      values.push(updates.typeCode);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push("status = ?");
      values.push(updates.status);
    }

    if (fields.length === 0) return existing;

    values.push(id);
    const sql = `UPDATE master_prompt_types SET ${fields.join(
      ", "
    )} WHERE id = ?`;

    try {
      const result = await this.db.run(sql, values);
      console.log("[prompt-types.repository] UPDATE executed:", {
        sql,
        values,
        changes: (result as any)?.changes,
      });
    } catch (err) {
      console.error("[prompt-types.repository] Failed to run UPDATE", {
        sql,
        values,
        err,
      });
      throw err;
    }

    return this.getById(id);
  }

  /**
   * Delete prompt type
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.run(
      "DELETE FROM master_prompt_types WHERE id = ?",
      [id]
    );
    return result.changes !== undefined && result.changes > 0;
  }

  /**
   * Check if type exists by name
   */
  async exists(typeName: string): Promise<boolean> {
    const result = await this.db.get<{ count: number }>(
      `
			SELECT COUNT(*) as count FROM master_prompt_types WHERE type_name = ?
		`,
      [typeName]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Check if type code exists
   */
  async existsByCode(typeCode: string): Promise<boolean> {
    const result = await this.db.get<{ count: number }>(
      `
			SELECT COUNT(*) as count FROM master_prompt_types WHERE type_code = ?
		`,
      [typeCode]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Count all prompt types
   */
  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(`
			SELECT COUNT(*) as count FROM master_prompt_types
		`);
    return result?.count || 0;
  }
}

// Export singleton instance
export const promptTypesRepository = new MasterPromptTypesRepository(
  database.getSQLiteDatabase()
);
