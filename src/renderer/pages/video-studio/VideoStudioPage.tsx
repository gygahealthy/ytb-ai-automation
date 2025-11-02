import { useEffect, useState, useCallback } from "react";
import { Play, Settings2, Download } from "lucide-react";
import { useDrawer } from "@hooks/useDrawer";
import VideoPropertiesDrawer from "@/renderer/components/video-studio/VideoPropertiesDrawer";
import SceneTimeline from "@/renderer/components/video-studio/SceneTimeline";
import VideoSequencePlayer from "@/renderer/components/video-studio/VideoSequencePlayer";
import { useVideoCreationStore } from "@store/video-creation.store";

export default function VideoStudioPage() {
  const { openDrawer, closeDrawer } = useDrawer();

  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [playbackInfo, setPlaybackInfo] = useState({ currentVideoIndex: 0, currentTime: 0, duration: 0 });

  // Get prompts and jobs from the store (these represent our scenes)
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);

  // Filter to only completed videos
  const completedScenes = prompts
    .map((prompt) => {
      const job = jobs.find((j) => j.promptId === prompt.id && j.status === "completed");
      if (!job?.videoUrl) return null;
      return {
        id: prompt.id,
        text: prompt.text,
        order: prompt.order,
        videoUrl: job.videoUrl,
        thumbnail: job.videoUrl, // Can be replaced with actual thumbnail
        duration: 8, // Default duration - will be updated by player during playback
      };
    })
    .filter((scene) => scene !== null);

  // Get current scene for properties
  const currentScene = completedScenes[selectedSceneIndex];

  // Register keyboard shortcut handler for Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleOpenProperties();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSceneIndex, completedScenes, openDrawer, closeDrawer]);

  const handleOpenProperties = () => {
    openDrawer({
      title: "Scene Properties",
      icon: <Settings2 className="w-5 h-5" />,
      children: (
        <VideoPropertiesDrawer
          scene={currentScene}
          onClose={closeDrawer}
          onUpdate={(updates: any) => {
            console.log("Update scene:", updates);
            // Handle scene updates here
          }}
        />
      ),
      side: "right",
      width: "w-96",
      enablePin: true,
      drawerId: "video-properties",
    });
  };

  const handleSceneSelect = (index: number) => {
    setSelectedSceneIndex(index);
  };

  const handleCurrentVideoChange = useCallback((index: number, time: number, dur: number) => {
    setPlaybackInfo({ currentVideoIndex: index, currentTime: time, duration: dur });
  }, []);

  const handleSeek = useCallback((videoIndex: number, time: number) => {
    setPlaybackInfo((prev) => ({
      currentVideoIndex: videoIndex,
      currentTime: time,
      duration: prev.duration,
    }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Studio</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedScenes.length} scene{completedScenes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenProperties}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 hover:text-cyan-600 dark:text-gray-300 dark:hover:text-cyan-400 transition-colors border border-gray-200 dark:border-gray-700"
              title="Open Properties (Ctrl+P)"
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-sm font-medium">Properties</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white transition-colors font-medium">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Preview Area with Sequence Player */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-black/40 dark:via-gray-900/50 dark:to-black/40 overflow-hidden">
          {completedScenes.length > 0 ? (
            <div className="w-full max-w-5xl h-full">
              <VideoSequencePlayer
                playlist={{
                  videos: completedScenes.map((scene) => ({
                    id: scene.id,
                    url: scene.videoUrl,
                    title: scene.text.slice(0, 100),
                    duration: scene.duration,
                  })),
                }}
                onCurrentVideoChange={handleCurrentVideoChange}
                onSeek={handleSeek}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-500">
              <Play className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-lg font-semibold">No preview available</p>
              <p className="text-sm">Add scenes to your timeline to get started</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <SceneTimeline
            scenes={completedScenes}
            selectedIndex={selectedSceneIndex}
            onSceneSelect={handleSceneSelect}
            currentVideoIndex={playbackInfo.currentVideoIndex}
            currentTime={playbackInfo.currentTime}
            duration={playbackInfo.duration}
          />
        </div>
      </div>
    </div>
  );
}
