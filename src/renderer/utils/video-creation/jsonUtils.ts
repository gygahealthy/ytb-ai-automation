import { Prompt } from "@/renderer/types/video-creation.types";

/**
 * Utility functions for JSON import/export operations
 */

/**
 * Export prompts to a JSON file and download it
 */
export function exportPromptsToJson(prompts: Prompt[]): void {
  const json = JSON.stringify(
    prompts.map((p) => ({ text: p.text, order: p.order })),
    null,
    2
  );
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompts-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy prompts as JSON to clipboard
 */
export async function copyPromptsToClipboard(prompts: Prompt[]): Promise<void> {
  const json = JSON.stringify(
    prompts.map((p) => ({ text: p.text, order: p.order })),
    null,
    2
  );
  await navigator.clipboard.writeText(json);
}
