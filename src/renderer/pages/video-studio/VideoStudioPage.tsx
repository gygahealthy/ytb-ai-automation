import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Settings2, Download, Share2, Clock } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useDrawer } from "@hooks/useDrawer";
import VideoPropertiesDrawer from "@/renderer/components/video-creation/single-video-page/video-studio/VideoPropertiesDrawer";
import SceneTimeline from "@/renderer/components/video-creation/single-video-page/video-studio/SceneTimeline";
import { useVideoCreationStore } from "@store/video-creation.store";

export default function VideoStudioPage() {
  const { projectId: _projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { openDrawer, closeDrawer } = useDrawer();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);

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
        duration: 6, // Default duration, can be extracted from video metadata
      };
    })
    .filter((scene) => scene !== null);

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
  }, [selectedSceneIndex, completedScenes]);

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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Video playback logic will be handled by video element
  };

  const handlePrevScene = () => {
    if (selectedSceneIndex > 0) {
      setSelectedSceneIndex(selectedSceneIndex - 1);
      setCurrentTime(0);
    }
  };

  const handleNextScene = () => {
    if (selectedSceneIndex < completedScenes.length - 1) {
      setSelectedSceneIndex(selectedSceneIndex + 1);
      setCurrentTime(0);
    }
  };

  const handleSceneSelect = (index: number) => {
    setSelectedSceneIndex(index);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };



  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Studio</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedScenes.length} scene{completedScenes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenProperties}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              title="Open Properties (Ctrl+P)"
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-sm font-medium">Properties</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/5 dark:bg-black/30">
          <div className="relative w-full max-w-5xl aspect-video bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex items-center justify-center">
            {currentScene ? (
              <>
                <video
                  key={currentScene.videoUrl}
                  src={currentScene.videoUrl}
                  className="w-full h-full object-contain"
                  controls={false}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  autoPlay={isPlaying}
                />
                {/* Overlay Info */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      Scene {selectedSceneIndex + 1} of {completedScenes.length}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Play className="w-20 h-20 mb-4" />
                <p className="text-lg font-medium">No preview available</p>
                <p className="text-sm">Add scenes to your timeline to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2.5">
          <div className="max-w-5xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono w-10">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono w-10">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrevScene}
                disabled={selectedSceneIndex === 0}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Scene"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-3 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={handleNextScene}
                disabled={selectedSceneIndex === completedScenes.length - 1}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Scene"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <SceneTimeline
            scenes={completedScenes}
            selectedIndex={selectedSceneIndex}
            onSceneSelect={handleSceneSelect}
          />
        </div>
      </div>
    </div>
  );
}
