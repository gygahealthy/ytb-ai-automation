// JSX runtime does not require explicit React import
import { Routes, Route, Navigate } from 'react-router-dom';
import AutomationPage from './pages/AutomationPage';
import ProfilesPage from './pages/ProfilesPage';
import ChatAutomation from './pages/automation/ChatAutomation';
import InstanceDashboard from './pages/automation/InstanceDashboard';
import AdminPage from './pages/AdminPage';
import PlatformAnalysisPromptsPage from './pages/admin/PlatformAnalysisPromptsPage';
import ChannelAnalysisPromptsPage from './pages/admin/ChannelAnalysisPromptsPage';
import VideoCreationPromptsPage from './pages/admin/VideoCreationPromptsPage';
import ModalDemoPage from './pages/ModalDemoPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/profiles" replace />} />
      <Route path="/profiles" element={<ProfilesPage />} />
      <Route path="/automation" element={<AutomationPage />} />
      <Route path="/automation/instance" element={<InstanceDashboard />} />
      <Route path="/automation/:instanceId/chat" element={<ChatAutomation />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/prompts/platform-analysis" element={<PlatformAnalysisPromptsPage />} />
      <Route path="/admin/prompts/channel-analysis" element={<ChannelAnalysisPromptsPage />} />
      <Route path="/admin/prompts/video-creation" element={<VideoCreationPromptsPage />} />
      <Route path="/modal-demo" element={<ModalDemoPage />} />
      <Route
        path="/history"
        element={
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">History</h1>
            <p className="text-gray-600 dark:text-gray-400">History page coming soon...</p>
          </div>
        }
      />
    </Routes>
  );
}
