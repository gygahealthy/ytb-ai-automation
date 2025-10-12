// JSX runtime does not require explicit React import
import { Navigate, Route, Routes } from "react-router-dom";
import MasterPromptConfigPage from "./pages/admin/MasterPromptConfigPage";
import AutomationPage from "./pages/AutomationPage";
import ProfilesPage from "./pages/ProfilesPage";
import ChannelAnalysisPromptsPage from "./pages/admin/master-prompt-config/ChannelAnalysisPromptsPage";
import PlatformAnalysisPromptsPage from "./pages/admin/master-prompt-config/PlatformAnalysisPromptsPage";
import VideoCreationPromptsPage from "./pages/admin/master-prompt-config/VideoCreationPromptsPage";
import ChatAutomation from "./pages/automation/ChatAutomation";
import InstanceDashboard from "./pages/automation/InstanceDashboard";
import MyVideoChannelsPage from "./pages/MyVideoChannelsPage";
import PromptFlowConfigPage from "./pages/admin/PromptFlowConfigPage";
import SingleVideoCreationPage from "./pages/video-creation/SingleVideoCreationPage";
import VideoHistoryPage from "./pages/video-creation/VideoHistoryPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/profiles" replace />} />
      <Route path="/profiles" element={<ProfilesPage />} />
      <Route path="/automation" element={<AutomationPage />} />
      <Route path="/automation/instance" element={<InstanceDashboard />} />
      <Route path="/automation/:instanceId/chat" element={<ChatAutomation />} />
      <Route path="/admin/dashboard" element={<MasterPromptConfigPage />} />
      <Route path="/admin/prompt-flows" element={<PromptFlowConfigPage />} />
      <Route path="/admin/prompts/platform-analysis" element={<PlatformAnalysisPromptsPage />} />
      <Route path="/admin/prompts/channel-analysis" element={<ChannelAnalysisPromptsPage />} />
      <Route path="/admin/prompts/video-creation" element={<VideoCreationPromptsPage />} />
      <Route path="/video-creation/channels" element={<MyVideoChannelsPage />} />
      <Route path="/video-creation/single" element={<SingleVideoCreationPage />} />
      <Route path="/video-creation/history" element={<VideoHistoryPage />} />
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
