import { useEffect } from "react";

export interface PasteHandlerOptions {
  /**
   * Whether to enable the paste handler
   */
  enabled?: boolean;

  /**
   * Callback when text is pasted
   * Return true to prevent default paste behavior
   */
  onTextPaste?: (text: string, event: ClipboardEvent) => boolean | Promise<boolean> | void | Promise<void>;

  /**
   * Callback when image is pasted
   * Return true to prevent default paste behavior
   */
  onImagePaste?: (file: File, event: ClipboardEvent) => boolean | Promise<boolean> | void | Promise<void>;

  /**
   * Whether to skip paste handling when inside input/textarea/contenteditable
   * Default: true
   */
  skipInputElements?: boolean;

  /**
   * Additional dependencies to trigger re-attachment of the listener
   */
  dependencies?: any[];
}

/**
 * Hook to handle clipboard paste events
 * Supports both text and image paste detection
 *
 * @example
 * // Text paste only - allow normal paste for non-JSON
 * usePasteHandler({
 *   onTextPaste: (text) => {
 *     if (text.startsWith('{')) {
 *       // Handle JSON
 *       return true; // Prevent default paste
 *     }
 *     return false; // Allow normal paste
 *   }
 * });
 *
 * @example
 * // Image paste only - always prevent default
 * usePasteHandler({
 *   onImagePaste: async (file) => {
 *     await uploadImage(file);
 *     return true; // Prevent default
 *   }
 * });
 *
 * @example
 * // Both text and image with dependencies
 * usePasteHandler({
 *   onTextPaste: (text) => handleText(text),
 *   onImagePaste: (file) => handleImage(file),
 *   skipInputElements: false,
 *   dependencies: [someState]
 * });
 */
export function usePasteHandler({
  enabled = true,
  onTextPaste,
  onImagePaste,
  skipInputElements = true,
  dependencies = [],
}: PasteHandlerOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // Skip if user is pasting into an input/textarea/contenteditable
      if (skipInputElements) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check for image first (higher priority)
      if (onImagePaste) {
        const items = clipboardData.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                const shouldPreventDefault = await onImagePaste(file, e);
                if (shouldPreventDefault) {
                  e.preventDefault();
                }
                return; // Image handled, don't process text
              }
            }
          }
        }
      }

      // Check for text
      if (onTextPaste) {
        const pastedText = clipboardData.getData("text");
        if (pastedText?.trim()) {
          const shouldPreventDefault = await onTextPaste(pastedText, e);
          if (shouldPreventDefault) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [enabled, onTextPaste, onImagePaste, skipInputElements, ...dependencies]);
}
