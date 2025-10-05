import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SettingsModal from "./components/SettingsModal";
import Sidebar from "./components/Sidebar";
import AutomationPage from "./pages/AutomationPage";
import ProfilesPage from "./pages/ProfilesPage";
import ChatAutomation from "./pages/automation/ChatAutomation";
import InstanceDashboard from "./pages/automation/InstanceDashboard";
import { useSettingsStore } from "./store/settings.store";

export type Page = "dashboard" | "automation" | "automation.chat" | "automation.dashboard" | "profiles" | "history";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme } = useSettingsStore();

  return (
    <div className={theme}>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onSettingsClick={() => setIsSettingsOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/profiles" replace />} />
              <Route path="/profiles" element={<ProfilesPage />} />
              <Route path="/automation" element={<AutomationPage />} />
              <Route path="/automation/instance" element={<InstanceDashboard />} />
              <Route path="/automation/:instanceId/chat" element={<ChatAutomation />} />
              <Route path="/history" element={
                <div className="p-8"> 
                  <h1 className="text-3xl font-bold mb-6">History</h1>
                  <p className="text-gray-600 dark:text-gray-400">History page coming soon...</p>
                </div>
              } />
            </Routes>
          </main>

          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
