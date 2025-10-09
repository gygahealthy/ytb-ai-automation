import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import SettingsForm from "./components/settings/SettingsForm";
// page components are now loaded via src/renderer/Routes.tsx
import AppRoutes from './Routes';
import { useSettingsStore } from "./store/settings.store";
import { AlertProvider } from './hooks/useAlert';
import { ConfirmProvider } from './hooks/useConfirm';
import { ModalProvider, useModal } from './hooks/useModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Settings } from 'lucide-react';

export type Page = "dashboard" | "automation" | "automation.chat" | "automation.dashboard" | "profiles" | "history" | "admin";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const modal = useModal();

  // Initialize keyboard shortcuts listener
  useKeyboardShortcuts();

  const handleSettingsClick = () => {
    modal.openModal({
      title: 'Settings',
      icon: <Settings className="w-6 h-6 text-indigo-500" />,
      content: <SettingsForm />,
      footer: (
        <button
          onClick={() => modal.closeModal()}
          className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
        >
          Done
        </button>
      ),
      size: 'xl',
      // allow Settings to render a sidebar layout inside the modal
      contentClassName: '',
    });
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onSettingsClick={handleSettingsClick} />

        <main className="flex-1 overflow-y-auto">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  const { theme } = useSettingsStore();

  return (
    <div className={theme}>
      <ModalProvider>
      <AlertProvider>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
      </AlertProvider>
      </ModalProvider>
    </div>
  );
}

export default App;
