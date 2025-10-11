import { FolderOpen, FileText, Folder, Info, Eye, EyeOff, X, Briefcase, Video, Clock } from "lucide-react";
import { useFilePathsStore } from "../../store/file-paths.store";
import { useSettingsStore } from "../../store/settings.store";
import electronApi from "../../ipc";

export default function FilePathsSettings() {
  const {
    channelProjectsPath,
    singleVideoPath,
    fileNaming,
    folderNaming,
    setChannelProjectsPath,
    setSingleVideoPath,
    setFileNamingConvention,
    setFolderNamingConvention,
    resetToDefaults,
  } = useFilePathsStore();
  const { tempVideoPath, setTempVideoPath } = useFilePathsStore();
  const { visibleSections = {}, setVisibleSection } = useSettingsStore();

  const handleBrowseFolder = async (type: 'channelProjects' | 'singleVideo' | 'tempVideo') => {
    try {
      // Request folder selection from main process; prefer directory picker options
      const result = await electronApi.invoke('dialog:showOpenDialog', {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Folder',
      });

      // Normalize possible wrapper shapes (e.g. { success, data })
      const dialogResult = result && typeof result === 'object' && 'success' in result ? (result as any).data : result;

      if (dialogResult && !dialogResult.canceled) {
        const selectedPath = Array.isArray(dialogResult.filePaths) && dialogResult.filePaths.length > 0
          ? dialogResult.filePaths[0]
          : (dialogResult.filePath || dialogResult.file || undefined);

        if (selectedPath) {
          if (type === 'channelProjects') setChannelProjectsPath(selectedPath);
          else if (type === 'singleVideo') setSingleVideoPath(selectedPath);
          else setTempVideoPath(selectedPath);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const fileTypes = [
    { key: 'video' as const, label: 'Video Files', extension: '.mp4', icon: '🎥' },
    { key: 'audio' as const, label: 'Audio Files', extension: '.mp3', icon: '🎵' },
    { key: 'image' as const, label: 'Image Files', extension: '.png', icon: '🖼️' },
    { key: 'json' as const, label: 'JSON Files', extension: '.json', icon: '📋' },
    { key: 'text' as const, label: 'Text Files', extension: '.txt', icon: '📄' },
  ];

  const folderTypes = [
    { key: 'project' as const, label: 'Project Folder', description: 'Main project directory name' },
    { key: 'assets' as const, label: 'Assets Folder', description: 'Subfolder for media assets' },
    { key: 'output' as const, label: 'Output Folder', description: 'Subfolder for rendered videos' },
    { key: 'temp' as const, label: 'Temp Folder', description: 'Subfolder for temporary files' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          File Paths & Naming
        </h3>
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
            onClick={() => setVisibleSection && setVisibleSection('filePaths.defaultLocations', !(visibleSections as any)['filePaths.defaultLocations'])}
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle Default Locations"
          >
            {(visibleSections as any)['filePaths.defaultLocations'] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        { (visibleSections as any)['filePaths.defaultLocations'] !== false && (
          <>
            {/* Channel Projects Path */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                All Video Channel Projects
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-300">
                  <Briefcase className="w-5 h-5" aria-hidden />
                </div>
                <input
                  type="text"
                  value={channelProjectsPath}
                  onChange={(e) => setChannelProjectsPath(e.target.value)}
                  placeholder="e.g., C:\Projects\Channels"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBrowseFolder('channelProjects')}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors"
                    title="Browse folder"
                    aria-label="Browse channel projects folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChannelProjectsPath('')}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors"
                    title="Clear"
                    aria-label="Clear channel projects path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Root directory where all channel project folders will be created
              </p>
            </div>

            {/* Single Video Path */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Single Video Creation (Out of Project)
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-300">
                  <Video className="w-5 h-5" aria-hidden />
                </div>
                <input
                  type="text"
                  value={singleVideoPath}
                  onChange={(e) => setSingleVideoPath(e.target.value)}
                  placeholder="e.g., C:\Projects\SingleVideos"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBrowseFolder('singleVideo')}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors"
                    title="Browse folder"
                    aria-label="Browse single video folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSingleVideoPath('')}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors"
                    title="Clear"
                    aria-label="Clear single video path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Default location for standalone video projects not tied to a channel
              </p>
            </div>

            {/* Temp Video Creation Path */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temp Video Creation Folder
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-300">
                  <Clock className="w-5 h-5" aria-hidden />
                </div>
                <input
                  type="text"
                  value={tempVideoPath}
                  onChange={(e) => setTempVideoPath(e.target.value)}
                  placeholder="e.g., C:\Projects\TempVideos"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBrowseFolder('tempVideo')}
                    className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors"
                    title="Browse folder"
                    aria-label="Browse temp video folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTempVideoPath('')}
                    className="w-9 h-9 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors"
                    title="Clear"
                    aria-label="Clear temp video path"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Temporary folder used during single video creation and intermediate renders
              </p>
            </div>
          </>
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
            onClick={() => setVisibleSection && setVisibleSection('filePaths.fileNaming', !(visibleSections as any)['filePaths.fileNaming'])}
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle File Naming Conventions"
          >
            {(visibleSections as any)['filePaths.fileNaming'] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        { (visibleSections as any)['filePaths.fileNaming'] !== false && (
          <div className="grid grid-cols-1 gap-3">
            {fileTypes.map((fileType) => (
              <div key={fileType.key} className="flex items-center gap-3">
                <span className="text-2xl w-8 flex-shrink-0">{fileType.icon}</span>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fileType.label}
                  </label>
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
            onClick={() => setVisibleSection && setVisibleSection('filePaths.folderNaming', !(visibleSections as any)['filePaths.folderNaming'])}
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Toggle Folder Naming Conventions"
          >
            {(visibleSections as any)['filePaths.folderNaming'] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        { (visibleSections as any)['filePaths.folderNaming'] !== false && (
          <div className="space-y-3">
            {folderTypes.map((folderType) => (
              <div key={folderType.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {folderType.label}
                </label>
                <input
                  type="text"
                  value={folderNaming[folderType.key]}
                  onChange={(e) => setFolderNamingConvention(folderType.key, e.target.value)}
                  placeholder={folderType.key === 'project' ? '{channel_name}_{date}' : folderType.label.toLowerCase()}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {folderType.description}
                </p>
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
              <div><code>{'{name}'}</code> - File/project name</div>
              <div><code>{'{timestamp}'}</code> - Unix timestamp</div>
              <div><code>{'{date}'}</code> - Date (YYYY-MM-DD)</div>
              <div><code>{'{time}'}</code> - Time (HH-MM-SS)</div>
              <div><code>{'{channel_name}'}</code> - Channel name</div>
              <div><code>{'{video_id}'}</code> - Video ID</div>
              <div><code>{'{resolution}'}</code> - Video resolution</div>
              <div><code>{'{duration}'}</code> - Video duration</div>
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
