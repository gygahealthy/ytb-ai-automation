import { InstanceState } from '../../../shared/types';
import { MessageSquare, StopCircle } from 'lucide-react';

interface Props {
  inst: InstanceState;
  profileName: string;
  onOpenChat: () => void;
  onStop: () => void;
}

export default function InstanceCard({ inst, profileName, onOpenChat, onStop }: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-500">Slot {inst.screenSlot}</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold ring-1 ring-white/10 shadow">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{profileName}</div>
              <div className="text-xs text-gray-400 truncate">{inst.provider || inst.automationType}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${inst.status === 'running' ? 'bg-green-100 text-green-800' : inst.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{inst.status}</span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <button
          onClick={onOpenChat}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm shadow-sm transition"
          aria-label="Open chat"
        >
          <MessageSquare className="w-4 h-4 text-white" aria-hidden />
          <span className="font-medium">Chat</span>
        </button>

        <button
          onClick={onStop}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 transition text-sm"
          aria-label="Stop instance"
        >
          <StopCircle className="w-4 h-4 text-red-600" />
          <span>Stop</span>
        </button>
      </div>
    </>
  );
}
