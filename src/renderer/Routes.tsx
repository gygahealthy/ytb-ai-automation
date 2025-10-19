// JSX runtime does not require explicit React import
import { Navigate, Route, Routes } from "react-router-dom";
import MasterPromptManagementPage from "./pages/admin/MasterPromptManagementPage";
import PromptTypesManagementPage from "./pages/admin/PromptTypesManagementPage";
import AutomationPage from "./pages/AutomationPage";
import ProfilesPage from "./pages/ProfilesPage";
import ChatAutomation from "./pages/automation/ChatAutomation";
import InstanceDashboard from "./pages/automation/InstanceDashboard";
import AllChannelsOverviewPage from "./pages/AllChannelsOverviewPage";
import SingleVideoCreationPage from "./pages/video-creation/SingleVideoCreationPage";
import VideoHistoryPage from "./pages/video-creation/VideoHistoryPage";
import StoryCreatePage from "./pages/video-creation/ScriptCreatePage";
import ScriptEditorPage from "./pages/video-creation/ScriptEditorPage";
import ChannelDeepDivePage from "./pages/channel-management/ChannelDeepDivePage";
import ChannelMonitoringPage from "./pages/channel-management/ChannelMonitoringPage";
import CompetitorMonitoringPage from "./pages/channel-management/CompetitorMonitoringPage";
import { VideoCreationProvider } from "./contexts/VideoCreationContext";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/profiles" replace />} />
      <Route path="/profiles" element={<ProfilesPage />} />
      <Route path="/automation" element={<AutomationPage />} />
      <Route path="/automation/instance" element={<InstanceDashboard />} />
      <Route path="/automation/:instanceId/chat" element={<ChatAutomation />} />
      <Route path="/admin/dashboard" element={<MasterPromptManagementPage />} />
      <Route
        path="/admin/master-prompts"
        element={<MasterPromptManagementPage />}
      />
      <Route
        path="/admin/prompt-types"
        element={<PromptTypesManagementPage />}
      />
      <Route
        path="/video-creation/channels"
        element={<AllChannelsOverviewPage />}
      />
      <Route
        path="/video-creation/channels/:channelId"
        element={<ChannelDeepDivePage />}
      />
      <Route
        path="/video-creation/channels/:channelId/monitoring"
        element={<ChannelMonitoringPage />}
      />
      <Route
        path="/video-creation/channels/:channelId/competitors"
        element={<CompetitorMonitoringPage />}
      />
      <Route
        path="/video-creation/single"
        element={<SingleVideoCreationPage />}
      />
      <Route
        path="/video-creation/script-create"
        element={
          <VideoCreationProvider>
            <StoryCreatePage />
          </VideoCreationProvider>
        }
      />
      <Route
        path="/video-creation/script-editor"
        element={<ScriptEditorPage />}
      />
      <Route path="/video-creation/history" element={<VideoHistoryPage />} />
    </Routes>
  );
}
