import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, BarChart3, Target } from 'lucide-react';

const CompetitorMonitoringPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(`/video-creation/channels/${channelId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Competitor Monitoring & Tracking</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and analyze your competition</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Users className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Competitor Intelligence Center
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Comprehensive competitor monitoring and analysis tools coming soon
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Growth Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor subscriber growth, view trends, and engagement rates
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Content Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze video strategies, topics, and publishing patterns
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Benchmarking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare your performance against competitors
                </p>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => navigate(`/video-creation/channels/${channelId}`)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Channel Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitorMonitoringPage;
