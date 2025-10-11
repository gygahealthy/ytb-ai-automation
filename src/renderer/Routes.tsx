// JSX runtime does not require explicit React import
import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import AutomationPage from "./pages/AutomationPage";
import ProfilesPage from "./pages/ProfilesPage";
import ChannelAnalysisPromptsPage from "./pages/admin/ChannelAnalysisPromptsPage";
import PlatformAnalysisPromptsPage from "./pages/admin/PlatformAnalysisPromptsPage";
import VideoCreationPromptsPage from "./pages/admin/VideoCreationPromptsPage";
import ChatAutomation from "./pages/automation/ChatAutomation";
import InstanceDashboard from "./pages/automation/InstanceDashboard";
import MyVideoChannelsPage from "./pages/video-creation/MyVideoChannelsPage";
import PromptFlowConfigPage from "./pages/video-creation/PromptFlowConfigPage";
import SingleVideoCreationPage from "./pages/video-creation/SingleVideoCreationPage";

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
      <Route path="/video-creation/channels" element={<MyVideoChannelsPage />} />
      <Route path="/video-creation/single" element={<SingleVideoCreationPage />} />
      <Route path="/video-creation/prompt-flows" element={<PromptFlowConfigPage />} />
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
