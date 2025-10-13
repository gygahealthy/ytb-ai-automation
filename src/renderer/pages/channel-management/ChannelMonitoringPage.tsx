import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, Video } from 'lucide-react';

const ChannelMonitoringPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/video-creation/channels/${channelId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Channel Monitoring & Analytics
            </h1>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Channel Monitoring Dashboard
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            This page will contain comprehensive analytics, performance metrics, and monitoring tools for your channel.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Performance Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor views, engagement, and growth metrics over time
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Video Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deep dive into individual video performance and insights
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Audience Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Understand your audience demographics and behavior
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Coming soon... Content will be added later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelMonitoringPage;
