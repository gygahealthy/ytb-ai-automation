export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a string from camelCase, snake_case, or kebab-case to PascalCase.
 * Examples:
 *  - "camelCase" => "CamelCase"
 *  - "snake_case" => "SnakeCase"
 *  - "kebab-case" => "KebabCase"
 */
export function pascalCase(input: string): string {
  if (!input) return "";

  // Replace common separators with spaces
  const withSpaces = input
    .replace(/[-_]+/g, " ")
    // insert space between camelCase boundaries (e.g., "camelCase" => "camel Case")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

  return withSpaces
    .split(/\s+/)
    .map((word) => capitalize(word.toLowerCase()))
    .join("");
}

export default pascalCase;
export * from "./string";

/**
 * Convert a string to snake_case.
 * Handles camelCase, PascalCase, kebab-case, spaces, and existing snake_case.
 * Examples:
 *  - "camelCase" => "camel_case"
 *  - "PascalCase" => "pascal_case"
 *  - "kebab-case" => "kebab_case"
 *  - "Already_snake" => "already_snake"
 */
export function snakeCase(input: string): string {
  if (!input) return "";

  // 1) Replace hyphens and spaces with underscores
  let s = input.replace(/[-\s]+/g, "_");

  // 2) Insert underscore between lowercase/number and uppercase (camelCase -> camel_Case)
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1_$2");

  // 3) Insert underscore between consecutive uppercase followed by lowercase (XMLHttp -> XML_Http)
  s = s.replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1_$2");

  // 4) Normalize multiple underscores and lower-case
  s = s.replace(/__+/g, "_").toLowerCase();

  // Trim leading/trailing underscores
  s = s.replace(/^_+|_+$/g, "");

  return s;
}

/**
 * Convert any separator or casing to camelCase.
 * Examples:
 *  - "PascalCase" => "pascalCase"
 *  - "snake_case" => "snakeCase"
 *  - "kebab-case" => "kebabCase"
 *  - "spaced words" => "spacedWords"
 *  - "ALL_CAPS" => "allCaps"
 */
export function camelCase(input: string): string {
  if (!input) return "";

  // Normalize separators to spaces, split on non-alphanumeric boundaries
  const withSpaces = input
    .replace(/[-_]+/g, " ")
    // Break camel/Pascal boundaries: "camelCase" -> "camel Case"
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // Break sequences like "XMLHttp" -> "XML Http"
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, "$1 $2")
    .trim();

  const parts = withSpaces.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0].toLowerCase();
  const rest = parts
    .slice(1)
    .map((p) => capitalize(p.toLowerCase()))
    .join("");

  return `${first}${rest}`;
}
