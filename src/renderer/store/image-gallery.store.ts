import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Profile-specific image cursor state
 */
export type ProfileImageCursor = {
  profileId: string;
  cursor: string | null;
  lastFetchedAt: string;
};

/**
 * Selected image for video generation
 */
export type SelectedImageInfo = {
  id: string;
  name: string;
  mediaKey?: string; // Media ID for VEO3 API
  localPath?: string;
  fifeUrl?: string;
  aspectRatio?: string;
  profileId: string;
};

/**
 * Image Gallery Store State
 */
type ImageGalleryState = {
  // Cursor tracking per profile (last fetched page)
  profileCursors: Record<string, ProfileImageCursor>;

  // Selected images (max 3 with FIFO behavior)
  selectedImages: SelectedImageInfo[];
  maxSelectedImages: number;

  // Actions - Cursor
  setProfileCursor: (profileId: string, cursor: string | null) => void;
  getProfileCursor: (profileId: string) => string | null;
  clearProfileCursor: (profileId: string) => void;
  clearAllCursors: () => void;

  // Actions - Image Selection
  toggleImageSelection: (image: SelectedImageInfo) => void;
  clearSelectedImages: () => void;
  removeSelectedImage: (imageId: string) => void;
  isImageSelected: (imageId: string) => boolean;

  // Actions - Configuration
  setMaxSelectedImages: (max: number) => void;
};

export const useImageGalleryStore = create<ImageGalleryState>()(
  persist(
    (set, get) => ({
      profileCursors: {},
      selectedImages: [],
      maxSelectedImages: 3,

      // Cursor actions
      setProfileCursor: (profileId, cursor) => {
        set((state) => ({
          profileCursors: {
            ...state.profileCursors,
            [profileId]: {
              profileId,
              cursor,
              lastFetchedAt: new Date().toISOString(),
            },
          },
        }));
      },

      getProfileCursor: (profileId) => {
        const cursorData = get().profileCursors[profileId];
        return cursorData?.cursor || null;
      },

      clearProfileCursor: (profileId) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [profileId]: _removed, ...rest } = state.profileCursors;
          return { profileCursors: rest };
        });
      },

      clearAllCursors: () => {
        set({ profileCursors: {} });
      },

      // Image selection actions
      toggleImageSelection: (image) => {
        set((state) => {
          const isSelected = state.selectedImages.some((img) => img.id === image.id);

          if (isSelected) {
            // Remove from selection
            return {
              selectedImages: state.selectedImages.filter((img) => img.id !== image.id),
            };
          } else {
            // Add to selection with FIFO behavior
            const newSelected = [...state.selectedImages, image];

            // If exceeds max, remove the first (oldest) item
            if (newSelected.length > state.maxSelectedImages) {
              newSelected.shift();
            }

            return { selectedImages: newSelected };
          }
        });
      },

      clearSelectedImages: () => {
        set({ selectedImages: [] });
      },

      removeSelectedImage: (imageId) => {
        set((state) => ({
          selectedImages: state.selectedImages.filter((img) => img.id !== imageId),
        }));
      },

      isImageSelected: (imageId) => {
        return get().selectedImages.some((img) => img.id === imageId);
      },

      // Configuration actions
      setMaxSelectedImages: (max) => {
        set((state) => {
          // Ensure max is between 1 and 10
          const validMax = Math.max(1, Math.min(10, max));

          // If new max is less than current selection, trim from the beginning (FIFO)
          const trimmedSelection = state.selectedImages.slice(-validMax);

          return {
            maxSelectedImages: validMax,
            selectedImages: trimmedSelection,
          };
        });
      },
    }),
    {
      name: "image-gallery-storage",
    }
  )
);
