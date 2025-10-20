/**
 * Detects variables in prompt template text.
 * Supports both [VAR] and {VAR} formats.
 */
export type DetectedVariable = {
  name: string;
  occurrences: number[];
};

export function detectVariables(text: string): DetectedVariable[] {
  const result: Record<string, { name: string; occurrences: number[] }> = {};

  // Match {variable_name} or [variable_name] - brackets with non-whitespace content inside
  // \S+ means one or more non-whitespace characters (consecutive string)
  const combinedRe = /\{(\S+)\}|\[(\S+)\]/g;
  let m: RegExpExecArray | null;

  while ((m = combinedRe.exec(text))) {
    // m[1] is from curly braces {NAME}, m[2] is from square brackets [NAME]
    const name = (m[1] || m[2]) as string;
    // m.index points directly to the opening bracket { or [
    const idx = m.index;

    if (!result[name]) result[name] = { name, occurrences: [] };
    result[name].occurrences.push(idx);
  }

  return Object.keys(result).map((k) => ({
    name: k,
    occurrences: result[k].occurrences,
  }));
}

/**
 * Find the end position of a variable token at a given position.
 * Supports both [VAR] and {VAR} formats with matching brackets.
 * The startPos should point to the opening bracket [ or {.
 */
export function findVariableEnd(text: string, startPos: number): number {
  const sub = text.substring(startPos);
  // Match {non-whitespace} or [non-whitespace] starting from this position
  const match = sub.match(/^(\{\S+\}|\[\S+\])/);
  if (match) {
    // Return the position right after the closing bracket
    return startPos + match[0].length;
  }
  // Fallback: move forward by 1 character
  return startPos + 1;
}
