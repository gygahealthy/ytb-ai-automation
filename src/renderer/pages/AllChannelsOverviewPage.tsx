import { ExternalLink, Eye, Plus, TrendingDown, TrendingUp, Video as VideoIcon, X, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { YoutubeChannel } from "../../main/modules/channel-management/youtube.types";
import { createChannel, getAllChannels } from "../ipc/youtube";
import { formatNumber } from "../utils/formatters";

interface CreateChannelForm {
  channelName: string;
  channelId: string;
  channelUrl: string;
}

export default function AllChannelsOverviewPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<YoutubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateChannelForm>({
    channelName: "",
    channelId: "",
    channelUrl: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const response = await getAllChannels();
      if (response.success && response.data) {
        setChannels(response.data);
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!createForm.channelName.trim() || !createForm.channelId.trim()) {
      setCreateError("Channel name and ID are required");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createChannel({
        channelName: createForm.channelName,
        channelId: createForm.channelId,
        channelUrl: createForm.channelUrl || `https://youtube.com/@${createForm.channelId}`,
      });

      if (response.success && response.data) {
        // Close modal, reset form, and reload channels
        setShowCreateModal(false);
        setCreateForm({ channelName: "", channelId: "", channelUrl: "" });
        await loadChannels();
        // Navigate to the new channel
        navigate(`/video-creation/channels/${response.data.channelId}`);
      } else {
        setCreateError(response.error || "Failed to create channel");
      }
    } catch (error) {
      setCreateError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const totalSubscribers = channels.reduce((sum, ch) => sum + (ch.subscriberCount || 0), 0);
  const totalViews = channels.reduce((sum, ch) => sum + (ch.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">All Channels Overview</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and compare all your video channels</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-transparent rounded-md p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              aria-label="Add channel"
              title="Add new channel"
              className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 text-white rounded-full font-medium transition-transform hover:scale-105 shadow-xl"
            >
              {/* Strong glowing ring */}
              <span
                className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 opacity-40 blur-xl animate-pulse"
                aria-hidden="true"
              />
              <Plus className="w-6 h-6 relative z-10" />
            </button>
          </div>
        </div>

        {/* Stats Cards (compact) */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totalSubscribers)}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Subscribers</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+350K (last 30 days)</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Youtube className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Videos</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(channels.reduce((sum, ch) => sum + (ch.videoCount || 0), 0))}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upload</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <VideoIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Views</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(totalViews)}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">(30 Days)</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Performance Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Channel Performance Comparison</h2>
          </div>

          <div className="px-6 py-4">
            {viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Channel & Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subscribers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Videos Upload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Avg. Engagement Rate
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                            <p>Loading channels...</p>
                          </div>
                        </td>
                      </tr>
                    ) : channels.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <Youtube className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-lg font-medium mb-2">No channels yet</p>
                            <p className="text-sm">Add your first channel to start tracking performance</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      channels.map((channel) => {
                        const engagementRate = Math.floor(Math.random() * 60) + 20; // Mock data
                        const isPositiveGrowth = Math.random() > 0.3;

                        return (
                          <tr
                            key={channel.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/video-creation/channels/${channel.channelId}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Youtube className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                                    {channel.channelName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    ID: {channel.channelId.substring(0, 15)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatNumber(channel.subscriberCount || 0)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{Math.floor((channel.subscriberCount || 0) * 0.05)} this month
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {formatNumber(Math.floor((channel.subscriberCount || 0) / 1000))}M
                                </span>
                                <div className="flex items-center gap-1">
                                  {isPositiveGrowth ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                      <span className="text-xs text-green-500">{Math.floor(Math.random() * 10) + 1}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                      <span className="text-xs text-red-500">{Math.floor(Math.random() * 5) + 1}%</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatNumber(channel.videoCount || 0)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isPositiveGrowth ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                      <span className="text-xs text-green-500">+{Math.floor(Math.random() * 20) + 5}</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                      <span className="text-xs text-red-500">-{Math.floor(Math.random() * 10) + 1}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatNumber(channel.viewCount || 0)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isPositiveGrowth ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                      <span className="text-xs text-green-500">+{Math.floor(Math.random() * 15) + 5}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                      <span className="text-xs text-red-500">-{Math.floor(Math.random() * 8) + 1}%</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{engagementRate}%</span>
                                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    style={{ width: `${engagementRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/video-creation/channels/${channel.channelId}`);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                {loading ? (
                  <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">Loading channels...</div>
                ) : channels.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">No channels yet</div>
                ) : (
                  channels.map((channel) => {
                    const engagementRate = Math.floor(Math.random() * 60) + 20;
                    return (
                      <div
                        key={channel.id}
                        onClick={() => navigate(`/video-creation/channels/${channel.channelId}`)}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Youtube className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">{channel.channelName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {channel.channelId}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatNumber(channel.subscriberCount || 0)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Subs</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatNumber(channel.videoCount || 0)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Videos</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatNumber(channel.viewCount || 0)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${engagementRate}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{engagementRate}%</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/video-creation/channels/${channel.channelId}`);
                            }}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Channel Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Channel</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connect your YouTube channel to start tracking and managing content
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setCreateForm({ channelName: "", channelId: "", channelUrl: "" });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {createError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Channel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.channelName}
                    onChange={(e) => setCreateForm({ ...createForm, channelName: e.target.value })}
                    placeholder="e.g., Tech Reviews Pro"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A friendly name to identify your channel</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube Channel ID / Handle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.channelId}
                    onChange={(e) => setCreateForm({ ...createForm, channelId: e.target.value })}
                    placeholder="e.g., @yourchannel or UCxxxxxx"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your YouTube channel handle (e.g., @username) or channel ID (UCxxxxxx)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Channel URL <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.channelUrl}
                    onChange={(e) => setCreateForm({ ...createForm, channelUrl: e.target.value })}
                    placeholder="e.g., https://youtube.com/@yourchannel"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Full URL to your channel (will be auto-generated if not provided)
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Youtube className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">What's Next?</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        After adding your channel, you'll be able to track performance metrics, analyze competitors, define
                        content strategy, manage prompts, and organize your video content efficiently.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setCreateForm({ channelName: "", channelId: "", channelUrl: "" });
                  }}
                  disabled={isCreating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={isCreating || !createForm.channelName.trim() || !createForm.channelId.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding Channel...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
