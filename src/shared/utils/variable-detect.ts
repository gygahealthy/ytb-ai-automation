/**
 * Detects variables in prompt template text.
 * Supports both [VAR] and {VAR} formats with optional wrapping quotes/backticks.
 */
export type DetectedVariable = {
  name: string;
  occurrences: number[];
};

export function detectVariables(text: string): DetectedVariable[] {
  // Match [VAR_NAME] or {VAR_NAME} formats
  // Use two separate regex patterns for clarity and reliability
  const result: Record<string, { name: string; occurrences: number[] }> = {};

  // Pattern 1: Match [VARIABLE_NAME]
  const squareBracketRe = /\[([A-Za-z0-9_]+)\]/g;
  let m: RegExpExecArray | null;

  while ((m = squareBracketRe.exec(text))) {
    const name = m[1];
    const idx = m.index;

    if (!result[name]) {
      result[name] = { name, occurrences: [] };
    }
    result[name].occurrences.push(idx);
  }

  // Pattern 2: Match {VARIABLE_NAME}
  const curlyBracketRe = /\{([A-Za-z0-9_]+)\}/g;

  while ((m = curlyBracketRe.exec(text))) {
    const name = m[1];
    const idx = m.index;

    if (!result[name]) {
      result[name] = { name, occurrences: [] };
    }
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
 */
export function findVariableEnd(text: string, startPos: number): number {
  const sub = text.substring(startPos);
  // Match [VAR] or {VAR} with proper bracket pairs
  const match = sub.match(/^(?:\[([A-Za-z0-9_]+)\]|\{([A-Za-z0-9_]+)\})/);
  return match ? startPos + match[0].length : startPos + 1;
}
