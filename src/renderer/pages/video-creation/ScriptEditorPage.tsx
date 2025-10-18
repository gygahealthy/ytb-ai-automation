import React, { useState } from "react";
import {
  Edit3,
  Video,
  RefreshCw,
  Play,
  Download,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Scene {
  id: string;
  text: string;
  backgroundType: "image" | "video";
  backgroundUrl: string;
  textOverlay: string;
  transition: "fade" | "slide" | "zoom" | "none";
}

export type AspectRatio = "16:9" | "9:16" | "1:1";
export type VideoQuality = "720p" | "1080p" | "4k";

interface ScriptEditorPageProps {
  initialScript?: string;  
  initialScenes?: Scene[];
}

const ScriptEditorPage: React.FC<ScriptEditorPageProps> = ({
  // initialScript = "", // TODO: Will be used for initial state
  initialScenes = [],
}) => {
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    initialScenes[0]?.id || null
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("1080p");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSceneTextChange = (sceneId: string, newText: string) => {
    setScenes(
      scenes.map((s) => (s.id === sceneId ? { ...s, text: newText } : s))
    );
  };

  const handleSceneOverlayChange = (sceneId: string, newOverlay: string) => {
    setScenes(
      scenes.map((s) =>
        s.id === sceneId ? { ...s, textOverlay: newOverlay } : s
      )
    );
  };

  const handleChangeBackground = (_sceneId: string) => {
    // TODO: Implement background change functionality
    alert("Background change will be implemented with media library");
  };

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    // TODO: Implement video generation via IPC
    setTimeout(() => {
      setIsGenerating(false);
      alert("Video generation started! You'll be notified when it's ready.");
    }, 1000);
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <Edit3 className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Script & Scene Editor
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Editor Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Script Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Script Editor
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedSceneId === scene.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <textarea
                        value={scene.text}
                        onChange={(e) =>
                          handleSceneTextChange(scene.id, e.target.value)
                        }
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Scene Visualizer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Scene Preview
              </h2>

              {selectedSceneId && (
                <div className="space-y-4">
                  {scenes
                    .filter((s) => s.id === selectedSceneId)
                    .map((scene) => (
                      <div key={scene.id}>
                        {/* Background Preview */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                          <img
                            src={scene.backgroundUrl}
                            alt="Scene background"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/60 text-white px-6 py-3 rounded-lg text-xl font-bold">
                              {scene.textOverlay}
                            </div>
                          </div>
                        </div>

                        {/* Background Controls */}
                        <div className="space-y-3">
                          <button
                            onClick={() => handleChangeBackground(scene.id)}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Change Background
                          </button>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Text Overlay
                            </label>
                            <input
                              type="text"
                              value={scene.textOverlay}
                              onChange={(e) =>
                                handleSceneOverlayChange(
                                  scene.id,
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Transition Effect
                            </label>
                            <select
                              value={scene.transition}
                              onChange={(e) =>
                                setScenes(
                                  scenes.map((s) =>
                                    s.id === scene.id
                                      ? {
                                          ...s,
                                          transition: e.target.value as any,
                                        }
                                      : s
                                  )
                                )
                              }
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                              <option value="fade">Fade</option>
                              <option value="slide">Slide</option>
                              <option value="zoom">Zoom</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {!selectedSceneId && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a scene from the left to preview and edit</p>
                </div>
              )}
            </div>
          </div>

          {/* Export Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Settings
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Quality
                </label>
                <div className="flex gap-2">
                  {(["720p", "1080p", "4k"] as VideoQuality[]).map(
                    (quality) => (
                      <button
                        key={quality}
                        onClick={() => setVideoQuality(quality)}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                          videoQuality === quality
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {quality}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {(["16:9", "9:16", "1:1"] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                        aspectRatio === ratio
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Final Actions */}
          <div className="flex justify-end items-center gap-3">
            <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg flex items-center gap-2 transition-colors">
              <Play className="w-5 h-5" />
              Preview Video
            </button>

            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg flex items-center gap-2 text-lg font-semibold transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? "Generating Video..." : "Generate Video!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditorPage;
