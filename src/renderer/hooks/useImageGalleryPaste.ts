import { usePasteHandler } from "./usePasteHandler";
import { useAlert } from "./useAlert";

export interface ImageGalleryPasteOptions {
  /**
   * Profile ID for the upload
   */
  profileId: string | null;

  /**
   * VEO3 images storage path
   */
  veo3ImagesPath: string | null;

  /**
   * Temp video path for temporary files
   */
  tempVideoPath: string | null;

  /**
   * Callback to handle the pasted image file
   * Should handle validation, secret extraction, and modal opening
   */
  onImagePaste: (file: File) => void | Promise<void>;

  /**
   * Whether the paste handler is enabled
   */
  enabled?: boolean;
}

/**
 * Hook to handle image paste in the image gallery drawer
 * Validates configuration and delegates to onImagePaste callback
 */
export function useImageGalleryPaste({
  profileId,
  veo3ImagesPath,
  tempVideoPath,
  onImagePaste,
  enabled = true,
}: ImageGalleryPasteOptions) {
  const alert = useAlert();

  const handleImagePasteWithValidation = async (file: File): Promise<boolean> => {
    console.log("[useImageGalleryPaste] Image pasted:", file.name);

    // Validate configuration
    if (!profileId) {
      alert.show({
        title: "Configuration Required",
        message: "Please configure a Flow profile in Settings > Flow VEO3",
        severity: "warning",
        duration: 5000,
      });
      return true; // Prevent default even on validation failure
    }

    if (!veo3ImagesPath) {
      alert.show({
        title: "Configuration Required",
        message: "Please configure VEO3 Images storage path in Settings > File Paths",
        severity: "warning",
        duration: 5000,
      });
      return true; // Prevent default even on validation failure
    }

    if (!tempVideoPath) {
      alert.show({
        title: "Configuration Required",
        message: "Please set the Temp Video Path in Settings > File Paths to store temporary files.",
        severity: "warning",
        duration: 5000,
      });
      return true; // Prevent default even on validation failure
    }

    // Delegate to callback
    await onImagePaste(file);
    return true; // Always prevent default for image paste
  };

  usePasteHandler({
    enabled,
    onImagePaste: handleImagePasteWithValidation,
    dependencies: [profileId, veo3ImagesPath, tempVideoPath, onImagePaste],
  });
}
