import { SQLiteDatabase } from '../../../storage/sqlite-database';
import { database } from '../../../storage/database';

export interface MasterPrompt {
	id?: number;
	provider: string;
	promptKind: string;
	promptTemplate: string;
	description?: string;
	tags?: string[];
	isActive?: boolean;
	archived?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateMasterPromptInput {
	provider: string;
	promptKind: string;
	promptTemplate: string;
	description?: string;
	tags?: string[];
	isActive?: boolean;
	archived?: boolean;
}

export interface UpdateMasterPromptInput {
	provider?: string;
	promptKind?: string;
	promptTemplate?: string;
	description?: string;
	tags?: string[];
	isActive?: boolean;
	archived?: boolean;
}

export class MasterPromptsRepository {
	constructor(private db: SQLiteDatabase) {}

	async getAll(): Promise<MasterPrompt[]> {
		const rows = await this.db.all<any>(`
			SELECT 
				id,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				created_at as createdAt,
				updated_at as updatedAt
			FROM master_prompts
			ORDER BY provider, prompt_kind
		`);

		return rows.map((r: any) => ({
			id: r.id,
			provider: r.provider,
			promptKind: r.promptKind,
			promptTemplate: r.promptTemplate,
			description: r.description,
			tags: tryParseJson(r.tags) || [],
			isActive: r.isActive === 1 || r.isActive === true,
			archived: r.archived === 1 || r.archived === true,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		} as MasterPrompt));
	}

	async getById(id: number): Promise<MasterPrompt | undefined> {
		const r = await this.db.get<any>(`
			SELECT 
				id,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				created_at as createdAt,
				updated_at as updatedAt
			FROM master_prompts
			WHERE id = ?
		`, [id]);

		if (!r) return undefined;
		return {
			id: r.id,
			provider: r.provider,
			promptKind: r.promptKind,
			promptTemplate: r.promptTemplate,
			description: r.description,
			tags: tryParseJson(r.tags) || [],
			isActive: r.isActive === 1 || r.isActive === true,
			archived: r.archived === 1 || r.archived === true,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		} as MasterPrompt;
	}

	async getByProvider(provider: string): Promise<MasterPrompt[]> {
		const rows = await this.db.all<any>(`
			SELECT 
				id,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				created_at as createdAt,
				updated_at as updatedAt
			FROM master_prompts
			WHERE provider = ?
			ORDER BY prompt_kind
		`, [provider]);

		return rows.map((r: any) => ({
			id: r.id,
			provider: r.provider,
			promptKind: r.promptKind,
			promptTemplate: r.promptTemplate,
			description: r.description,
			tags: tryParseJson(r.tags) || [],
			isActive: r.isActive === 1 || r.isActive === true,
			archived: r.archived === 1 || r.archived === true,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		} as MasterPrompt));
	}

	async getByKind(promptKind: string): Promise<MasterPrompt[]> {
		const rows = await this.db.all<any>(`
			SELECT 
				id,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				created_at as createdAt,
				updated_at as updatedAt
			FROM master_prompts
			WHERE prompt_kind = ?
			ORDER BY provider
		`, [promptKind]);

		return rows.map((r: any) => ({
			id: r.id,
			provider: r.provider,
			promptKind: r.promptKind,
			promptTemplate: r.promptTemplate,
			description: r.description,
			tags: tryParseJson(r.tags) || [],
			isActive: r.isActive === 1 || r.isActive === true,
			archived: r.archived === 1 || r.archived === true,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		} as MasterPrompt));
	}

	async getByProviderAndKind(provider: string, promptKind: string): Promise<MasterPrompt | undefined> {
		const r = await this.db.get<any>(`
			SELECT 
				id,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				created_at as createdAt,
				updated_at as updatedAt
			FROM master_prompts
			WHERE provider = ? AND prompt_kind = ?
		`, [provider, promptKind]);

		if (!r) return undefined;
		return {
			id: r.id,
			provider: r.provider,
			promptKind: r.promptKind,
			promptTemplate: r.promptTemplate,
			description: r.description,
			tags: tryParseJson(r.tags) || [],
			isActive: r.isActive === 1 || r.isActive === true,
			archived: r.archived === 1 || r.archived === true,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
		} as MasterPrompt;
	}

	async create(input: CreateMasterPromptInput): Promise<MasterPrompt> {
		const now = new Date().toISOString();
		const result = await this.db.run(`
			INSERT INTO master_prompts (
				provider,
				prompt_kind,
				prompt_template,
				description,
				tags,
				is_active,
				archived,
				created_at,
				updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, [
			input.provider,
			input.promptKind,
			input.promptTemplate,
			input.description || '',
			input.tags ? (Array.isArray(input.tags) ? JSON.stringify(input.tags) : String(input.tags)) : JSON.stringify([]),
			1,
			0,
			now,
			now,
		]);

		return (await this.getById(result.lastID!))!;
	}

	async update(id: number, updates: UpdateMasterPromptInput): Promise<MasterPrompt | undefined> {
		const existing = await this.getById(id);
		if (!existing) return undefined;

		const now = new Date().toISOString();
		const fields: string[] = [];
		const values: any[] = [];

		if (updates.provider !== undefined) { fields.push('provider = ?'); values.push(updates.provider); }
		if (updates.promptKind !== undefined) { fields.push('prompt_kind = ?'); values.push(updates.promptKind); }
		if (updates.promptTemplate !== undefined) { fields.push('prompt_template = ?'); values.push(updates.promptTemplate); }
		if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
		if ((updates as any).tags !== undefined) { fields.push('tags = ?'); values.push(Array.isArray((updates as any).tags) ? JSON.stringify((updates as any).tags) : String((updates as any).tags)); }
		if ((updates as any).isActive !== undefined) { fields.push('is_active = ?'); values.push((updates as any).isActive ? 1 : 0); }
		if ((updates as any).archived !== undefined) { fields.push('archived = ?'); values.push((updates as any).archived ? 1 : 0); }

		if (fields.length === 0) return existing;

		fields.push('updated_at = ?');
		values.push(now);
		values.push(id);

		const sql = `UPDATE master_prompts SET ${fields.join(', ')} WHERE id = ?`;
		// Debug logging to verify SQL and parameters at runtime (helps diagnose persistence issues)
		try {
			const result = await this.db.run(sql, values);
			// If sqlite3 RunResult has changes, log it for inspection
			console.log('[prompt.repository] UPDATE executed:', { sql, values, changes: (result as any)?.changes, lastID: (result as any)?.lastID });
		} catch (err) {
			console.error('[prompt.repository] Failed to run UPDATE', { sql, values, err });
			throw err;
		}
		return this.getById(id);
	}

	async archive(id: number): Promise<boolean> {
		const now = new Date().toISOString();
		const result = await this.db.run(`UPDATE master_prompts SET archived = 1, updated_at = ? WHERE id = ?`, [now, id]);
		return (result as any)?.changes !== undefined && (result as any).changes > 0;
	}

	async delete(id: number): Promise<boolean> {
		const result = await this.db.run('DELETE FROM master_prompts WHERE id = ?', [id]);
		return result.changes !== undefined && result.changes > 0;
	}

	extractVariables(template: string): string[] {
		const matches = template.match(/\[([A-Z_]+)\]/g);
		return matches ? matches.map(m => m.slice(1, -1)) : [];
	}

	populateTemplate(template: string, variables: Record<string, string>): string {
		let result = template;
		for (const [key, value] of Object.entries(variables)) {
			result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
		}
		return result;
	}
}

// Export module-level singleton
export const promptRepository = new MasterPromptsRepository(database.getSQLiteDatabase());

function tryParseJson(raw: any): any | undefined {
	if (raw === null || raw === undefined) return undefined;
	if (typeof raw === 'object') return raw;
	try {
		return JSON.parse(String(raw));
	} catch (e) {
		return undefined;
	}
}
