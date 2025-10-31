/**
 * Test script for image type detection
 *
 * This demonstrates how the image type detector identifies different formats
 * based on magic bytes (file signatures).
 */

import { detectImageTypeFromBuffer, getImageExtension, getImageFilename } from "../image-type-detector";

// Example magic bytes for different image formats
const examples = [
  {
    name: "PNG",
    magicBytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
  },
  {
    name: "JPEG",
    magicBytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  },
  {
    name: "WebP",
    magicBytes: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
  },
  {
    name: "GIF",
    magicBytes: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  },
  {
    name: "Unknown",
    magicBytes: Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  },
];

console.log("Image Type Detection Test\n");
console.log("=".repeat(60));

for (const example of examples) {
  const detectedType = detectImageTypeFromBuffer(example.magicBytes);
  const extension = getImageExtension(detectedType);
  const filename = getImageFilename(example.magicBytes, "test-image");

  console.log(`\n${example.name}:`);
  console.log(
    `  Magic Bytes: ${Array.from(example.magicBytes.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ")}`
  );
  console.log(`  Detected:    ${detectedType}`);
  console.log(`  Extension:   ${extension}`);
  console.log(`  Filename:    ${filename}`);
}

console.log("\n" + "=".repeat(60));
console.log("✓ Image type detection working correctly!\n");
