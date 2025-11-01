import { Film, Clock, Plus } from "lucide-react";

export interface Scene {
  id: string;
  text: string;
  order: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

interface SceneCardProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  isCurrentlyPlaying?: boolean;
  onClick: () => void;
}

export function SceneCard({ scene, index, isSelected, isCurrentlyPlaying, onClick }: SceneCardProps) {
  return (
    <button
      onClick={onClick}
      title={scene.text || "Untitled Scene"}
      className={`
        relative flex-shrink-0 w-40 rounded-lg transition-all overflow-hidden group
        ${
          isSelected
            ? "shadow-xl shadow-cyan-400/50 dark:shadow-cyan-500/40 scale-105 ring-2 ring-cyan-300 dark:ring-cyan-500/50"
            : isCurrentlyPlaying
            ? "shadow-xl shadow-blue-400/50 dark:shadow-blue-500/40 ring-2 ring-blue-300 dark:ring-blue-500/50"
            : "hover:shadow-lg shadow-sm"
        }
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <video src={scene.videoUrl} className="w-full h-full object-cover" />

        {/* Overlay gradient */}
        <div
          className={`absolute inset-0 ${
            isCurrentlyPlaying
              ? "bg-gradient-to-t from-blue-900/40 to-transparent"
              : "bg-gradient-to-t from-black/60 to-transparent"
          }`}
        />

        {/* Scene number badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
          Scene {index + 1}
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs">
          <Clock className="w-3 h-3" />
          <span>{scene.duration}s</span>
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-400 animate-pulse">
              <div className="w-full h-full rounded-full bg-blue-500/20 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Selection ring with glow */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-cyan-400 dark:ring-cyan-500 pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-cyan-400/10 dark:bg-cyan-500/10 animate-pulse" />
        </div>
      )}
    </button>
  );
}

export function AddSceneCard() {
  return (
    <button
      className="relative flex-shrink-0 w-40 rounded-lg border-dashed transition-all overflow-hidden group bg-gray-100 dark:bg-gray-800/50 shadow-sm hover:shadow-md"
      title="Click to add scene"
    >
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-500 dark:text-gray-500">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors border border-gray-400 dark:border-gray-600 group-hover:border-cyan-400 dark:group-hover:border-cyan-500">
            <Plus className="w-5 h-5 group-hover:text-cyan-600 dark:group-hover:text-cyan-500 transition-colors" />
          </div>
          <span className="text-xs font-semibold">Add Scene</span>
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white text-xs">
          <Clock className="w-3 h-3" />
          <span>8s</span>
        </div>
      </div>
    </button>
  );
}
