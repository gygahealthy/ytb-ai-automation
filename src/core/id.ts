/**
 * Generate a UUID.
 * - In Node.js (main process): Uses crypto.randomUUID() for better performance
 * - In browser (renderer): Uses crypto.getRandomValues() for client-side generation
 */
export const generateUuid = (): string => {
  // Check if we're in Node.js environment
  if (typeof globalThis !== "undefined" && globalThis.crypto && "randomUUID" in globalThis.crypto) {
    // Node.js 15.7+
    return globalThis.crypto.randomUUID();
  }

  // Browser fallback using crypto.getRandomValues()
  if (typeof globalThis !== "undefined" && globalThis.crypto && "getRandomValues" in globalThis.crypto) {
    const buffer = new Uint8Array(16);
    globalThis.crypto.getRandomValues(buffer);

    // Format as UUID v4
    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;

    return Array.from(buffer, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
  }

  // Fallback: simple random UUID (not cryptographically secure, but works)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default generateUuid;
