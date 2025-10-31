// JSX runtime does not require explicit React import
import { Navigate, Route, Routes } from "react-router-dom";
import MasterPromptPage from "@pages/master-prompt/MasterPromptPage";
import PromptTypesPage from "@pages/master-prompt/PromptTypesPage";
import AIPromptConfigPage from "@components/master-prompt/ai-prompt-config";
import PromptPlaygroundPage from "@pages/master-prompt/PromptPlaygroundPage";
import AutomationPage from "@/renderer/pages/AutomationPage";
import ProfilesPage from "@pages/profiles/ProfilesPage";
import CookieRotationConfigPage from "@pages/profiles/CookieRotationConfigPage";
import ChatAutomation from "@/renderer/pages/profiles/browser-launch/ChatAutomation";
import BrowserLaunchPage from "@/renderer/pages/profiles/browser-launch/BrowserLaunchPage";
import AllChannelsOverviewPage from "@pages/channel-management/AllChannelsOverviewPage";
import SingleVideoCreationPage from "@pages/video-creation/SingleVideoCreationPage";
import VideoHistoryPage from "@pages/video-creation/VideoHistoryPage";
import StoryCreatePage from "@pages/video-creation/ScriptCreatePage";
import ScriptEditorPage from "@pages/video-creation/ScriptEditorPage";
import VideoStudioPage from "@pages/video-studio/VideoStudioPage";
import ChannelDeepDivePage from "@pages/channel-management/ChannelDeepDivePage";
import ChannelMonitoringPage from "@pages/channel-management/ChannelMonitoringPage";
import CompetitorMonitoringPage from "@pages/channel-management/CompetitorMonitoringPage";
import { VideoCreationProvider } from "@contexts/VideoCreationContext";
import { VideoGenerationPollingProvider } from "@contexts/VideoGenerationPollingContext";

export default function AppRoutes() {
  return (
    <VideoGenerationPollingProvider pollInterval={10000} staggerDelay={1000}>
      <Routes>
        <Route path="/" element={<Navigate to="/profiles" replace />} />

        {/* Profiles routes */}
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/profiles/cookie-rotation" element={<CookieRotationConfigPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/profiles/browser-launch" element={<BrowserLaunchPage />} />
        <Route path="/profiles/browser-launch/:profileId" element={<BrowserLaunchPage />} />
        <Route path="/automation/:instanceId/chat" element={<ChatAutomation />} />
        <Route path="/master-prompt/dashboard" element={<MasterPromptPage />} />
        <Route path="/master-prompt/master-prompts" element={<MasterPromptPage />} />
        <Route path="/master-prompt/prompt-types" element={<PromptTypesPage />} />
        <Route path="/master-prompt/ai-prompt-config" element={<AIPromptConfigPage />} />
        <Route path="/master-prompt/prompt-playground" element={<PromptPlaygroundPage />} />
        <Route path="/video-creation/channels" element={<AllChannelsOverviewPage />} />
        <Route path="/video-creation/channels/:channelId" element={<ChannelDeepDivePage />} />
        <Route path="/video-creation/channels/:channelId/monitoring" element={<ChannelMonitoringPage />} />
        <Route path="/video-creation/channels/:channelId/competitors" element={<CompetitorMonitoringPage />} />
        <Route path="/video-creation/single" element={<SingleVideoCreationPage />} />
        <Route path="/video-creation/studio" element={<VideoStudioPage />} />
        <Route path="/video-creation/studio/:projectId" element={<VideoStudioPage />} />
        <Route
          path="/video-creation/script-create"
          element={
            <VideoCreationProvider>
              <StoryCreatePage />
            </VideoCreationProvider>
          }
        />
        <Route path="/video-creation/script-editor" element={<ScriptEditorPage />} />
        <Route path="/video-creation/history" element={<VideoHistoryPage />} />
      </Routes>
    </VideoGenerationPollingProvider>
  );
}
