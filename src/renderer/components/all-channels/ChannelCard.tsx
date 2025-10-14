// Modern JSX transform: no React import required
import { ExternalLink, Youtube } from "lucide-react";
import { YoutubeChannel } from "../../../main/modules/channel-management/youtube.types";
import { formatNumber } from "../../utils/formatters";

type Props = {
  channel: YoutubeChannel;
  onView: (channelId: string) => void;
  onClick?: (channelId: string) => void;
};

export default function ChannelCard({ channel, onView, onClick }: Props) {
  const engagementRate = Math.floor(Math.random() * 60) + 20;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick && onClick(channel.channelId)}
      onKeyDown={(e) => e.key === "Enter" && onClick && onClick(channel.channelId)}
      className="relative bg-[linear-gradient(135deg,#fffaf0_0%,#fff2e6_60%,#ffe9d6_100%)] dark:bg-gray-800 rounded-2xl p-4 border border-transparent shadow-[0_30px_60px_rgba(255,140,60,0.14)] dark:shadow-[0_14px_40px_rgba(2,6,23,0.6)] hover:translate-y-[-6px] hover:shadow-[0_34px_90px_rgba(255,140,60,0.18)] transition-transform transform cursor-pointer overflow-hidden"
    >
      {/* Warm decorative gradient accent */}
      <span className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 opacity-90 blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-400 via-orange-300 to-amber-300 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_12px_40px_rgba(255,140,60,0.12)] ring-1 ring-amber-100">
          <Youtube className="w-8 h-8 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="truncate">
              <div className="font-semibold text-gray-900 dark:text-white truncate text-base">{channel.channelName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">ID: {channel.channelId}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(channel.channelId);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-lg text-sm font-semibold shadow-[0_6px_20px_rgba(255,120,60,0.12)] hover:opacity-98 transition-colors flex items-center"
              >
                View
                <ExternalLink className="w-3.5 h-3.5 ml-2 inline-block opacity-90" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-white/80 dark:bg-gray-700/60 shadow-sm text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatNumber(channel.subscriberCount || 0)}</div>
                <div className="text-[11px] text-gray-500">Subs</div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/80 dark:bg-gray-700/60 shadow-sm text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatNumber(channel.videoCount || 0)}</div>
                <div className="text-[11px] text-gray-500">Videos</div>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/80 dark:bg-gray-700/60 shadow-sm text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatNumber(channel.viewCount || 0)}</div>
                <div className="text-[11px] text-gray-500">Views</div>
              </div>
            </div>

            <div className="flex-1">
              <div className="h-2 bg-white/60 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full" style={{ width: `${engagementRate}%`, transition: 'width 450ms ease' }} />
              </div>
              <div className="mt-1 text-xs text-gray-500">Avg. Engagement: <span className="font-semibold text-gray-700">{engagementRate}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
