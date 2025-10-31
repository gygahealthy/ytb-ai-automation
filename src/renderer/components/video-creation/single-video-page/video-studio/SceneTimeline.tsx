import { Film, Clock, CheckCircle2, Plus } from "lucide-react";

export interface Scene {
  id: string;
  text: string;
  order: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

interface SceneTimelineProps {
  scenes: Scene[];
  selectedIndex: number;
  onSceneSelect: (index: number) => void;
}

export default function SceneTimeline({ scenes, selectedIndex, onSceneSelect }: SceneTimelineProps) {
  return (
    <div className="px-4 py-2.5">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Scene Timeline
        </h3>
      </div>

      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          {scenes.length > 0 ? (
            scenes.map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                isSelected={index === selectedIndex}
                onClick={() => onSceneSelect(index)}
              />
            ))
          ) : (
            <AddSceneCard />
          )}
        </div>
      </div>
    </div>
  );
}

interface SceneCardProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function AddSceneCard() {
  return (
    <button
      className="relative flex-shrink-0 w-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-all overflow-hidden group bg-gray-50 dark:bg-gray-800/50"
    >
      {/* Thumbnail placeholder */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
            <Plus className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
          </div>
          <span className="text-xs font-medium">Add Scene</span>
        </div>

        {/* Duration badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white text-xs">
          <Clock className="w-3 h-3" />
          <span>8s</span>
        </div>
      </div>

      {/* Info section */}
      <div className="p-2 bg-white dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left">
          Click to add scene
        </p>
      </div>
    </button>
  );
}

function SceneCard({ scene, index, isSelected, onClick }: SceneCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-40 rounded-lg border-2 transition-all overflow-hidden group
        ${
          isSelected
            ? "border-primary-500 shadow-lg shadow-primary-500/20 scale-105"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
        }
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <video src={scene.videoUrl} className="w-full h-full object-cover" />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

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

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute bottom-2 right-2">
            <CheckCircle2 className="w-5 h-5 text-primary-400 fill-current" />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-2 bg-white dark:bg-gray-800">
        <p
          className={`text-xs font-medium line-clamp-2 text-left ${
            isSelected ? "text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"
          }`}
          title={scene.text}
        >
          {scene.text || "Untitled Scene"}
        </p>
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 pointer-events-none" />
      )}
    </button>
  );
}
