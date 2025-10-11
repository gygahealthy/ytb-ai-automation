import { Edit2, Eye, Plus, Search, Settings, Trash2, TrendingUp, Video, Youtube } from "lucide-react";
import { useState } from "react";

interface Channel {
  id: string;
  name: string;
  platform: "youtube" | "tiktok";
  strategy: string;
  targetAudience: string;
  usp: string;
  videoCount: number;
  competitorCount: number;
  createdAt: string;
}

export default function MyVideoChannelsPage() {
  const [channels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "strategy" | "videos" | "competitors">("overview");

  const filteredChannels = channels.filter((channel) => channel.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Video Channels</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your YouTube and TikTok channel projects</p>
          </div>
          <button
            onClick={() => {
              /* TODO: Open create channel modal */
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Channel Project</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Channel List Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No channels yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Create your first channel project to get started</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                    selectedChannel?.id === channel.id
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500"
                      : "bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {channel.platform === "youtube" ? (
                          <Youtube className="w-5 h-5 text-red-500" />
                        ) : (
                          <Video className="w-5 h-5 text-cyan-500" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">{channel.name}</h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{channel.strategy}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
                        <span>{channel.videoCount} videos</span>
                        <span>{channel.competitorCount} competitors</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Channel Details */}
        <div className="flex-1 overflow-y-auto">
          {!selectedChannel ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">Select a channel to view details</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Channel Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                      {selectedChannel.platform === "youtube" ? (
                        <Youtube className="w-8 h-8 text-white" />
                      ) : (
                        <Video className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChannel.name}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedChannel.platform === "youtube" ? "YouTube Channel" : "TikTok Channel"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChannel.videoCount}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Videos</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChannel.competitorCount}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Competitors</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Workflows</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex">
                    {[
                      { id: "overview" as const, label: "Overview", icon: Eye },
                      { id: "strategy" as const, label: "Channel Strategy", icon: Settings },
                      { id: "videos" as const, label: "Videos", icon: Video },
                      { id: "competitors" as const, label: "Competitor Analysis", icon: TrendingUp },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                            activeTab === tab.id
                              ? "border-primary-500 text-primary-500"
                              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Info</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Created on {new Date(selectedChannel.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "strategy" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Channel Strategy</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedChannel.strategy || "No strategy defined yet"}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unique Selling Proposition (USP)</h3>
                        <p className="text-gray-600 dark:text-gray-400">{selectedChannel.usp || "No USP defined yet"}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Target Audience</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedChannel.targetAudience || "No target audience defined yet"}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                        Edit Strategy
                      </button>
                    </div>
                  )}

                  {activeTab === "videos" && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Manage your video content and resources</p>
                      <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                        Create New Video
                      </button>
                    </div>
                  )}

                  {activeTab === "competitors" && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Monitor and analyze competitor channels</p>
                      <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                        Add Competitor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
