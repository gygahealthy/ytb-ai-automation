import { useState, useCallback, useEffect } from "react";
import { User, Image as ImageIcon } from "lucide-react";
import { useDrawer } from "@hooks/useDrawer";
import { useDefaultProfileStore } from "@store/default-profile.store";
import ProfileDrawer from "@/renderer/components/video-creation/single-video-page/ProfileDrawer";
import ImageGalleryDrawer from "@/renderer/components/common/drawers/image-gallery/ImageGalleryDrawer";

/**
 * Hook to manage UI state for drawers, modals, and profile/project selection
 */
export function useVideoCreationUI() {
  const [showAddJsonModal, setShowAddJsonModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Get Flow profile/project from default profile store
  const flowProfileId = useDefaultProfileStore((state) => state.flowProfileId);
  const flowProjectId = useDefaultProfileStore((state) => state.flowProjectId);
  const setFlowProfile = useDefaultProfileStore((state) => state.setFlowProfile);

  // Use Flow profile/project from store, fallback to empty string for compatibility
  const selectedProfileId = flowProfileId || "";
  const selectedProjectId = flowProjectId || "";

  const { openDrawer, closeDrawer } = useDrawer();

  /**
   * Open the profile/project selection drawer
   */
  const handleOpenProfileDrawer = useCallback(() => {
    openDrawer({
      title: "Profile & Project Selection",
      icon: <User className="w-5 h-5" />,
      children: (
        <ProfileDrawer
          initialProfileId={selectedProfileId || null}
          initialProjectId={selectedProjectId || null}
          onApply={(p, pr) => {
            // Save to default profile store
            setFlowProfile(p ?? null, pr ?? null);
          }}
          onClose={closeDrawer}
        />
      ),
    });
  }, [selectedProfileId, selectedProjectId, openDrawer, closeDrawer, setFlowProfile]);

  /**
   * Open the image gallery drawer
   */
  const handleOpenImageGallery = useCallback(() => {
    console.log("[useVideoCreationUI] handleOpenImageGallery clicked at", Date.now());
    openDrawer({
      title: "Image Gallery",
      icon: <ImageIcon className="w-5 h-5 text-purple-500" />,
      children: <ImageGalleryDrawer />,
      side: "right",
      width: "w-96",
      enablePin: true,
    });
  }, [openDrawer]);

  /**
   * Register profile drawer API for keyboard shortcuts
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const api = (window as any).__veo3_drawer_api;
    (window as any).__veo3_profile_drawer_api = {
      toggle: () => {
        try {
          if (api && typeof api.toggle === "function") {
            api.toggle({
              title: "Profile & Project Selection",
              icon: <User className="w-5 h-5" />,
              children: (
                <ProfileDrawer
                  initialProfileId={selectedProfileId || null}
                  initialProjectId={selectedProjectId || null}
                  onApply={(p, pr) => {
                    // Save to default profile store
                    setFlowProfile(p ?? null, pr ?? null);
                  }}
                />
              ),
            });
          } else {
            // fallback to dispatch event
            window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
          }
        } catch (err) {
          console.error("[Profile API] Failed to toggle profile drawer", err);
          window.dispatchEvent(new CustomEvent("toggle-profile-drawer"));
        }
      },
      isOpen: () => (api && typeof api.isOpen === "function" ? api.isOpen() : false),
    };

    return () => {
      try {
        delete (window as any).__veo3_profile_drawer_api;
      } catch (e) {
        /* ignore */
      }
    };
  }, [selectedProfileId, selectedProjectId, setFlowProfile]);

  /**
   * Listen for custom event to toggle profile drawer
   */
  useEffect(() => {
    const handleToggleProfileDrawer = () => {
      handleOpenProfileDrawer();
    };

    window.addEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
    return () => window.removeEventListener("toggle-profile-drawer", handleToggleProfileDrawer);
  }, [handleOpenProfileDrawer]);

  return {
    // Modal state
    showAddJsonModal,
    setShowAddJsonModal,
    selectedJobId,
    setSelectedJobId,

    // Profile/Project state (read from default profile store)
    selectedProfileId,
    selectedProjectId,

    // Drawer handlers
    handleOpenProfileDrawer,
    handleOpenImageGallery,
  };
}
