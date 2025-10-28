import { SQLiteDatabase } from "../../../storage/sqlite-database";
import * as crypto from "crypto";

export interface PromptHistory {
  id?: number;
  promptId: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  changeNote?: string;
  createdAt?: string;
}

export interface CreatePromptHistoryInput {
  promptId: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
  changeNote?: string;
}

function tryParseJson(str: string | null | undefined): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeTags(tags: string[] | undefined | null): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags
    .map((t) => (t || "").toString().trim().toLowerCase())
    .filter((t) => t.length > 0)
    .sort();
}

function computeDigest(
  template: string | undefined | null,
  description: string | undefined | null,
  tags: string[] | undefined | null
) {
  const t = (template || "").toString().trim();
  const d = (description || "").toString().trim();
  const normalizedTags = normalizeTags(tags || []);
  const payload = JSON.stringify({ t, d, tags: normalizedTags });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function computeShortDigestHex(digest: string, length: number = 12) {
  return digest.substring(0, length);
}

export class PromptHistoryRepository {
  constructor(private db: SQLiteDatabase) {}

  async getByPromptId(promptId: number, limit: number = 50): Promise<PromptHistory[]> {
    const rows = await this.db.all<any>(
      `
			SELECT 
				id,
				prompt_id as promptId,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				change_note as changeNote,
				created_at as createdAt
			FROM master_prompt_history
			WHERE prompt_id = ?
			ORDER BY created_at DESC
			LIMIT ?
		`,
      [promptId, limit]
    );

    return rows.map((r: any) => ({
      id: r.id,
      promptId: r.promptId,
      provider: r.provider,
      promptKind: r.promptKind,
      promptTemplate: r.promptTemplate,
      description: r.description,
      tags: tryParseJson(r.tags) || [],
      isActive: r.isActive === 1 || r.isActive === true,
      archived: r.archived === 1 || r.archived === true,
      changeNote: r.changeNote,
      createdAt: r.createdAt,
    }));
  }

  async getById(id: number): Promise<PromptHistory | undefined> {
    const r = await this.db.get<any>(
      `
			SELECT 
				id,
				prompt_id as promptId,
				provider,
				prompt_kind as promptKind,
				prompt_template as promptTemplate,
				description,
				tags,
				is_active as isActive,
				archived,
				change_note as changeNote,
				created_at as createdAt
			FROM master_prompt_history
			WHERE id = ?
		`,
      [id]
    );

    if (!r) return undefined;
    return {
      id: r.id,
      promptId: r.promptId,
      provider: r.provider,
      promptKind: r.promptKind,
      promptTemplate: r.promptTemplate,
      description: r.description,
      tags: tryParseJson(r.tags) || [],
      isActive: r.isActive === 1 || r.isActive === true,
      archived: r.archived === 1 || r.archived === true,
      changeNote: r.changeNote,
      createdAt: r.createdAt,
    };
  }

  async create(input: CreatePromptHistoryInput): Promise<PromptHistory> {
    const now = new Date().toISOString();
    const tagsJson = input.tags ? JSON.stringify(input.tags) : null;

    // compute digest for normalized content to detect duplicates
    const digest = computeDigest(input.promptTemplate, input.description, input.tags);
    const digestShort = computeShortDigestHex(digest, 12);

    // First try a short indexed lookup on digest_short to avoid scanning
    try {
      const latest = await this.db.get<any>(
        `
				SELECT digest, digest_short FROM master_prompt_history
				WHERE prompt_id = ? AND digest_short = ?
				ORDER BY created_at DESC
				LIMIT 1
			`,
        [input.promptId, digestShort]
      );

      if (latest && latest.digest) {
        if (latest.digest === digest) {
          throw new Error("duplicate");
        }
      }
    } catch (err) {
      if ((err as any)?.message === "duplicate") throw err;
      // otherwise continue - non-fatal DB read error will be surfaced by insert
    }

    const result = await this.db.run(
      `
			INSERT INTO master_prompt_history (
				prompt_id,
				provider,
				prompt_kind,
				prompt_template,
				description,
				tags,
				digest,
				digest_short,
				is_active,
				archived,
				change_note,
				created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
      [
        input.promptId,
        input.provider,
        input.promptKind,
        input.promptTemplate,
        input.description || null,
        tagsJson,
        digest,
        digestShort,
        input.isActive ? 1 : 0,
        input.archived ? 1 : 0,
        input.changeNote || null,
        now,
      ]
    );

    return {
      id: result.lastID,
      promptId: input.promptId,
      provider: input.provider,
      promptKind: input.promptKind,
      promptTemplate: input.promptTemplate,
      description: input.description,
      tags: input.tags || [],
      isActive: input.isActive,
      archived: input.archived,
      changeNote: input.changeNote,
      createdAt: now,
    };
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.run("DELETE FROM master_prompt_history WHERE id = ?", [id]);
    return (result.changes ?? 0) > 0;
  }

  async deleteByPromptId(promptId: number): Promise<boolean> {
    const result = await this.db.run("DELETE FROM master_prompt_history WHERE prompt_id = ?", [promptId]);
    return (result.changes ?? 0) > 0;
  }
}

// Export singleton instance
import { database } from "../../../storage/database";

// Lazy singleton to avoid triggering database access in worker threads during module import
let _promptHistoryRepositoryInstance: PromptHistoryRepository | null = null;

export function getPromptHistoryRepository(): PromptHistoryRepository {
  if (!_promptHistoryRepositoryInstance) {
    _promptHistoryRepositoryInstance = new PromptHistoryRepository(database.getSQLiteDatabase());
  }
  return _promptHistoryRepositoryInstance;
}

// Export singleton with lazy getter for backward compatibility
export const promptHistoryRepository = new Proxy({} as PromptHistoryRepository, {
  get(_target, prop) {
    return getPromptHistoryRepository()[prop as keyof PromptHistoryRepository];
  },
});
