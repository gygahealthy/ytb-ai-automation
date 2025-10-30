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
 * Image Gallery Store State
 */
type ImageGalleryState = {
  // Cursor tracking per profile (last fetched page)
  profileCursors: Record<string, ProfileImageCursor>;

  // Actions
  setProfileCursor: (profileId: string, cursor: string | null) => void;
  getProfileCursor: (profileId: string) => string | null;
  clearProfileCursor: (profileId: string) => void;
  clearAllCursors: () => void;
};

export const useImageGalleryStore = create<ImageGalleryState>()(
  persist(
    (set, get) => ({
      profileCursors: {},

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
          const { [profileId]: _removed, ...rest } = state.profileCursors;
          return { profileCursors: rest };
        });
      },

      clearAllCursors: () => {
        set({ profileCursors: {} });
      },
    }),
    {
      name: "image-gallery-storage",
    }
  )
);
