export function formatAsMarkdown(content: string): string {
  // Ensure content is clean markdown format
  if (!content) return "";

  // Normalize line endings to \n
  let out = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Trim excessive leading/trailing whitespace
  out = out.trim();

  // Return as-is - let the frontend markdown renderer handle the formatting
  // Do NOT escape HTML or modify markdown syntax
  return out;
}

export default formatAsMarkdown;
