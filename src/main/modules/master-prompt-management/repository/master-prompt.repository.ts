import { SQLiteDatabase } from "../../../storage/sqlite-database";
import { database } from "../../../storage/database";
import { MasterPromptType } from "./master-prompt-types.repository";

/**
 * Prompt type enumeration
 * Categorizes prompts by their function in the workflow
 */
export enum PromptType {
  SCRIPT = "script",
  TOPIC = "topic",
  VIDEO_PROMPT = "video_prompt",
  AUDIO_PROMPT = "audio_prompt",
}

export const PROMPT_TYPES = [
  PromptType.SCRIPT,
  PromptType.TOPIC,
  PromptType.VIDEO_PROMPT,
  PromptType.AUDIO_PROMPT,
];

export interface MasterPrompt {
  id?: number;
  provider: string;
  promptTemplate: string;
  description?: string;
  promptTypeId: number; // Foreign key to master_prompt_types
  promptType?: MasterPromptType; // Full prompt type object with typeName, typeCode, etc
  channelId?: string | null; // Optional: link to specific channel (null = global prompt)
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  variableOccurrencesConfig?: Record<string, number[]> | null; // JSON object mapping variable names to selected occurrence indices
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMasterPromptInput {
  provider: string;
  promptTemplate: string;
  promptTypeId: number; // Reference to master_prompt_types
  description?: string;
  channelId?: string | null;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  variableOccurrencesConfig?: Record<string, number[]> | null;
}

export interface UpdateMasterPromptInput {
  provider?: string;
  promptTemplate?: string;
  promptTypeId?: number;
  description?: string;
  channelId?: string | null;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  variableOccurrencesConfig?: Record<string, number[]> | null;
}

export class MasterPromptsRepository {
  constructor(private db: SQLiteDatabase) {}

  async getAll(): Promise<MasterPrompt[]> {
    const rows = await this.db.all<any>(`
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.variable_occurrences_config as variableOccurrencesConfig,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			ORDER BY mp.provider
		`);

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? ({
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.description,
                status: r.typeStatus ?? 1,
                createdAt: r.typeCreatedAt,
              } as MasterPromptType)
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          variableOccurrencesConfig:
            tryParseJson(r.variableOccurrencesConfig) || null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  async getById(id: number): Promise<MasterPrompt | undefined> {
    const r = await this.db.get<any>(
      `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.variable_occurrences_config as variableOccurrencesConfig,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mp.id = ?
		`,
      [id]
    );

    if (!r) return undefined;
    return {
      id: r.id,
      provider: r.provider,
      promptTemplate: r.promptTemplate,
      description: r.description,
      promptTypeId: r.promptTypeId,
      promptType: r.typeId
        ? ({
            id: r.typeId,
            typeName: r.typeName,
            typeCode: r.typeCode,
            description: r.description,
            status: r.typeStatus ?? 1,
            createdAt: r.typeCreatedAt,
          } as MasterPromptType)
        : undefined,
      channelId: r.channelId,
      tags: tryParseJson(r.tags) || [],
      isActive: r.isActive === 1 || r.isActive === true,
      archived: r.archived === 1 || r.archived === true,
      variableOccurrencesConfig:
        tryParseJson(r.variableOccurrencesConfig) || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    } as MasterPrompt;
  }

  async getByProvider(provider: string): Promise<MasterPrompt[]> {
    const rows = await this.db.all<any>(
      `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.description as typeDescription,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mp.provider = ?
			ORDER BY mp.provider
		`,
      [provider]
    );

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? {
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.typeDescription,
                status: r.typeStatus,
                createdAt: r.typeCreatedAt,
              }
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  async getByChannelId(channelId: string): Promise<MasterPrompt[]> {
    const rows = await this.db.all<any>(
      `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.description as typeDescription,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mp.channel_id = ?
			ORDER BY mp.provider
		`,
      [channelId]
    );

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? {
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.typeDescription,
                status: r.typeStatus,
                createdAt: r.typeCreatedAt,
              }
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  async countByChannelId(channelId: string): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      `
			SELECT COUNT(*) as count
			FROM master_prompts
			WHERE channel_id = ?
		`,
      [channelId]
    );
    return result?.count || 0;
  }

  async create(input: CreateMasterPromptInput): Promise<MasterPrompt> {
    const now = new Date().toISOString();
    const result = await this.db.run(
      `
			INSERT INTO master_prompts (
				provider,
				prompt_template,
				prompt_type_id,
				description,
				channel_id,
				tags,
				is_active,
				archived,
				variable_occurrences_config,
				created_at,
				updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
      [
        input.provider,
        input.promptTemplate,
        input.promptTypeId,
        input.description || "",
        input.channelId || null,
        input.tags
          ? Array.isArray(input.tags)
            ? JSON.stringify(input.tags)
            : String(input.tags)
          : JSON.stringify([]),
        1,
        0,
        input.variableOccurrencesConfig
          ? JSON.stringify(input.variableOccurrencesConfig)
          : null,
        now,
        now,
      ]
    );

    return (await this.getById(result.lastID!))!;
  }

  async update(
    id: number,
    updates: UpdateMasterPromptInput
  ): Promise<MasterPrompt | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.provider !== undefined) {
      fields.push("provider = ?");
      values.push(updates.provider);
    }
    if (updates.promptTemplate !== undefined) {
      fields.push("prompt_template = ?");
      values.push(updates.promptTemplate);
    }
    if (updates.promptTypeId !== undefined) {
      fields.push("prompt_type_id = ?");
      values.push(updates.promptTypeId);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.channelId !== undefined) {
      fields.push("channel_id = ?");
      values.push(updates.channelId || null);
    }
    if ((updates as any).tags !== undefined) {
      fields.push("tags = ?");
      values.push(
        Array.isArray((updates as any).tags)
          ? JSON.stringify((updates as any).tags)
          : String((updates as any).tags)
      );
    }
    if ((updates as any).isActive !== undefined) {
      fields.push("is_active = ?");
      values.push((updates as any).isActive ? 1 : 0);
    }
    if ((updates as any).archived !== undefined) {
      fields.push("archived = ?");
      values.push((updates as any).archived ? 1 : 0);
    }
    if ((updates as any).variableOccurrencesConfig !== undefined) {
      fields.push("variable_occurrences_config = ?");
      values.push(
        (updates as any).variableOccurrencesConfig
          ? JSON.stringify((updates as any).variableOccurrencesConfig)
          : null
      );
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    const sql = `UPDATE master_prompts SET ${fields.join(", ")} WHERE id = ?`;
    // Debug logging to verify SQL and parameters at runtime (helps diagnose persistence issues)
    try {
      const result = await this.db.run(sql, values);
      // If sqlite3 RunResult has changes, log it for inspection
      console.log("[prompt.repository] UPDATE executed:", {
        sql,
        values,
        changes: (result as any)?.changes,
        lastID: (result as any)?.lastID,
      });
    } catch (err) {
      console.error("[prompt.repository] Failed to run UPDATE", {
        sql,
        values,
        err,
      });
      throw err;
    }
    return this.getById(id);
  }

  async archive(id: number): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db.run(
      `UPDATE master_prompts SET archived = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
    return (
      (result as any)?.changes !== undefined && (result as any).changes > 0
    );
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.run(
      "DELETE FROM master_prompts WHERE id = ?",
      [id]
    );
    return result.changes !== undefined && result.changes > 0;
  }

  /**
   * Get all prompts of a specific type
   * @param promptType - Type of prompt (script, topic, video_prompt, audio_prompt)
   */
  async getByType(promptType: PromptType): Promise<MasterPrompt[]> {
    const rows = await this.db.all<any>(
      `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.description as typeDescription,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mpt.type_code = ? AND mp.is_active = 1 AND mp.archived = 0
			ORDER BY mp.provider
		`,
      [promptType]
    );

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? {
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.typeDescription,
                status: r.typeStatus,
                createdAt: r.typeCreatedAt,
              }
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  /**
   * Get prompts for a specific channel, optionally filtered by type
   * @param channelId - Channel ID
   * @param promptType - Optional: filter by prompt type
   */
  async getByChannel(
    channelId: string,
    promptType?: PromptType
  ): Promise<MasterPrompt[]> {
    let sql = `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.description as typeDescription,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mp.channel_id = ? AND mp.is_active = 1 AND mp.archived = 0
		`;
    const params: any[] = [channelId];

    if (promptType) {
      sql += ` AND mpt.type_code = ?`;
      params.push(promptType);
    }

    sql += ` ORDER BY mp.provider`;

    const rows = await this.db.all<any>(sql, params);

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? {
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.typeDescription,
                status: r.typeStatus,
                createdAt: r.typeCreatedAt,
              }
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  /**
   * Get global prompts (not associated with any channel), optionally filtered by type
   * @param promptType - Optional: filter by prompt type
   */
  async getGlobalPrompts(promptType?: PromptType): Promise<MasterPrompt[]> {
    let sql = `
			SELECT 
				mp.id,
				mp.provider,
				mp.prompt_template as promptTemplate,
				mp.description,
				mp.prompt_type_id as promptTypeId,
				mpt.id as typeId,
				mpt.type_name as typeName,
				mpt.type_code as typeCode,
				mpt.description as typeDescription,
				mpt.status as typeStatus,
				mpt.created_at as typeCreatedAt,
				mp.channel_id as channelId,
				mp.tags,
				mp.is_active as isActive,
				mp.archived,
				mp.created_at as createdAt,
				mp.updated_at as updatedAt
			FROM master_prompts mp
			LEFT JOIN master_prompt_types mpt ON mp.prompt_type_id = mpt.id
			WHERE mp.channel_id IS NULL AND mp.is_active = 1 AND mp.archived = 0
		`;
    const params: any[] = [];

    if (promptType) {
      sql += ` AND mpt.type_code = ?`;
      params.push(promptType);
    }

    sql += ` ORDER BY mp.provider`;

    const rows = await this.db.all<any>(sql, params);

    return rows.map(
      (r: any) =>
        ({
          id: r.id,
          provider: r.provider,
          promptTemplate: r.promptTemplate,
          description: r.description,
          promptTypeId: r.promptTypeId,
          promptType: r.typeId
            ? {
                id: r.typeId,
                typeName: r.typeName,
                typeCode: r.typeCode,
                description: r.typeDescription,
                status: r.typeStatus,
                createdAt: r.typeCreatedAt,
              }
            : undefined,
          channelId: r.channelId,
          tags: tryParseJson(r.tags) || [],
          isActive: r.isActive === 1 || r.isActive === true,
          archived: r.archived === 1 || r.archived === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as MasterPrompt)
    );
  }

  extractVariables(template: string): string[] {
    const matches = template.match(/\[([A-Z_]+)\]/g);
    return matches ? matches.map((m) => m.slice(1, -1)) : [];
  }

  populateTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\[${key}\\]`, "g"), value);
    }
    return result;
  }
}

// Export module-level singleton
export const promptRepository = new MasterPromptsRepository(
  database.getSQLiteDatabase()
);

function tryParseJson(raw: any): any | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch (e) {
    return undefined;
  }
}
