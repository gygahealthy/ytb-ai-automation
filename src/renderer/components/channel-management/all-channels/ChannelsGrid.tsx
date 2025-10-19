// Modern JSX transform: no React import required
import { YoutubeChannel } from "../../../../main/modules/channel-management/youtube.types";
import ChannelCard from "./ChannelCard";

type Props = {
  channels: YoutubeChannel[];
  onView: (channelId: string) => void;
  onCardClick?: (channelId: string) => void;
};

export default function ChannelsGrid({ channels, onView, onCardClick }: Props) {
  if (!channels || channels.length === 0) {
    return (
      <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400">
        No channels yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
      {channels.map((ch) => (
        <ChannelCard
          key={ch.id}
          channel={ch}
          onView={onView}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
