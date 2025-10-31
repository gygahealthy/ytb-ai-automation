/**
 * Image Cropping Utilities
 * Handles image cropping with aspect ratio constraints
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatio = "landscape" | "portrait";

/**
 * Get aspect ratio values for landscape (16:9) and portrait (9:16)
 */
export function getAspectRatioValue(aspectRatio: AspectRatio): number {
  return aspectRatio === "landscape" ? 16 / 9 : 9 / 16;
}

/**
 * Crop an image file to the specified area
 * @param file - Original image file
 * @param cropArea - Crop area coordinates (in pixels relative to displayed image)
 * @returns Cropped image as Blob
 */
export async function cropImage(file: File, cropArea: CropArea): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // Create canvas for cropping
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set canvas size to crop area
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        // Draw cropped portion of image
        ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob from canvas"));
            }
          },
          file.type,
          0.95 // Quality for JPEG
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert blob to file
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Calculate initial crop area centered on the image with correct aspect ratio
 */
export function calculateInitialCropArea(imageWidth: number, imageHeight: number, aspectRatio: AspectRatio): CropArea {
  const ratio = getAspectRatioValue(aspectRatio);

  let width: number;
  let height: number;

  // Calculate crop dimensions to fit within image while maintaining aspect ratio
  if (aspectRatio === "landscape") {
    // 16:9 - wider than tall
    if (imageWidth / imageHeight > ratio) {
      // Image is wider than target ratio - limit by height
      height = imageHeight * 0.8; // Use 80% of image height
      width = height * ratio;
    } else {
      // Image is taller than target ratio - limit by width
      width = imageWidth * 0.8; // Use 80% of image width
      height = width / ratio;
    }
  } else {
    // 9:16 - taller than wide (portrait)
    // For portrait, ratio = 9/16 = 0.5625 (width/height)
    if (imageHeight / imageWidth > 16 / 9) {
      // Image is very tall - limit by width
      width = imageWidth * 0.8;
      height = width / ratio; // height = width / 0.5625 = width * 1.778
    } else {
      // Image is not tall enough - limit by height
      height = imageHeight * 0.8;
      width = height * ratio; // width = height * 0.5625
    }

    // Ensure crop doesn't exceed image boundaries
    if (width > imageWidth) {
      width = imageWidth * 0.8;
      height = width / ratio;
    }
    if (height > imageHeight) {
      height = imageHeight * 0.8;
      width = height * ratio;
    }
  }

  // Center the crop area
  const x = (imageWidth - width) / 2;
  const y = (imageHeight - height) / 2;

  return { x, y, width, height };
}
