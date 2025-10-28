import { FolderOpen, FileText, Folder, Info, Eye, EyeOff, X, Settings } from "lucide-react";
import { useFilePathsStore } from "../../../store/file-paths.store";
import { useSettingsStore } from "../../../store/settings.store";
import electronApi from "../../../ipc";
import ToggleSwitch from "../ToggleSwitch";

export default function FilePathsSettings() {
  const {
    channelProjectsPath,
    singleVideoPath,
    fileNaming,
    folderNaming,
    options,
    setChannelProjectsPath,
    setSingleVideoPath,
    setFileNamingConvention,
    setFolderNamingConvention,
    setFilePathsOption,
    resetToDefaults,
  } = useFilePathsStore();
  const { tempVideoPath, setTempVideoPath } = useFilePathsStore();
  const { visibleSections = {}, setVisibleSection } = useSettingsStore();

  const handleBrowseFolder = async (type: "channelProjects" | "singleVideo" | "tempVideo") => {
    try {
      // Request folder selection from main process; prefer directory picker options
      const result = await electronApi.invoke("dialog:showOpenDialog", {
        properties: ["openDirectory", "createDirectory"],
        title: "Select Folder",
      });

      // Normalize possible wrapper shapes (e.g. { success, data })
      const dialogResult = result && typeof result === "object" && "success" in result ? (result as any).data : result;

      if (dialogResult && !dialogResult.canceled) {
        const selectedPath =
          Array.isArray(dialogResult.filePaths) && dialogResult.filePaths.length > 0
            ? dialogResult.filePaths[0]
            : dialogResult.filePath || dialogResult.file || undefined;

        if (selectedPath) {
          if (type === "channelProjects") setChannelProjectsPath(selectedPath);
          else if (type === "singleVideo") setSingleVideoPath(selectedPath);
          else setTempVideoPath(selectedPath);
        }
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
    }
  };

  const fileTypes = [
    {
      key: "video" as const,
      label: "Video Files",
      extension: ".mp4",
      icon: "🎥",
    },
    {
      key: "audio" as const,
      label: "Audio Files",
      extension: ".mp3",
      icon: "🎵",
    },
    {
      key: "image" as const,
      label: "Image Files",
      extension: ".png",
      icon: "🖼️",
    },
    {
      key: "json" as const,
      label: "JSON Files",
      extension: ".json",
      icon: "📋",
    },
    {
      key: "text" as const,
      label: "Text Files",
      extension: ".txt",
      icon: "📄",
    },
  ];

  const folderTypes = [
    {
      key: "project" as const,
      label: "Project Folder",
      description: "Main project directory name",
    },
    {
      key: "assets" as const,
      label: "Assets Folder",
      description: "Subfolder for media assets",
    },
    {
      key: "output" as const,
      label: "Output Folder",
      description: "Subfolder for rendered videos",
    },
    {
      key: "temp" as const,
      label: "Temp Folder",
      description: "Subfolder for temporary files",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">File Paths & Naming</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure default locations and naming conventions for your projects and media files.
        </p>
      </div>

      {/* Default Locations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Default Locations
          </h4>
          <button
            onClick={() =>
              setVisibleSection &&
              setVisibleSection("filePaths.defaultLocations", !(visibleSections as any)["filePaths.defaultLocations"])
            }
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle Default Locations"
          >
            {(visibleSections as any)["filePaths.defaultLocations"] ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>

        {(visibleSections as any)["filePaths.defaultLocations"] !== false && (
          <>
            {/* Channel Projects Path */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 items-center gap-3">
                <div className="col-span-1 text-sm font-medium text-gray-700 dark:text-gray-300">All Video Channel Projects</div>
                <div className="col-span-2 flex gap-2 items-center">
                  <input
                    type="text"
                    value={channelProjectsPath}
                    onChange={(e) => setChannelProjectsPath(e.target.value)}
                    placeholder="e.g., C:\Projects\Channels"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <button
                    onClick={() => handleBrowseFolder("channelProjects")}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Browse folder"
                    aria-label="Browse channel projects folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChannelProjectsPath("")}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Clear"
                    aria-label="Clear channel projects path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Single Video Path */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 items-center gap-3">
                <div className="col-span-1 text-sm font-medium text-gray-700 dark:text-gray-300">Single Video Creations Path</div>
                <div className="col-span-2 flex gap-2 items-center">
                  <input
                    type="text"
                    value={singleVideoPath}
                    onChange={(e) => setSingleVideoPath(e.target.value)}
                    placeholder="e.g., C:\Projects\SingleVideos"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <button
                    onClick={() => handleBrowseFolder("singleVideo")}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Browse folder"
                    aria-label="Browse single video folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSingleVideoPath("")}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Clear"
                    aria-label="Clear single video path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Temp Video Creation Path */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 items-center gap-3">
                <div className="col-span-1 text-sm font-medium text-gray-700 dark:text-gray-300">Temp Video Creation Folder</div>
                <div className="col-span-2 flex gap-2 items-center">
                  <input
                    type="text"
                    value={tempVideoPath}
                    onChange={(e) => setTempVideoPath(e.target.value)}
                    placeholder="e.g., C:\Projects\TempVideos"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <button
                    onClick={() => handleBrowseFolder("tempVideo")}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Browse folder"
                    aria-label="Browse temp video folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTempVideoPath("")}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
                    title="Clear"
                    aria-label="Clear temp video path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* File Paths Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4" />
            File Creation Options
          </h4>
          <button
            onClick={() =>
              setVisibleSection && setVisibleSection("filePaths.options", !(visibleSections as any)["filePaths.options"])
            }
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle File Creation Options"
          >
            {(visibleSections as any)["filePaths.options"] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {(visibleSections as any)["filePaths.options"] !== false && (
          <div className="space-y-4">
            {/* Auto Create Date Folder */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Create YYYY-MM-DD</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Create dated folders</div>
              </div>
              <ToggleSwitch
                checked={options.autoCreateDateFolder}
                onChange={(checked: boolean) => setFilePathsOption("autoCreateDateFolder", checked)}
                size="md"
                color="primary"
              />
            </div>

            {/* Auto Index Filename */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Index Filename</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Auto-increment names</div>
              </div>
              <ToggleSwitch
                checked={options.autoIndexFilename}
                onChange={(checked: boolean) => setFilePathsOption("autoIndexFilename", checked)}
                size="md"
                color="primary"
              />
            </div>

            {/* Add Epoch Time to Filename */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Epoch to Filename</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Append epoch ms</div>
              </div>
              <ToggleSwitch
                checked={options.addEpochTimeToFilename}
                onChange={(checked: boolean) => setFilePathsOption("addEpochTimeToFilename", checked)}
                size="md"
                color="primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* File Naming Conventions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4" />
            File Naming Conventions
          </h4>
          <button
            onClick={() =>
              setVisibleSection && setVisibleSection("filePaths.fileNaming", !(visibleSections as any)["filePaths.fileNaming"])
            }
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle File Naming Conventions"
          >
            {(visibleSections as any)["filePaths.fileNaming"] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {(visibleSections as any)["filePaths.fileNaming"] !== false && (
          <div className="space-y-3">
            {fileTypes.map((fileType) => (
              <div key={fileType.key} className="grid grid-cols-3 items-center gap-3">
                <div className="col-span-1 flex items-center gap-2">
                  <span className="text-2xl w-8 flex-shrink-0">{fileType.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileType.label}</span>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={fileNaming[fileType.key]}
                    onChange={(e) => setFileNamingConvention(fileType.key, e.target.value)}
                    placeholder={`e.g., {name}_{timestamp}${fileType.extension}`}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folder Naming Conventions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Folder Naming Conventions
          </h4>
          <button
            onClick={() =>
              setVisibleSection &&
              setVisibleSection("filePaths.folderNaming", !(visibleSections as any)["filePaths.folderNaming"])
            }
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle Folder Naming Conventions"
          >
            {(visibleSections as any)["filePaths.folderNaming"] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {(visibleSections as any)["filePaths.folderNaming"] !== false && (
          <div className="space-y-3">
            {folderTypes.map((folderType) => (
              <div key={folderType.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{folderType.label}</label>
                <input
                  type="text"
                  value={folderNaming[folderType.key]}
                  onChange={(e) => setFolderNamingConvention(folderType.key, e.target.value)}
                  placeholder={folderType.key === "project" ? "{channel_name}_{date}" : folderType.label.toLowerCase()}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{folderType.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable Reference */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-2">Available Variables:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-800 dark:text-blue-200 font-mono text-xs">
              <div>
                <code>{"{name}"}</code> - File/project name
              </div>
              <div>
                <code>{"{timestamp}"}</code> - Unix timestamp
              </div>
              <div>
                <code>{"{date}"}</code> - Date (YYYY-MM-DD)
              </div>
              <div>
                <code>{"{time}"}</code> - Time (HH-MM-SS)
              </div>
              <div>
                <code>{"{channel_name}"}</code> - Channel name
              </div>
              <div>
                <code>{"{video_id}"}</code> - Video ID
              </div>
              <div>
                <code>{"{resolution}"}</code> - Video resolution
              </div>
              <div>
                <code>{"{duration}"}</code> - Video duration
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
