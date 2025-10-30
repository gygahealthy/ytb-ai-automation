import { ChevronDown, ChevronUp, User, Sparkles, Zap } from "lucide-react";
import ToggleSwitch from "@components/common/ToggleSwitch";
import { useDefaultProfileStore } from "@store/default-profile.store";

interface Profile {
  id: string;
  name: string;
}

interface ProfileCardProps {
  profile: Profile;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  disabled?: boolean;
}

export default function ProfileCard({ profile, isExpanded, isSelected, onToggleExpand, disabled }: ProfileCardProps) {
  const geminiProfileId = useDefaultProfileStore((s) => s.geminiProfileId);
  const flowProfileId = useDefaultProfileStore((s) => s.flowProfileId);
  const setGeminiProfile = useDefaultProfileStore((s) => s.setGeminiProfile);
  const setFlowProfile = useDefaultProfileStore((s) => s.setFlowProfile);

  return (
    <div
      className={`w-full rounded-xl border-2 transition-all overflow-hidden ${
        isExpanded
          ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10"
          : isSelected
          ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
      }`}
    >
      {/* Main Profile Button */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 text-left font-medium flex items-center justify-between transition-all"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              isExpanded
                ? "bg-primary-500 text-white shadow-lg"
                : isSelected
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-sm font-semibold block ${
                isExpanded
                  ? "text-primary-700 dark:text-primary-300"
                  : isSelected
                  ? "text-green-700 dark:text-green-300"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {profile.name}
            </span>
            {(geminiProfileId === profile.id || flowProfileId === profile.id) && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                {geminiProfileId === profile.id && flowProfileId === profile.id ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Default for both
                  </>
                ) : geminiProfileId === profile.id ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Default Gemini
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Default Flow
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
        ) : (
          <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-400" />
        )}
      </button>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-primary-200 dark:border-primary-800/50 space-y-3">
          {/* Default Gemini Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Gemini</span>
            </div>
            <ToggleSwitch
              checked={geminiProfileId === profile.id}
              onChange={(checked) => setGeminiProfile(checked ? profile.id : null)}
              size="sm"
              color="purple"
              ariaLabel="Set as default Gemini profile"
            />
          </div>

          {/* Default Flow Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Flow</span>
            </div>
            <ToggleSwitch
              checked={flowProfileId === profile.id}
              onChange={(checked) => setFlowProfile(checked ? profile.id : null)}
              size="sm"
              color="blue"
              ariaLabel="Set as default Flow profile"
            />
          </div>
        </div>
      )}
    </div>
  );
}
