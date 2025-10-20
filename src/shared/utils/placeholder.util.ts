import { snakeCase } from "./string.util";

/**
 * Replace placeholders in a template using data keys normalized to snake_case.
 * Supports {key} and [key] placeholder formats and is case-agnostic.
 *
 * Behavior:
 * - Build a lookup where all data keys are converted to snake_case and lower-cased.
 * - For each placeholder found, normalize the placeholder name to snake_case lower-case
 *   and replace with the corresponding data value if present. If value is undefined,
 *   the placeholder is left unchanged.
 */
export function replacePlaceholders(
  template: string,
  data: Record<string, any>,
  position?: number
): string {
  if (!template) return template;

  const lookup: Record<string, any> = {};
  Object.keys(data || {}).forEach((k) => {
    try {
      const key = snakeCase(String(k)).toLowerCase();
      lookup[key] = data[k];
    } catch {
      // fallback: use raw lowercased key
      lookup[String(k).toLowerCase()] = data[k];
    }
  });

  // We'll scan for both {key} and [key] in a single pass so we can count
  // occurrences in document order. If `position` is provided, only the
  // placeholder with that zero-based occurrence index will be replaced.
  let occ = -1;
  const combinedRegex = /(\{([^}]+)\})|(\[([^\]]+)\])/g;

  const replaced = template.replace(
    combinedRegex,
    (match, _p1, pKey1, _p2, pKey2) => {
      occ += 1; // current match occurrence index
      const rawKey = (pKey1 || pKey2 || "").trim();
      const key = snakeCase(String(rawKey)).toLowerCase();

      const has =
        Object.prototype.hasOwnProperty.call(lookup, key) &&
        lookup[key] !== undefined;

      // If position is specified, only replace when occ === position
      if (typeof position === "number") {
        if (occ !== position) {
          return match; // leave unchanged
        }
        // for the target occurrence, replace only if lookup has value
        if (has) {
          const v = lookup[key];
          if (v === null) return "";
          if (typeof v === "object") return JSON.stringify(v);
          return String(v);
        }
        return match;
      }

      // Default: replace all occurrences where we have a value
      if (has) {
        const v = lookup[key];
        if (v === null) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      }

      return match;
    }
  );

  return replaced;
}

export default replacePlaceholders;
