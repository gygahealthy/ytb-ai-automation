import { useState } from "react";
import SettingsModal from "./components/SettingsModal";
import Sidebar from "./components/Sidebar";
import AutomationPage from "./pages/AutomationPage";
import Dashboard from "./pages/Dashboard";
import ProfilesPage from "./pages/ProfilesPage";
import { useSettingsStore } from "./store/settings.store";

export type Page = "dashboard" | "automation" | "profiles" | "history";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme } = useSettingsStore();

  return (
    <div className={theme}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onSettingsClick={() => setIsSettingsOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "automation" && <AutomationPage />}
          {currentPage === "profiles" && <ProfilesPage />}
          {currentPage === "history" && (
            <div className="p-8">
              <h1 className="text-3xl font-bold mb-6">History</h1>
              <p className="text-gray-600 dark:text-gray-400">History page coming soon...</p>
            </div>
          )}
        </main>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}

export default App;
