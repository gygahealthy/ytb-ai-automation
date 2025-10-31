/**
 * Image Type Detector
 *
 * Detects image format by reading magic bytes (file signatures)
 * Supports: JPEG, PNG, WebP, GIF
 */

export type ImageType = "jpeg" | "png" | "webp" | "gif" | "unknown";

/**
 * Detect image type from base64 string
 * @param base64String - Base64 encoded image data
 * @returns Image type based on magic bytes
 */
export function detectImageTypeFromBase64(base64String: string): ImageType {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, "base64");
    return detectImageTypeFromBuffer(buffer);
  } catch (error) {
    console.error("[Image Type Detector] Error detecting type from base64:", error);
    return "unknown";
  }
}

/**
 * Detect image type from buffer by reading magic bytes
 * @param buffer - Image data buffer
 * @returns Image type based on magic bytes
 */
export function detectImageTypeFromBuffer(buffer: Buffer): ImageType {
  if (!buffer || buffer.length < 12) {
    return "unknown";
  }

  // Read first 12 bytes for magic number detection
  const header = buffer.slice(0, 12);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "jpeg";
  }

  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 (RIFF....WEBP)
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50
  ) {
    return "webp";
  }

  // GIF: 47 49 46 38 (GIF8)
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return "gif";
  }

  return "unknown";
}

/**
 * Get file extension for image type
 * @param imageType - Detected image type
 * @returns File extension (with dot)
 */
export function getImageExtension(imageType: ImageType): string {
  switch (imageType) {
    case "jpeg":
      return ".jpg";
    case "png":
      return ".png";
    case "webp":
      return ".webp";
    case "gif":
      return ".gif";
    default:
      return ".jpg"; // Default fallback
  }
}

/**
 * Detect image type and return appropriate filename
 * @param buffer - Image data buffer
 * @param baseName - Base filename without extension (e.g., media key)
 * @returns Filename with correct extension
 */
export function getImageFilename(buffer: Buffer, baseName: string): string {
  const imageType = detectImageTypeFromBuffer(buffer);
  const extension = getImageExtension(imageType);
  return `${baseName}${extension}`;
}
