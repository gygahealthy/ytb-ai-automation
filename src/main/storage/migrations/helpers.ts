import * as crypto from "crypto";

export function normalizeTagsForDigest(
  tagsJson: string | null | undefined
): string[] {
  if (!tagsJson) return [];
  try {
    const tags = JSON.parse(tagsJson);
    if (!Array.isArray(tags)) return [];
    return (tags as any[])
      .map((t) => (t || "").toString().trim().toLowerCase())
      .filter((t) => t.length > 0)
      .sort();
  } catch {
    return [];
  }
}

export function computeDigestForMigration(
  template: string | null | undefined,
  description: string | null | undefined,
  tagsJson: string | null | undefined
): string {
  const t = (template || "").toString().trim();
  const d = (description || "").toString().trim();
  const tags = normalizeTagsForDigest(tagsJson);
  const payload = JSON.stringify({ t, d, tags });
  return crypto.createHash("sha256").update(payload).digest("hex");
}
