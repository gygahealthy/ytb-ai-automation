import { useState } from "react";
import { X, Video, FileText, Clock, Sliders, Palette, Volume2, Image as ImageIcon } from "lucide-react";

interface Scene {
  id: string;
  text: string;
  order: number;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

interface VideoPropertiesDrawerProps {
  scene: Scene | null;
  onClose: () => void;
  onUpdate: (updates: Partial<Scene>) => void;
}

export default function VideoPropertiesDrawer({ scene, onClose, onUpdate }: VideoPropertiesDrawerProps) {
  const [activeTab, setActiveTab] = useState<"info" | "effects" | "audio">("info");

  if (!scene) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No scene selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scene Properties</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="Close (or press Ctrl+P)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <FileText className="w-4 h-4 mx-auto mb-1" />
            Info
          </button>
          <button
            onClick={() => setActiveTab("effects")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "effects"
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Sliders className="w-4 h-4 mx-auto mb-1" />
            Effects
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "audio"
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Volume2 className="w-4 h-4 mx-auto mb-1" />
            Audio
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "info" && <InfoTab scene={scene} onUpdate={onUpdate} />}
        {activeTab === "effects" && <EffectsTab scene={scene} onUpdate={onUpdate} />}
        {activeTab === "audio" && <AudioTab scene={scene} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// Info Tab
function InfoTab({ scene, onUpdate }: { scene: Scene; onUpdate: (updates: Partial<Scene>) => void }) {
  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
        <video src={scene.videoUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <ImageIcon className="w-8 h-8 text-white/70" />
        </div>
      </div>

      {/* Scene Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scene Name</label>
        <input
          type="text"
          value={scene.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter scene name..."
        />
      </div>

      {/* Scene Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Scene Order</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">#{scene.order + 1}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{scene.duration}s</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Video URL
          </span>
          <a
            href={scene.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Open
          </a>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <textarea
          value={scene.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Scene description..."
        />
      </div>
    </div>
  );
}

// Effects Tab
function EffectsTab({ scene: _scene, onUpdate: _onUpdate }: { scene: Scene; onUpdate: (updates: Partial<Scene>) => void }) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Brightness
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{brightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Contrast
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{contrast}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Saturation
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{saturation}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={saturation}
          onChange={(e) => setSaturation(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Filter Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {["None", "Vintage", "Black & White", "Sepia", "Warm", "Cool"].map((filter) => (
            <button
              key={filter}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
        Apply Effects
      </button>
    </div>
  );
}

// Audio Tab
function AudioTab({ scene: _scene, onUpdate: _onUpdate }: { scene: Scene; onUpdate: (updates: Partial<Scene>) => void }) {
  const [volume, setVolume] = useState(100);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Volume
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fade In</label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{fadeIn}s</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={fadeIn}
          onChange={(e) => setFadeIn(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fade Out</label>
          <span className="text-sm text-gray-600 dark:text-gray-400">{fadeOut}s</span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={fadeOut}
          onChange={(e) => setFadeOut(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Background Music */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Background Music</label>
        <div className="space-y-2">
          <button className="w-full px-4 py-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            + Add Background Music
          </button>
        </div>
      </div>

      <button className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors">
        Apply Audio Settings
      </button>
    </div>
  );
}
