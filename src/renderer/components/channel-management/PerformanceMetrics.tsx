import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { PerformanceMetrics as PerformanceMetricsType } from '../../../main/modules/channel-management/youtube.types';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface Props {
  channelId: string;
  performance: PerformanceMetricsType;
}

const PerformanceMetrics: React.FC<Props> = ({ performance }) => {
  const { current, growth } = performance;

  const renderGrowthIndicator = (value: number) => {
    if (value === 0) return null;
    
    const isPositive = value > 0;
    return (
      <div className={`flex items-center space-x-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{isPositive ? '+' : ''}{formatNumber(value)}</span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 size={20} className="text-green-400" />
        <h2 className="text-lg font-semibold">Current Performance</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Subscribers</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{formatNumber(current.subscriberCount)}</span>
            {renderGrowthIndicator(growth.subscribers)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Total Views</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{formatNumber(current.totalViews)}</span>
            {renderGrowthIndicator(growth.views)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Videos</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{current.videoCount}</span>
            {renderGrowthIndicator(growth.videos)}
          </div>
        </div>

        {current.avgViewsPerVideo && (
          <div>
            <div className="text-xs text-gray-400 mb-1">Avg Views/Video</div>
            <span className="text-lg font-semibold">{formatNumber(current.avgViewsPerVideo)}</span>
          </div>
        )}

        {current.engagementRate && (
          <div>
            <div className="text-xs text-gray-400 mb-1">Engagement Rate</div>
            <span className="text-lg font-semibold">{formatPercent(current.engagementRate)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-700 text-xs text-gray-500">
          Last updated: {current.metricDate}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
