/**
 * Parse tags from various formats into a clean string array.
 * Accepts: arrays, JSON strings, comma/semicolon/pipe-separated strings.
 */
export function parseTags(rawTags: any): string[] {
  if (!rawTags) return [];

  // Already an array
  if (Array.isArray(rawTags)) {
    return rawTags.map((t) => String(t).trim()).filter(Boolean);
  }

  // If it's a string, try to parse JSON first (handle '[]' serialized arrays)
  if (typeof rawTags === "string") {
    const raw = rawTags.trim();
    if (!raw) return [];

    if (
      (raw.startsWith("[") && raw.endsWith("]")) ||
      (raw.startsWith('"') && raw.endsWith('"'))
    ) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => String(t).trim()).filter(Boolean);
        }
      } catch (e) {
        // fall through to splitting below
      }
    }

    // Fallback: split on common separators
    return raw
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // If it's an object with a toString, try to coerce
  try {
    const coerced = String(rawTags);
    if (coerced) {
      return coerced
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
  } catch (e) {
    /* ignore */
  }

  return [];
}
