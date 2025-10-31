import { useState, useEffect } from "react";
import { RefreshCw, Check, AlertCircle, Filter, Copy, ChevronDown, ChevronUp, Image } from "lucide-react";
import { useDefaultProfileStore } from "../../../store/default-profile.store";
import { useVEO3ModelsStore } from "../../../store/veo3-models.store";
import { useImageGalleryStore } from "../../../store/image-gallery.store";
import { PaygateTier } from "@/shared/types/veo3-models";

export default function FlowVeo3Settings() {
  const { flowProfileId } = useDefaultProfileStore();
  const {
    models,
    lastSyncedAt,
    isSyncing,
    setModels,
    setSyncing,
    setDefaultForRender,
    toggleUsage,
    getFilteredModels,
    maxEnabledModels,
    setMaxEnabledModels,
  } = useVEO3ModelsStore();

  // Image gallery store for max selected images config
  const { maxSelectedImages, setMaxSelectedImages } = useImageGalleryStore();

  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<PaygateTier>("PAYGATE_TIER_TWO");
  const [excludeDeprecated, setExcludeDeprecated] = useState(true);
  const [filterAspectRatio, setFilterAspectRatio] = useState<string>("");
  const [filterModelCategory, setFilterModelCategory] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortModelBy, setSortModelBy] = useState<"asc" | "desc">("asc");

  // Section visibility toggles
  const [showImageConfig, setShowImageConfig] = useState(true);
  const [showVideoModelConfig, setShowVideoModelConfig] = useState(true);

  // Local state for number inputs to allow typing
  const [maxImagesInput, setMaxImagesInput] = useState<string>(maxSelectedImages.toString());

  // Sync local input state when store value changes
  useEffect(() => {
    setMaxImagesInput(maxSelectedImages.toString());
  }, [maxSelectedImages]);

  // Extract unique model categories (e.g., "Veo 3.1", "Veo 2")
  const modelCategories = Array.from(
    new Set(
      models
        .map((m) => m.displayName)
        .map((name) => {
          // Extract category: "Veo 3.1 - Fast" -> "Veo 3.1"
          const match = name.match(/^(Veo\s+[\d.]+)/);
          return match ? match[1] : name;
        })
    )
  ).sort();

  // Apply all filters
  const filteredModels = getFilteredModels(filterTier, excludeDeprecated)
    .filter((model) => {
      // Filter by aspect ratio
      if (filterAspectRatio && !model.supportedAspectRatios.includes(filterAspectRatio as any)) {
        return false;
      }

      // Filter by model category
      if (filterModelCategory) {
        const match = model.displayName.match(/^(Veo\s+[\d.]+)/);
        const category = match ? match[1] : model.displayName;
        if (category !== filterModelCategory) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by display name
      const aName = a.displayName.toLowerCase();
      const bName = b.displayName.toLowerCase();
      return sortModelBy === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectAllVisible = () => {
    // Toggle: if all are selected, deselect all; otherwise select all
    const allSelected = filteredModels.every((m) => m.enabledForUsage);
    filteredModels.forEach((model) => {
      if (allSelected && model.enabledForUsage) {
        toggleUsage(model.key);
      } else if (!allSelected && !model.enabledForUsage) {
        toggleUsage(model.key);
      }
    });
  };

  const handleToggleSortOrder = () => {
    setSortModelBy(sortModelBy === "asc" ? "desc" : "asc");
  };

  const handleSync = async () => {
    if (!flowProfileId) {
      setError("No default Flow profile selected. Please select a default Flow profile in the Profiles page.");
      return;
    }

    setError(null);
    setSyncing(true);

    try {
      const result = await window.electronAPI.veo3.syncModels(flowProfileId);

      if (result.success && result.data) {
        setModels(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to sync models");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getAspectRatioIcon = (aspectRatio: string): JSX.Element => {
    if (aspectRatio === "VIDEO_ASPECT_RATIO_LANDSCAPE") {
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="8" y1="10" x2="8" y2="14" />
          <line x1="16" y1="10" x2="16" y2="14" />
        </svg>
      );
    }
    if (aspectRatio === "VIDEO_ASPECT_RATIO_PORTRAIT") {
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="9" y1="6" x2="9" y2="10" />
          <line x1="15" y1="6" x2="15" y2="10" />
        </svg>
      );
    }
    // Square
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    );
  };

  const getCapabilityBadge = (capability: string) => {
    const map: Record<string, string> = {
      VIDEO_MODEL_CAPABILITY_TEXT: "Txt",
      VIDEO_MODEL_CAPABILITY_AUDIO: "Aud",
      VIDEO_MODEL_CAPABILITY_START_IMAGE: "Img",
      VIDEO_MODEL_CAPABILITY_END_IMAGE: "End",
      VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE: "Img+",
    };
    return map[capability] || capability.replace("VIDEO_MODEL_CAPABILITY_", "");
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Flow VEO3 Settings</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">Manage VEO3 video generation models and configure defaults.</p>
      </div>

      {/* Sync Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Synchronization</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Last: {formatDate(lastSyncedAt)}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing || !flowProfileId}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!flowProfileId && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">No default Flow profile selected.</p>
          </div>
        )}
      </div>

      {/* Summary Stats - Moved up */}
      {models.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{models.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Active</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {models.filter((m) => m.modelStatus !== "MODEL_STATUS_DEPRECATED").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Enabled</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {models.filter((m) => m.enabledForUsage).length}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400"> / {maxEnabledModels}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Default</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {models
                .find((m) => m.isDefaultForRender)
                ?.displayName?.split(" ")
                .slice(0, 2)
                .join(" ") || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Image Configuration Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowImageConfig(!showImageConfig)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Image Selection Configuration</h3>
          </div>
          {showImageConfig ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Collapsible Content */}
        {showImageConfig && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            {/* Max Selected Images Setting */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Max Selected Images</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Limit the number of images that can be selected simultaneously in the Image Gallery (1-10). When you select a
                  new image beyond this limit, the oldest selected image will be automatically removed (FIFO).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxImagesInput}
                  onChange={(e) => {
                    setMaxImagesInput(e.target.value);
                  }}
                  onBlur={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setMaxSelectedImages(value);
                      setMaxImagesInput(value.toString());
                    } else {
                      // Reset to current valid value
                      setMaxImagesInput(maxSelectedImages.toString());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = parseInt(e.currentTarget.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= 10) {
                        setMaxSelectedImages(value);
                        setMaxImagesInput(value.toString());
                        e.currentTarget.blur();
                      }
                    }
                  }}
                  className="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center font-semibold"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">images</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Model Configuration Section - Wrapped with Collapsible */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setShowVideoModelConfig(!showVideoModelConfig)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Video Model Configuration</h3>
          </div>
          {showVideoModelConfig ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Collapsible Content */}
        {showVideoModelConfig && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
            {/* Max Enabled Models Setting */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Max Enabled Models</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Limit the number of models that can be enabled simultaneously (1-10). When you enable a new model beyond this
                  limit, the oldest enabled model will be automatically disabled (FIFO).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxEnabledModels}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setMaxEnabledModels(value);
                    }
                  }}
                  className="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center font-semibold"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">models</span>
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                <div className="flex items-center gap-3 flex-1 flex-wrap min-w-fit">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Tier:</label>
                    <select
                      value={filterTier}
                      onChange={(e) => setFilterTier(e.target.value as PaygateTier)}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All</option>
                      <option value="PAYGATE_TIER_ONE">T1</option>
                      <option value="PAYGATE_TIER_TWO">T2</option>
                      <option value="PAYGATE_TIER_THREE">T3</option>
                    </select>
                  </div>

                  {/* Model Category Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Model:</label>
                    <select
                      value={filterModelCategory}
                      onChange={(e) => setFilterModelCategory(e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All</option>
                      {modelCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aspect Ratio Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Aspect:</label>
                    <select
                      value={filterAspectRatio}
                      onChange={(e) => setFilterAspectRatio(e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All</option>
                      <option value="VIDEO_ASPECT_RATIO_LANDSCAPE">Landscape (16:9)</option>
                      <option value="VIDEO_ASPECT_RATIO_PORTRAIT">Portrait (9:16)</option>
                      <option value="VIDEO_ASPECT_RATIO_SQUARE">Square (1:1)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeDeprecated}
                      onChange={(e) => setExcludeDeprecated(e.target.checked)}
                      className="w-3 h-3 rounded border-gray-300 dark:border-gray-600"
                    />
                    Hide Deprecated
                  </label>
                </div>
              </div>
            </div>

            {/* Models Table - Compact */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-7">D</th>
                      <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-8">
                        <input
                          type="checkbox"
                          checked={filteredModels.length > 0 && filteredModels.every((m) => m.enabledForUsage)}
                          onChange={handleSelectAllVisible}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          title="Select/deselect all visible models"
                        />
                      </th>
                      <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-8">Dep</th>
                      <th
                        className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 flex-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={handleToggleSortOrder}
                        title={`Sort by name (${sortModelBy === "asc" ? "Z-A" : "A-Z"})`}
                      >
                        Model {sortModelBy === "asc" ? "↑" : "↓"}
                      </th>
                      <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-16">Aspect</th>
                      <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-20">Caps</th>
                      <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-10">Len</th>
                      <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-8">FPS</th>
                      <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-8">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredModels.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                          {models.length === 0 ? "Click 'Sync' to fetch models" : "No models match filters"}
                        </td>
                      </tr>
                    ) : (
                      filteredModels.map((model) => (
                        <tr key={model.key} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="px-2 py-1">
                            <button
                              onClick={() => setDefaultForRender(model.key)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                model.isDefaultForRender
                                  ? "bg-primary-600 border-primary-600 text-white"
                                  : "border-gray-300 dark:border-gray-600 hover:border-primary-600"
                              }`}
                              title="Set as default"
                            >
                              {model.isDefaultForRender && <Check className="w-2.5 h-2.5" />}
                            </button>
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="checkbox"
                              checked={model.enabledForUsage}
                              onChange={() => toggleUsage(model.key)}
                              className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                              title="Enable for usage"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-medium ${
                                model.modelStatus === "MODEL_STATUS_DEPRECATED"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              }`}
                            >
                              {model.modelStatus === "MODEL_STATUS_DEPRECATED" ? "D" : "A"}
                            </span>
                          </td>
                          <td className="px-2 py-1 font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center justify-between gap-1 group">
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm">{model.displayName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{model.key}</div>
                              </div>
                              <button
                                onClick={() => handleCopyKey(model.key)}
                                title="Copy model key"
                                className={`flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all ${
                                  copiedKey === model.key
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex gap-1">
                              {model.supportedAspectRatios.map((ar) => (
                                <div
                                  key={ar}
                                  className="text-gray-600 dark:text-gray-400"
                                  title={ar.replace("VIDEO_ASPECT_RATIO_", "")}
                                >
                                  {getAspectRatioIcon(ar)}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex flex-wrap gap-0.5">
                              {model.capabilities.slice(0, 2).map((cap) => (
                                <span
                                  key={cap}
                                  className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                                  title={cap}
                                >
                                  {getCapabilityBadge(cap)}
                                </span>
                              ))}
                              {model.capabilities.length > 2 && (
                                <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                                  +{model.capabilities.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-gray-700 dark:text-gray-300 text-center font-medium">
                            {model.videoLengthSeconds}s
                          </td>
                          <td className="px-2 py-1 text-gray-700 dark:text-gray-300 text-center font-medium">
                            {model.framesPerSecond}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {model.paygateTier.replace("PAYGATE_TIER_", "T")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OLD SECTIONS TO BE REMOVED - Keep the closing div tag */}
      {/* Max Enabled Models Setting */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
        style={{ display: "none" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Max Enabled Models</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Limit the number of models that can be enabled simultaneously (1-10). When you enable a new model beyond this limit,
              the oldest enabled model will be automatically disabled (FIFO).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="10"
              value={maxEnabledModels}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 10) {
                  setMaxEnabledModels(value);
                }
              }}
              className="w-16 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center font-semibold"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">models</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
        style={{ display: "none" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          <div className="flex items-center gap-3 flex-1 flex-wrap min-w-fit">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Tier:</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as PaygateTier)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                <option value="PAYGATE_TIER_ONE">T1</option>
                <option value="PAYGATE_TIER_TWO">T2</option>
                <option value="PAYGATE_TIER_THREE">T3</option>
              </select>
            </div>

            {/* Model Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Model:</label>
              <select
                value={filterModelCategory}
                onChange={(e) => setFilterModelCategory(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                {modelCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Aspect:</label>
              <select
                value={filterAspectRatio}
                onChange={(e) => setFilterAspectRatio(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                <option value="VIDEO_ASPECT_RATIO_LANDSCAPE">Landscape (16:9)</option>
                <option value="VIDEO_ASPECT_RATIO_PORTRAIT">Portrait (9:16)</option>
                <option value="VIDEO_ASPECT_RATIO_SQUARE">Square (1:1)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeDeprecated}
                onChange={(e) => setExcludeDeprecated(e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 dark:border-gray-600"
              />
              Hide Deprecated
            </label>
          </div>
        </div>
      </div>

      {/* Models Table - Compact */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ display: "none" }}
      >
        <div className="overflow-x-auto text-xs">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-7">D</th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-8">
                  <input
                    type="checkbox"
                    checked={filteredModels.length > 0 && filteredModels.every((m) => m.enabledForUsage)}
                    onChange={handleSelectAllVisible}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    title="Select/deselect all visible models"
                  />
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-8">Dep</th>
                <th
                  className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 flex-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleToggleSortOrder}
                  title={`Sort by name (${sortModelBy === "asc" ? "Z-A" : "A-Z"})`}
                >
                  Model {sortModelBy === "asc" ? "↑" : "↓"}
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-16">Aspect</th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 dark:text-gray-300 w-20">Caps</th>
                <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-10">Len</th>
                <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-8">FPS</th>
                <th className="px-2 py-1 text-center font-semibold text-gray-700 dark:text-gray-300 w-8">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                    {models.length === 0 ? "Click 'Sync' to fetch models" : "No models match filters"}
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => (
                  <tr key={model.key} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-2 py-1">
                      <button
                        onClick={() => setDefaultForRender(model.key)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          model.isDefaultForRender
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-primary-600"
                        }`}
                        title="Set as default"
                      >
                        {model.isDefaultForRender && <Check className="w-2.5 h-2.5" />}
                      </button>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={model.enabledForUsage}
                        onChange={() => toggleUsage(model.key)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        title="Enable for usage"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded font-medium ${
                          model.modelStatus === "MODEL_STATUS_DEPRECATED"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {model.modelStatus === "MODEL_STATUS_DEPRECATED" ? "D" : "A"}
                      </span>
                    </td>
                    <td className="px-2 py-1 font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center justify-between gap-1 group">
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm">{model.displayName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{model.key}</div>
                        </div>
                        <button
                          onClick={() => handleCopyKey(model.key)}
                          title="Copy model key"
                          className={`flex-shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all ${
                            copiedKey === model.key
                              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        {model.supportedAspectRatios.map((ar) => (
                          <div
                            key={ar}
                            className="text-blue-600 dark:text-blue-400 flex items-center justify-center w-5 h-5"
                            title={
                              ar === "VIDEO_ASPECT_RATIO_LANDSCAPE"
                                ? "Landscape (16:9)"
                                : ar === "VIDEO_ASPECT_RATIO_PORTRAIT"
                                ? "Portrait (9:16)"
                                : "Square (1:1)"
                            }
                          >
                            {getAspectRatioIcon(ar)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex flex-wrap gap-0.5">
                        {model.capabilities.slice(0, 2).map((cap) => (
                          <span
                            key={cap}
                            className="px-1 py-0 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded whitespace-nowrap"
                            title={getCapabilityBadge(cap)}
                          >
                            {getCapabilityBadge(cap)}
                          </span>
                        ))}
                        {model.capabilities.length > 2 && (
                          <span className="px-1 text-xs text-gray-600 dark:text-gray-400">+{model.capabilities.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300 text-center font-medium">
                      {model.videoLengthSeconds}s
                    </td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300 text-center font-medium">
                      {model.framesPerSecond}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {model.paygateTier.replace("PAYGATE_TIER_", "T")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
