import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PlayCircle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ArrowLeft,
  Edit2,
  FileText,
  Zap,
  Video,
  Eye,
  Users,
  Plus,
} from "lucide-react";
import { ChannelCompleteView } from "../../../main/modules/channel-management/youtube.types";
import { getChannelCompleteView, upsertChannelDeepDive } from "../../ipc/youtube";
import { formatNumber, formatRelativeTime } from "../../../shared/utils/formatters";
import StrategyModal from "../../components/channel-management/channel-deep-dive/StrategyModal";
import PromptModal from "../../components/master-prompt/PromptModal";
import UpcomingTopics from "../../components/channel-management/channel-deep-dive/UpcomingTopics";

const ChannelDeepDivePage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channelData, setChannelData] = useState<ChannelCompleteView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    if (channelId) {
      loadChannelData();
    }
  }, [channelId]);

  const loadChannelData = async () => {
    if (!channelId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getChannelCompleteView(channelId);
      if (response.success && response.data) {
        setChannelData(response.data);
      } else {
        setError(response.error || "Failed to load channel data");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStrategy = async (strategy: string, usp: string) => {
    if (!channelId) return;

    try {
      const data = {
        strategyMarkdown: strategy,
        uspMarkdown: usp,
      };

      const response = await upsertChannelDeepDive(channelId, data);
      if (response.success) {
        await loadChannelData();
      } else {
        alert(response.error || "Failed to save strategy");
      }
    } catch (err) {
      alert(String(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading channel data...</p>
        </div>
      </div>
    );
  }

  if (error || !channelData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Channel not found"}</p>
          <button
            onClick={() => navigate("/video-creation/channels")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Channels
          </button>
        </div>
      </div>
    );
  }

  const { channel, deepDive, performance, competitors, recentVideos, upcomingTopics, assignedPrompts } = channelData;

  const promptTypes = [
    { name: "Script Topic", kind: "topic", color: "bg-blue-500" },
    { name: "Video Script", kind: "script", color: "bg-purple-500" },
    { name: "Title Ideas", kind: "title", color: "bg-green-500" },
    { name: "AI Scripts", kind: "ai_script", color: "bg-yellow-500" },
    { name: "Assemble Clips", kind: "clips", color: "bg-pink-500" },
    { name: "Audio Files", kind: "audio", color: "bg-indigo-500" },
  ];

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-950 flex flex-col animate-fadeIn">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          {/* Back button and title */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/video-creation/channels")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Channel Deep Dive: <span className="text-blue-600 dark:text-blue-400">{channel.channelName}</span>
            </h1>
          </div>

          {/* Channel Info Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              {/* Left side - Channel Info with Stats */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-blue-500/10">
                  <PlayCircle className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{channel.channelName}</h2>
                  <div className="flex items-center gap-4">
                    {/* Subscribers */}
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatNumber(channel.subscriberCount || 0)}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">subscribers</span>
                      {performance && performance.growth.subscribers !== 0 && (
                        <div
                          className={`flex items-center gap-0.5 text-[10px] ${
                            performance.growth.subscribers > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {performance.growth.subscribers > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="font-semibold">
                            {performance.growth.subscribers > 0 ? "+" : ""}
                            {formatNumber(performance.growth.subscribers)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>

                    {/* Views */}
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatNumber(channel.viewCount || 0)}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">views</span>
                      {performance && performance.growth.views !== 0 && (
                        <div
                          className={`flex items-center gap-0.5 text-[10px] ${
                            performance.growth.views > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {performance.growth.views > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="font-semibold">
                            {performance.growth.views > 0 ? "+" : ""}
                            {formatNumber(performance.growth.views)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>

                    {/* YouTube Link */}
                    <a
                      href={channel.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-xs font-medium group transition-colors"
                    >
                      <span>View Channel</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right side - Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Strategy Button */}
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-200 group"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Strategy
                    </div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {deepDive?.strategyMarkdown ? "Edit Strategy" : "Define Strategy"}
                    </div>
                  </div>
                  <Edit2 className="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>

                {/* Competitor Tracking Button */}
                <button
                  onClick={() => navigate(`/video-creation/channels/${channelId}/competitors`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 rounded-lg border border-orange-200 dark:border-orange-800 transition-all duration-200 group"
                >
                  <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <div className="text-left">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Competitors
                    </div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{competitors.length} tracked</div>
                  </div>
                  <Eye className="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-6 py-6 h-full">
          <div className="grid grid-cols-3 gap-6 h-full">
            {/* Takes full available height */}
            {/* Left Column - 1/3 width */}
            <div className="col-span-1 flex flex-col gap-6 h-full overflow-hidden">
              {/* Prompt Configuration Card - Fixed height */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden flex-shrink-0">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prompt Config</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{assignedPrompts} prompts assigned</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {promptTypes.map((prompt) => (
                      <button
                        key={prompt.kind}
                        onClick={() => setShowPromptModal(true)}
                        className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl p-3 text-left transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md group"
                      >
                        <div className={`w-2.5 h-2.5 ${prompt.color} rounded-full mb-2`}></div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{prompt.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">Click to configure</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Topics Card - Takes remaining height */}
              <div className="flex-1 min-h-0">
                <UpcomingTopics channelId={channelId!} topics={upcomingTopics} onUpdate={loadChannelData} />
              </div>
            </div>

            {/* Right Column - 2/3 width - Videos Performance Full Height */}
            <div className="col-span-2 flex flex-col h-full overflow-hidden">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden flex flex-col h-full">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Video className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Videos Performance</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{recentVideos.length} recent videos</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/video-creation/channels/${channelId}/monitoring`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Show More</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Create New Video Card */}
                    <button
                      onClick={() => navigate("/video-creation/single")}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-xl p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col items-center justify-center gap-3 min-h-[200px] group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">Create New Video</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Start creating content</div>
                      </div>
                    </button>

                    {/* Existing Videos */}
                    {recentVideos.map((video) => (
                      <a
                        key={video.id}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 group flex flex-col min-h-[200px]"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 mb-3">
                            {video.videoTitle}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs">
                              <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white">{formatNumber(video.views)}</span>
                              <span className="text-gray-400 dark:text-gray-500">views</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1">
                                <span>👍</span>
                                <span className="font-medium text-gray-600 dark:text-gray-400">{formatNumber(video.likes)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>💬</span>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  {formatNumber(video.comments)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(video.publishedAt)}
                        </div>
                      </a>
                    ))}
                  </div>

                  {recentVideos.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Video className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">No videos yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Click the + card to create your first video</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StrategyModal
        open={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        onSave={handleSaveStrategy}
        initialStrategy={deepDive?.strategyMarkdown || ""}
        initialUsp={deepDive?.uspMarkdown || ""}
      />

      <PromptModal
        open={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSave={(prompt) => {
          console.log("Save prompt:", prompt);
          setShowPromptModal(false);
        }}
        providers={["youtube"]}
      />
    </div>
  );
};

export default ChannelDeepDivePage;
