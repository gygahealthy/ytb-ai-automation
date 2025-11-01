import { useState, useEffect, useCallback } from "react";
import { HashRouter } from "react-router-dom";
import LogDrawer from "./components/common/drawers/log/LogDrawer";
import Sidebar from "./components/common/Sidebar";
import SettingsForm from "./components/common/settings/SettingsForm";
// page components are now loaded via src/renderer/Routes.tsx
import { Settings } from "lucide-react";
import AppRoutes from "./Routes";
import { DrawerProvider } from "./contexts/DrawerContext";
import { GeminiChatProvider } from "./contexts/GeminiChatContext";
import { ToastProvider } from "./contexts/ToastContext";
import { OverlayPortalProvider } from "./contexts/OverlayPortalContext";
import { ImageCacheProvider } from "./contexts/ImageCacheContext";
import { AlertProvider } from "./hooks/useAlert";
import { ConfirmProvider } from "./hooks/useConfirm";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ModalProvider, useModal } from "./hooks/useModal";
import { useLogStore } from "./store/log.store";
import { useSettingsStore } from "./store/settings.store";
import { useDrawer } from "./hooks/useDrawer";

export type Page =
  | "dashboard"
  | "automation"
  | "automation.chat"
  | "automation.dashboard"
  | "profiles"
  | "history"
  | "admin"
  | "admin.prompt-types"
  | "video-creation"
  | "video-creation.channels"
  | "video-creation.single"
  | "video-creation.prompt-flows"
  | "video-creation.master-prompts"
  | "video-creation.story"
  | "video-creation.history";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const modal = useModal();
  const { isPinned: logDrawerPinned } = useLogStore();
  const { isPinned: genericDrawerPinned } = useDrawer();

  // Initialize keyboard shortcuts listener
  useKeyboardShortcuts();

  const handleSettingsClick = useCallback(() => {
    modal.openModal({
      title: "Settings",
      icon: <Settings className="w-6 h-6 text-indigo-500" />,
      content: <SettingsForm />,
      footer: (
        <div className="flex items-center gap-2">
          <button
            onClick={() => modal.closeModal()}
            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm font-medium transition-colors"
            aria-label="Close settings"
            title="Close settings"
          >
            Done
          </button>
        </div>
      ),
      size: "xl",
      // allow Settings to render a sidebar layout inside the modal
      contentClassName: "",
    });
  }, [modal]);

  // Listen for keyboard shortcut to open/close settings
  useEffect(() => {
    const handleToggleSettingsEvent = () => {
      console.log("[App] toggle-settings-modal event received");
      // Toggle: if modal is open, close it; otherwise open it
      if (modal.isOpen) {
        modal.closeModal();
      } else {
        handleSettingsClick();
      }
    };

    window.addEventListener("open-settings-modal", handleToggleSettingsEvent);
    return () => {
      window.removeEventListener("open-settings-modal", handleToggleSettingsEvent);
    };
  }, [handleSettingsClick, modal.isOpen]);

  // Calculate total right margin based on pinned drawers
  const anyDrawerPinned = logDrawerPinned || genericDrawerPinned;

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onSettingsClick={handleSettingsClick} />

        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${anyDrawerPinned ? "mr-[25%]" : ""}`}>
          <AppRoutes />
        </main>

        {/* Global Log Drawer */}
        <LogDrawer />
      </div>
    </HashRouter>
  );
}

function App() {
  const { theme } = useSettingsStore();

  return (
    <div className={theme}>
      <ImageCacheProvider>
        <ModalProvider>
          <AlertProvider>
            <ConfirmProvider>
              <ToastProvider>
                <DrawerProvider>
                  <GeminiChatProvider>
                    <OverlayPortalProvider>
                      <AppContent />
                    </OverlayPortalProvider>
                  </GeminiChatProvider>
                </DrawerProvider>
              </ToastProvider>
            </ConfirmProvider>
          </AlertProvider>
        </ModalProvider>
      </ImageCacheProvider>
    </div>
  );
}

export default App;
