import { Plus } from "lucide-react";

interface AddCookieCardProps {
  profileId: string;
  onClick: (profileId: string) => void;
}

export default function AddCookieCard({ profileId, onClick }: AddCookieCardProps) {
  return (
    <button
      onClick={() => onClick(profileId)}
      className="bg-gray-50 dark:bg-gray-750 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex flex-col items-center justify-center h-full min-h-[300px] cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-600 transition-colors">
        <Plus className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Cookie</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to add new</span>
    </button>
  );
}
