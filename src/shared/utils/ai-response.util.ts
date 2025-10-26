/**
 * Utility functions for parsing and extracting data from AI responses.
 * Handles various response formats including JSON, malformed JSON, and plain text.
 */

/**
 * Parse an array of strings/items from AI response text.
 * Attempts multiple parsing strategies:
 * 1. Direct JSON array parsing
 * 2. Extraction of field values from JSON objects (title, description, name)
 * 3. Recovery from malformed JSON by extracting individual fields via regex
 * 4. Fallback to text line parsing
 *
 * @param text - The AI response text to parse
 * @param maxResults - Maximum number of results to return (default: 10)
 * @param minLength - Minimum length for text entries (default: 10)
 * @returns Array of extracted strings
 *
 * @example
 * const topics = parseAIResponseArray(aiResponseText);
 * // Returns: ["Topic 1", "Topic 2", ...]
 */
export function parseAIResponseArray(text: string, maxResults = 10, minLength = 10): string[] {
  if (!text || typeof text !== "string") return [];

  // Strategy 1: Try to parse as JSON first (AI may return structured data)
  try {
    // Use the new extractJSONArray function for better parsing
    const extracted = extractJSONArray(text);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) {
          const results = parsed
            .map((item: any) => extractStringFromItem(item))
            .filter((t: string | null): t is string => t !== null && typeof t === "string" && t.length > 0)
            .slice(0, maxResults);
          if (results.length > 0) return results;
        }
      } catch (parseError) {
        // JSON parsing failed, try to extract individual fields
        const results = extractFieldsFromMalformedJSON(text, "title", maxResults);
        if (results.length > 0) return results;

        // Try description as fallback
        const descResults = extractFieldsFromMalformedJSON(text, "description", maxResults);
        if (descResults.length > 0) return descResults;
      }
    }
  } catch (e) {
    // Not JSON, continue to text parsing
  }

  // Strategy 2: Fall back to text parsing
  return parseAIResponseText(text, maxResults, minLength);
}

/**
 * Extract string content from a single item (could be string, object with title/description, etc.)
 * @param item - The item to extract from
 * @returns Extracted string or null
 * @internal
 */
function extractStringFromItem(item: any): string | null {
  if (typeof item === "string") return item;
  if (item?.title && typeof item.title === "string") return item.title.trim();
  if (item?.name && typeof item.name === "string") return item.name.trim();
  if (item?.description && typeof item.description === "string") return item.description.trim();
  if (item?.text && typeof item.text === "string") return item.text.trim();
  return null;
}

/**
 * Extract specific fields from malformed JSON text using regex.
 * Useful when JSON parsing fails but we can still extract field values.
 *
 * @param text - The text containing malformed JSON
 * @param fieldName - The field name to extract (e.g., "title", "description")
 * @param maxResults - Maximum number of results to return
 * @returns Array of extracted field values
 * @internal
 */
function extractFieldsFromMalformedJSON(text: string, fieldName: string, maxResults: number): string[] {
  // Create a regex pattern to find all occurrences of "fieldName": "value"
  const fieldPattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, "g");
  const matches = text.matchAll(fieldPattern);

  const results: string[] = [];
  for (const match of matches) {
    if (match[1]) {
      results.push(match[1]);
      if (results.length >= maxResults) break;
    }
  }

  return results;
}

/**
 * Parse plain text response into an array of strings.
 * Handles numbered lists, bullet points, and other common formats.
 *
 * @param text - The text to parse
 * @param maxResults - Maximum number of results to return
 * @param minLength - Minimum length for entries to be included
 * @returns Array of parsed strings
 * @internal
 */
function parseAIResponseText(text: string, maxResults: number, minLength: number): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("{") && !l.startsWith("["));

  const results: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[\d]+[\.\)]\s*|^[-*•]\s*/, "") // Remove list markers
      .replace(/^['"]|['"]$/g, "") // Remove quotes
      .trim();

    if (cleaned && !cleaned.startsWith("{") && !cleaned.startsWith("[") && cleaned.length >= minLength) {
      results.push(cleaned);
      if (results.length >= maxResults) break;
    }
  }

  return results;
}

/**
 * Parse JSON from AI response text, handling various formats.
 * Handles JSON in code blocks (```json...```) and direct JSON strings.
 * This function attempts to extract and parse complete JSON structures.
 *
 * @param text - The text to parse
 * @returns Parsed JSON object/array or null if parsing fails
 *
 * @example
 * const config = parseAIResponseJSON(aiResponseText);
 * if (config && Array.isArray(config)) {
 *   // Process array
 * }
 */
export function parseAIResponseJSON(text: string): any | null {
  if (!text || typeof text !== "string") return null;

  try {
    let cleanText = text.trim();

    // Handle code blocks
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(cleanText);
  } catch (e) {
    // Try to extract JSON array by finding matching brackets
    const extracted = extractJSONArray(text);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Extract a complete JSON array from text by finding matching brackets.
 * Handles nested objects and arrays with proper bracket counting.
 * Also handles escaped characters and string content correctly.
 *
 * @param text - The text containing JSON
 * @returns Extracted JSON string or null if no valid array found
 * @internal
 */
function extractJSONArray(text: string): string | null {
  // Find the start of an array or object
  const startIdx = text.indexOf("[");
  if (startIdx === -1) {
    // Try to find an object instead
    const objStartIdx = text.indexOf("{");
    if (objStartIdx === -1) return null;
    return extractJSONFromStart(text, objStartIdx, "{", "}");
  }
  return extractJSONFromStart(text, startIdx, "[", "]");
}

/**
 * Extract JSON from a starting position with matching bracket counting.
 * @internal
 */
function extractJSONFromStart(text: string, startIdx: number, openBracket: string, closeBracket: string): string | null {
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : "";

    // Handle escape sequences - only count backslash if it's not itself escaped
    if (char === "\\" && prevChar !== "\\") {
      escapeNext = true;
      continue;
    }

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    // Handle string boundaries
    if (char === '"' && prevChar !== "\\") {
      inString = !inString;
      continue;
    }

    // Skip bracket counting if we're inside a string
    if (inString) continue;

    // Count brackets
    if (char === openBracket || char === "{" || char === "[") {
      bracketCount++;
    } else if (char === closeBracket || char === "}" || char === "]") {
      bracketCount--;
      // If we've closed all brackets, we found the complete structure
      if (bracketCount === 0) {
        return text.substring(startIdx, i + 1);
      }
    }
  }

  return null;
}

/**
 * Validate that a parsed response is an array of objects with expected fields.
 * Useful for type-checking API responses.
 *
 * @param data - The data to validate
 * @param expectedFields - Array of field names that should exist
 * @returns true if data is a valid array of objects with expected fields
 *
 * @example
 * if (isValidArrayResponse(data, ["title", "description"])) {
 *   // Safe to use data as array of objects
 * }
 */
export function isValidArrayResponse(data: any, expectedFields: string[] = []): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;

  const firstItem = data[0];
  if (typeof firstItem !== "object" || firstItem === null) return false;

  if (expectedFields.length > 0) {
    return expectedFields.some((field) => field in firstItem);
  }

  return true;
}

/**
 * Filter out invalid/empty suggestions from an array.
 * Ensures all returned items are non-empty strings.
 *
 * @param items - Array of items to filter
 * @returns Filtered array of valid strings
 *
 * @example
 * const validTopics = filterValidSuggestions(suggestions);
 */
export function filterValidSuggestions(items: any[]): string[] {
  return items.filter((item) => item && typeof item === "string" && item.trim().length > 0);
}

/**
 * Debug function to help diagnose JSON parsing issues.
 * Logs detailed information about parsing attempts.
 *
 * @param text - The text to debug
 * @internal
 */
export function debugJSONParsing(text: string): void {
  if (!text || typeof text !== "string") {
    console.debug("[JSON Parse Debug] Input is not a valid string");
    return;
  }

  console.debug(`[JSON Parse Debug] Input length: ${text.length} chars`);
  console.debug(`[JSON Parse Debug] First 100 chars:`, text.substring(0, 100));

  // Try to find brackets
  const arrayStart = text.indexOf("[");
  const objectStart = text.indexOf("{");
  console.debug(`[JSON Parse Debug] Array starts at: ${arrayStart}, Object starts at: ${objectStart}`);

  // Try parsing as-is
  try {
    const direct = JSON.parse(text);
    console.debug(
      "[JSON Parse Debug] ✅ Direct parse successful",
      typeof direct,
      Array.isArray(direct) ? `array[${direct.length}]` : "object"
    );
    return;
  } catch (e) {
    console.debug("[JSON Parse Debug] ❌ Direct parse failed:", (e as Error).message);
  }

  // Try extracting JSON
  const extracted = extractJSONArray(text);
  if (extracted) {
    console.debug(`[JSON Parse Debug] Extracted JSON (${extracted.length} chars):`, extracted.substring(0, 100));
    try {
      const parsed = JSON.parse(extracted);
      console.debug(
        "[JSON Parse Debug] ✅ Extracted JSON parse successful",
        typeof parsed,
        Array.isArray(parsed) ? `array[${parsed.length}]` : "object"
      );
    } catch (e) {
      console.debug("[JSON Parse Debug] ❌ Extracted JSON parse failed:", (e as Error).message);
    }
  } else {
    console.debug("[JSON Parse Debug] ⚠️ Could not extract JSON array");
  }
}
