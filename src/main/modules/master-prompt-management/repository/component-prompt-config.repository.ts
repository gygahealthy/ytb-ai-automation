import { SQLiteDatabase } from "../../../storage/sqlite-database";
import { database } from "../../../storage/database";
import { randomUUID } from "crypto";

export interface ComponentPromptConfig {
  id: string;
  componentName: string;
  profileId: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConfigInput {
  componentName: string;
  profileId: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
}

export interface UpdateConfigInput {
  promptId?: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
}

export class ComponentPromptConfigRepository {
  constructor(private db: SQLiteDatabase) {}

  // Generate possible alternatives for component name by switching
  // the last separator between '-' and '|' so we can match older
  // stored values or new ones using the pipe separator.
  private generateComponentNameAlternatives(name: string): string[] {
    if (!name) return [name];
    const idxDash = name.lastIndexOf("-");
    const idxPipe = name.lastIndexOf("|");
    const idx = Math.max(idxDash, idxPipe);
    if (idx === -1) return [name];
    const prefix = name.slice(0, idx);
    const suffix = name.slice(idx + 1);
    const altDash = `${prefix}-${suffix}`;
    const altPipe = `${prefix}|${suffix}`;
    const set = new Set<string>([name, altDash, altPipe]);
    return Array.from(set);
  }

  /**
   * Get all component prompt configurations
   */
  async getAll(): Promise<ComponentPromptConfig[]> {
    const rows = await this.db.all<any>(`
      SELECT 
        id,
        component_name as componentName,
        profile_id as profileId,
        prompt_id as promptId,
        ai_model as aiModel,
        enabled,
        use_temp_chat as useTempChat,
        keep_context as keepContext,
        created_at as createdAt,
        updated_at as updatedAt
      FROM component_prompt_configs
      ORDER BY component_name
    `);

    return rows.map((r: any) => ({
      id: r.id,
      componentName: r.componentName,
      profileId: r.profileId,
      promptId: r.promptId,
      aiModel: r.aiModel,
      enabled: r.enabled === 1 || r.enabled === true,
      useTempChat: r.useTempChat === 1 || r.useTempChat === true,
      keepContext: r.keepContext === 1 || r.keepContext === true,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Get configuration by component name
   */
  async getByComponentName(componentName: string): Promise<ComponentPromptConfig | undefined> {
    console.log(`[ComponentPromptConfigRepository] Searching for component: "${componentName}"`);

    // Try exact match first
    let row = await this.db.get<any>(
      `
      SELECT 
        id,
        component_name as componentName,
        profile_id as profileId,
        prompt_id as promptId,
        ai_model as aiModel,
        enabled,
        use_temp_chat as useTempChat,
        keep_context as keepContext,
        created_at as createdAt,
        updated_at as updatedAt
      FROM component_prompt_configs
      WHERE component_name = ?
    `,
      [componentName]
    );

    console.log(`[ComponentPromptConfigRepository] Exact match result for "${componentName}":`, row ? "found" : "not found");

    if (!row) {
      // If the provided name is likely a suffix (no '-' or '|'), try matching any stored
      // component_name that ends with '-suffix' or '|suffix'. This allows the UI to send
      // only the suffix while still finding previously stored full names.
      if (!componentName.includes("-") && !componentName.includes("|")) {
        console.log(`[ComponentPromptConfigRepository] Trying suffix match for: "${componentName}"`);
        row = await this.db.get<any>(
          `
        SELECT 
          id,
          component_name as componentName,
          profile_id as profileId,
          prompt_id as promptId,
          ai_model as aiModel,
          enabled,
          use_temp_chat as useTempChat,
          keep_context as keepContext,
          created_at as createdAt,
          updated_at as updatedAt
        FROM component_prompt_configs
        WHERE component_name LIKE ? OR component_name LIKE ?
      `,
          [`%-${componentName}`, `%|${componentName}`]
        );
        console.log(`[ComponentPromptConfigRepository] Suffix match result:`, row ? "found" : "not found");
      } else {
        // if it contains a separator, try both dash and pipe variants
        const alternatives = this.generateComponentNameAlternatives(componentName);
        console.log(`[ComponentPromptConfigRepository] Trying alternatives:`, alternatives);
        for (const alt of alternatives) {
          row = await this.db.get<any>(
            `
        SELECT 
          id,
          component_name as componentName,
          profile_id as profileId,
          prompt_id as promptId,
          ai_model as aiModel,
          enabled,
          use_temp_chat as useTempChat,
          keep_context as keepContext,
          created_at as createdAt,
          updated_at as updatedAt
        FROM component_prompt_configs
        WHERE component_name = ?
      `,
            [alt]
          );
          if (row) {
            console.log(`[ComponentPromptConfigRepository] Found with alternative: "${alt}"`);
            break;
          }
        }
      }
    }

    if (!row) {
      console.log(`[ComponentPromptConfigRepository] No configuration found for: "${componentName}"`);
      return undefined;
    }

    console.log(`[ComponentPromptConfigRepository] Returning config for: "${row.componentName}"`);
    return {
      id: row.id,
      componentName: row.componentName,
      profileId: row.profileId,
      promptId: row.promptId,
      aiModel: row.aiModel,
      enabled: row.enabled === 1 || row.enabled === true,
      useTempChat: row.useTempChat === 1 || row.useTempChat === true,
      keepContext: row.keepContext === 1 || row.keepContext === true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Get configuration by ID
   */
  async getById(id: string): Promise<ComponentPromptConfig | undefined> {
    const row = await this.db.get<any>(
      `
      SELECT 
        id,
        component_name as componentName,
        profile_id as profileId,
        prompt_id as promptId,
        ai_model as aiModel,
        enabled,
        use_temp_chat as useTempChat,
        keep_context as keepContext,
        created_at as createdAt,
        updated_at as updatedAt
      FROM component_prompt_configs
      WHERE id = ?
    `,
      [id]
    );

    if (!row) return undefined;

    return {
      id: row.id,
      componentName: row.componentName,
      profileId: row.profileId,
      promptId: row.promptId,
      aiModel: row.aiModel,
      enabled: row.enabled === 1 || row.enabled === true,
      useTempChat: row.useTempChat === 1 || row.useTempChat === true,
      keepContext: row.keepContext === 1 || row.keepContext === true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Create a new configuration
   */
  async create(input: CreateConfigInput): Promise<ComponentPromptConfig> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `
      INSERT INTO component_prompt_configs (
        id, component_name, profile_id, prompt_id, ai_model, enabled, use_temp_chat, keep_context, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        input.componentName,
        input.profileId,
        input.promptId,
        input.aiModel || "GEMINI_2_5_PRO",
        input.enabled !== false ? 1 : 0,
        input.useTempChat === true ? 1 : 0,
        input.keepContext === true ? 1 : 0,
        now,
        now,
      ]
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error("Failed to create component prompt config");
    }

    return created;
  }

  /**
   * Update configuration by component name
   */
  async updateByComponentName(componentName: string, updates: UpdateConfigInput): Promise<ComponentPromptConfig | undefined> {
    const existing = await this.getByComponentName(componentName);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.promptId !== undefined) {
      fields.push("prompt_id = ?");
      values.push(updates.promptId);
    }

    if (updates.aiModel !== undefined) {
      fields.push("ai_model = ?");
      values.push(updates.aiModel);
    }

    if (updates.enabled !== undefined) {
      fields.push("enabled = ?");
      values.push(updates.enabled ? 1 : 0);
    }

    if (updates.useTempChat !== undefined) {
      fields.push("use_temp_chat = ?");
      values.push(updates.useTempChat ? 1 : 0);
    }

    if (updates.keepContext !== undefined) {
      fields.push("keep_context = ?");
      values.push(updates.keepContext ? 1 : 0);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push("updated_at = ?");
    values.push(now);
    // use the actual stored component name in the WHERE clause
    values.push(existing.componentName);

    await this.db.run(
      `
      UPDATE component_prompt_configs 
      SET ${fields.join(", ")} 
      WHERE component_name = ?
    `,
      values
    );

    return await this.getByComponentName(existing.componentName);
  }

  /**
   * Upsert (insert or update) configuration
   */
  async upsert(input: CreateConfigInput): Promise<ComponentPromptConfig> {
    const existing = await this.getByComponentName(input.componentName);

    if (existing) {
      const updated = await this.updateByComponentName(input.componentName, {
        promptId: input.promptId,
        aiModel: input.aiModel,
        enabled: input.enabled,
        useTempChat: input.useTempChat,
        keepContext: input.keepContext,
      });
      if (!updated) {
        throw new Error("Failed to update component prompt config");
      }
      return updated;
    }

    return await this.create(input);
  }

  /**
   * Delete configuration by component name
   */
  async deleteByComponentName(componentName: string): Promise<boolean> {
    // Try to find the actual stored component name (could be with '-' or '|')
    const existing = await this.getByComponentName(componentName);
    if (!existing) return false;

    const result = await this.db.run("DELETE FROM component_prompt_configs WHERE component_name = ?", [existing.componentName]);

    return (result.changes || 0) > 0;
  }

  /**
   * Delete configuration by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.run("DELETE FROM component_prompt_configs WHERE id = ?", [id]);

    return (result.changes || 0) > 0;
  }
}

// Singleton instance
export const componentPromptConfigRepository = new ComponentPromptConfigRepository(database.getSQLiteDatabase());
