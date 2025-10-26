import { snakeCase } from "./string.util";

/**
 * Configuration for which occurrences of a variable to replace
 * Maps variable name (normalized) to array of occurrence indices (0-based)
 * Example: { "video_topic": [0, 2], "video_style": [1] }
 */
export type VariableOccurrenceConfig = Record<string, number[]>;

/**
 * Input values for template replacement
 * Keys can be in any case format (camelCase, PascalCase, snake_case, kebab-case)
 * Example: { "video_topic": "AI Benefits", "VideoStyle": "Educational", etc. }
 */
export type TemplateValues = Record<string, string>;

/**
 * Detects all variable placeholders in a template.
 * Supports both {VAR_NAME} and [VAR_NAME] syntax.
 * Returns array of { name, position, syntax } for each occurrence.
 *
 * @param template - Template string with variables
 * @returns Array of detected variables with their positions
 */
export function detectTemplateVariables(
  template: string
): Array<{ name: string; position: number; syntax: "brace" | "bracket" }> {
  const variables: Array<{
    name: string;
    position: number;
    syntax: "brace" | "bracket";
  }> = [];

  // Match {VAR_NAME} syntax
  const braceRegex = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
  let match;
  while ((match = braceRegex.exec(template)) !== null) {
    variables.push({
      name: match[1],
      position: match.index,
      syntax: "brace",
    });
  }

  // Match [VAR_NAME] syntax
  const bracketRegex = /\[([A-Za-z_][A-Za-z0-9_]*)\]/g;
  while ((match = bracketRegex.exec(template)) !== null) {
    variables.push({
      name: match[1],
      position: match.index,
      syntax: "bracket",
    });
  }

  // Sort by position to maintain order
  return variables.sort((a, b) => a.position - b.position);
}

/**
 * Normalizes a key to a standard format for comparison.
 * Converts camelCase, PascalCase, snake_case, kebab-case to a normalized form.
 * This helps match keys across different naming conventions.
 *
 * @param key - Key to normalize
 * @returns Normalized key (snake_case)
 */
function normalizeKey(key: string): string {
  return snakeCase(key);
}

/**
 * Finds a value in the values object by matching against various case formats.
 * Tries direct match, then tries all case conversions.
 *
 * @param key - Original key from template
 * @param values - Values object with keys in potentially different case formats
 * @returns The value if found, undefined otherwise
 */
function findValueByKey(key: string, values: TemplateValues): string | undefined {
  const normalizedKey = normalizeKey(key);

  // Try direct match first (in case user provides exact key)
  if (key in values) {
    return values[key];
  }

  // Try matching against all keys in values by normalizing them
  for (const [valuesKey, value] of Object.entries(values)) {
    if (normalizeKey(valuesKey) === normalizedKey) {
      return value;
    }
  }

  return undefined;
}

/**
 * Replaces template variables with values, respecting occurrence selection.
 * Only replaces selected occurrences of each variable.
 *
 * Supports both {VAR_NAME} and [VAR_NAME] syntax.
 * Handles keys in different case formats (camelCase, PascalCase, snake_case, kebab-case).
 *
 * @param template - Template string with variables like {video_topic} or [video_style]
 * @param values - Object with replacement values. Keys can be in any case format.
 * @param occurrenceConfig - Which occurrences of each variable to replace.
 *                          If undefined, all occurrences are replaced.
 *                          Example: { "video_topic": [0, 2], "video_style": [1] }
 * @returns Template with selected variables replaced
 *
 * @example
 * ```ts
 * const template = "Topic: {video_topic}. Style: {video_style}. Topic again: {video_topic}";
 * const values = { video_topic: "AI Trends", VideoStyle: "Educational" };
 * const config = { "video_topic": [0], "video_style": [0] };
 *
 * const result = replaceTemplate(template, values, config);
 * // Result: "Topic: AI Trends. Style: Educational. Topic again: {video_topic}"
 * ```
 */
export function replaceTemplate(template: string, values: TemplateValues, occurrenceConfig?: VariableOccurrenceConfig): string {
  if (!template) return template;

  // Detect all variables in template
  const detectedVariables = detectTemplateVariables(template);

  if (detectedVariables.length === 0) {
    return template; // No variables to replace
  }

  // Group variables by name for tracking occurrences
  const variablesByName = new Map<string, typeof detectedVariables>();
  for (const variable of detectedVariables) {
    if (!variablesByName.has(variable.name)) {
      variablesByName.set(variable.name, []);
    }
    variablesByName.get(variable.name)!.push(variable);
  }

  // Build replacement map: track which placeholders should be replaced
  const replacements = new Map<number, { original: string; replacement: string }>();

  for (const [varName, occurrences] of variablesByName.entries()) {
    const value = findValueByKey(varName, values);

    // Skip if no value found for this variable
    if (value === undefined) continue;

    // Determine which occurrences to replace
    let indicesToReplace: Set<number>;

    if (occurrenceConfig && varName in occurrenceConfig) {
      // Use specific indices from config
      indicesToReplace = new Set(occurrenceConfig[varName]);
    } else if (occurrenceConfig) {
      // If config exists but doesn't have this variable, skip it
      continue;
    } else {
      // No config: replace all occurrences
      indicesToReplace = new Set(Array.from({ length: occurrences.length }, (_, i) => i));
    }

    // Record which placeholders to replace
    for (let idx = 0; idx < occurrences.length; idx++) {
      if (indicesToReplace.has(idx)) {
        const occurrence = occurrences[idx];
        const placeholder = occurrence.syntax === "brace" ? `{${varName}}` : `[${varName}]`;
        replacements.set(occurrence.position, {
          original: placeholder,
          replacement: value,
        });
      }
    }
  }

  // Apply replacements from end to start to avoid position shifts
  const replacementArray = Array.from(replacements.entries()).sort((a, b) => b[0] - a[0]); // Sort by position descending

  let result = template;
  for (const [_position, { original, replacement }] of replacementArray) {
    result = result.replace(original, replacement);
  }

  return result;
}

/**
 * Alternative simple replacement that replaces all occurrences of all variables.
 * Useful when you don't have occurrence config and want to replace everything.
 *
 * @param template - Template string
 * @param values - Replacement values
 * @returns Template with all variables replaced
 */
export function replaceAllTemplate(template: string, values: TemplateValues): string {
  return replaceTemplate(template, values);
}

/**
 * Replaces template variables using an array of values instead of an object.
 * Values are matched by position in the array according to the occurrence config.
 *
 * The array order corresponds to the order of variables in the config.
 * Each config value is a 0-based occurrence index in the template.
 *
 * @param template - Template string with variables like {video_topic} or [video_style]
 * @param values - Array of replacement values in order (matches config key order)
 * @param occurrenceConfig - Maps variable names to 0-based occurrence indices in the template.
 *                          Example: { "full_script_text": [2], "visual_style": [9] }
 *                          With values = [scriptText, styleText]:
 *                          - values[0] replaces occurrence index 2 (3rd occurrence) of full_script_text
 *                          - values[1] replaces occurrence index 9 (10th occurrence) of visual_style
 * @returns Template with selected variables replaced
 *
 * @example
 * ```ts
 * const template = "A: {x}. B: {x}. C: {x}. D: {y}. E: {y}";
 * const values = ["replaced_x", "replaced_y"];
 * const config = { "x": [1], "y": [0] };
 *
 * const result = replaceTemplateArray(template, values, config);
 * // Result: "A: {x}. B: replaced_x. C: {x}. D: replaced_y. E: {y}"
 * // values[0] replaces x at occurrence index 1 (2nd occurrence)
 * // values[1] replaces y at occurrence index 0 (1st occurrence)
 * ```
 */
export function replaceTemplateArray(template: string, values: string[], occurrenceConfig: VariableOccurrenceConfig): string {
  if (!template) return template;
  if (!values || values.length === 0) return template;
  if (!occurrenceConfig || Object.keys(occurrenceConfig).length === 0) {
    return template;
  }

  console.log("[replaceTemplateArray] Called with:");
  console.log("  - values.length:", values.length);
  console.log("  - values[0] length:", values[0]?.length || 0);
  console.log("  - values[1] length:", values[1]?.length || 0);
  console.log("  - occurrenceConfig:", JSON.stringify(occurrenceConfig));

  // Detect all variables in template
  const detectedVariables = detectTemplateVariables(template);

  if (detectedVariables.length === 0) {
    return template; // No variables to replace
  }

  console.log("  - detectedVariables:", detectedVariables.map((v) => `${v.name}@${v.position}`).join(", "));

  // Group variables by name for tracking occurrences
  const variablesByName = new Map<string, typeof detectedVariables>();
  for (const variable of detectedVariables) {
    const normalizedName = normalizeKey(variable.name);
    if (!variablesByName.has(normalizedName)) {
      variablesByName.set(normalizedName, []);
    }
    variablesByName.get(normalizedName)!.push(variable);
  }

  console.log("  - variablesByName keys:", Array.from(variablesByName.keys()));
  for (const [name, occurrences] of variablesByName.entries()) {
    console.log(
      `    ${name}: ${occurrences.length} occurrences at positions:`,
      occurrences.map((o) => o.position)
    );
  }

  // Build a list of all replacements to make
  const allReplacements: Array<{ position: number; original: string; replacement: string }> = [];

  // Track which array index we're currently processing
  let arrayIndex = 0;

  // Iterate through config keys in order - this order matches the values array
  for (const [varName, occurrenceIndices] of Object.entries(occurrenceConfig)) {
    const normalizedVarName = normalizeKey(varName);
    console.log(
      `  - Processing config: varName="${varName}", normalized="${normalizedVarName}", indices=${JSON.stringify(
        occurrenceIndices
      )}`
    );
    const occurrences = variablesByName.get(normalizedVarName);

    if (!occurrences) {
      console.log(`    ⚠️ Variable "${normalizedVarName}" not found in template!`);
      // Variable not found in template - skip but still consume array slots
      arrayIndex += occurrenceIndices.length;
      continue;
    }

    console.log(`    Found ${occurrences.length} occurrences in template`);

    // For each occurrence index specified in this variable's config
    for (const occurrenceIdx of occurrenceIndices) {
      console.log(`      Processing occurrenceIdx=${occurrenceIdx}, arrayIndex=${arrayIndex}`);
      // occurrenceIdx is 0-based index (e.g., 2 means the 3rd occurrence, index 2)
      // arrayIndex tells us which value from the values array to use

      if (occurrenceIdx >= 0 && occurrenceIdx < occurrences.length && arrayIndex < values.length) {
        const occurrence = occurrences[occurrenceIdx];
        const placeholder = occurrence.syntax === "brace" ? `{${occurrence.name}}` : `[${occurrence.name}]`;

        allReplacements.push({
          position: occurrence.position,
          original: placeholder,
          replacement: values[arrayIndex],
        });
        console.log(
          `      ✅ Will replace occurrence #${occurrenceIdx} of "${placeholder}" at position ${occurrence.position} with values[${arrayIndex}] (length: ${values[arrayIndex].length})`
        );
      } else {
        console.log(
          `      ❌ Skipped: occurrenceIdx=${occurrenceIdx} >= ${occurrences.length} or arrayIndex=${arrayIndex} >= ${values.length}`
        );
      }

      // Move to next array value for the next variable/occurrence
      arrayIndex++;
    }
  }

  console.log(`  - Total replacements to make: ${allReplacements.length}`);

  // Sort replacements by position (descending) to avoid index shifts
  allReplacements.sort((a, b) => b.position - a.position);

  // Apply replacements from end to start using tracked positions
  let result = template;
  for (const { position, original, replacement } of allReplacements) {
    // Use the actual position to replace, not indexOf which finds the first occurrence
    const expectedSubstr = result.substring(position, position + original.length);
    if (expectedSubstr === original) {
      result = result.substring(0, position) + replacement + result.substring(position + original.length);
      console.log(`  - Replaced "${original}" at position ${position} with value (${replacement.length} chars)`);
    } else {
      console.log(`  - ⚠️ Mismatch at position ${position}: expected "${original}", found "${expectedSubstr}"`);
    }
  }

  return result;
}

/**
 * Utility to get statistics about variables in a template.
 * Useful for UI feedback showing how many of each variable exist.
 *
 * @param template - Template string
 * @returns Object with variable names as keys and occurrence count as values
 */
export function getVariableStats(template: string): Record<string, number> {
  const variables = detectTemplateVariables(template);
  const stats: Record<string, number> = {};

  for (const variable of variables) {
    stats[variable.name] = (stats[variable.name] || 0) + 1;
  }

  return stats;
}
