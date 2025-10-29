import { ChevronDown, ChevronUp, User } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  isLoggedIn?: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  disabled?: boolean;
}

export default function ProfileCard({ profile, isExpanded, isSelected, onToggleExpand, disabled }: ProfileCardProps) {
  return (
    <button
      onClick={onToggleExpand}
      className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left font-medium flex items-center justify-between ${
        isExpanded
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
          : isSelected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500"
      }`}
      disabled={disabled}
    >
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 flex-shrink-0" />
        <span>{profile.name}</span>
        {profile.isLoggedIn && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
            Logged In
          </span>
        )}
      </div>
      {isExpanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}
