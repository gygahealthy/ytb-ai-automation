import { DollarSign, Folder, Globe, Plus, RefreshCw, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore, BrowserPath } from "@store/settings.store";

interface Profile {
  id: string;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  creditRemaining: number;
  tags?: string[];
  cookies?: string;
  cookieExpires?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileFormData {
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent: string;
  creditRemaining: number;
  tags: string[];
}

interface ProfileFormProps {
  isEditMode: boolean;
  editingProfile: Profile | null;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileForm({ isEditMode, editingProfile, onSave, onCancel }: ProfileFormProps) {
  // Helper to unwrap IPC responses which might be { success, data } or plain string
  const unwrap = (val: any): string => {
    if (!val && val !== 0) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if ("data" in val) return typeof val.data === "string" ? val.data : String(val.data ?? "");
      if ("filePaths" in val && Array.isArray(val.filePaths)) return val.filePaths[0] ?? "";
    }
    return String(val);
  };

  // Get browser paths from settings store
  const browserPaths = useSettingsStore((s) => s.browserPaths) as BrowserPath[];

  const [loading, setLoading] = useState(false);
  const [defaultProfilePath, setDefaultProfilePath] = useState("");
  const [defaultChromePath, setDefaultChromePath] = useState("");
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    browserPath: "",
    userDataDir: "",
    userAgent: "",
    creditRemaining: 0,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  // Get default profile path and Chrome path on mount
  useEffect(() => {
    const getDefaults = async () => {
      try {
        const profilePath = await window.electronAPI.dialog.getDefaultProfilePath();
        setDefaultProfilePath(unwrap(profilePath));

        const chromePath = await window.electronAPI.dialog.getDefaultChromePath();
        setDefaultChromePath(unwrap(chromePath));
      } catch (error) {
        console.error("Failed to get default paths:", error);
      }
    };
    getDefaults();
  }, []);

  // Update form data when editingProfile changes
  useEffect(() => {
    if (editingProfile) {
      setFormData({
        name: editingProfile.name,
        browserPath: editingProfile.browserPath || "",
        userDataDir: editingProfile.userDataDir,
        userAgent: editingProfile.userAgent || "",
        creditRemaining: editingProfile.creditRemaining,
        tags: editingProfile.tags || [],
      });
    } else {
      // Generate random user agent and set default Chrome path for new profiles
      const generateInitialData = async () => {
        try {
          const generatedUA = await window.electronAPI.dialog.generateUserAgent();
          const chromePath = await window.electronAPI.dialog.getDefaultChromePath();
          const ua = unwrap(generatedUA);
          const chrome = unwrap(chromePath);
          setFormData({
            name: "",
            browserPath: chrome,
            userDataDir: "",
            userAgent: ua,
            creditRemaining: 0,
            tags: [],
          });
        } catch (error) {
          console.error("Failed to generate initial data:", error);
          setFormData({
            name: "",
            browserPath: "",
            userDataDir: "",
            userAgent: "",
            creditRemaining: 0,
            tags: [],
          });
        }
      };
      generateInitialData();
    }
    setTagInput("");
  }, [editingProfile]);

  const generateRandomUserAgent = async () => {
    try {
      const generatedUA = (await window.electronAPI.dialog.generateUserAgent()) as string;
      setFormData((prev) => ({ ...prev, userAgent: generatedUA }));
    } catch (error) {
      console.error("Failed to generate user agent:", error);
      const fallbackUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      setFormData((prev) => ({ ...prev, userAgent: fallbackUA }));
    }
  };

  const handleSelectFolder = async () => {
    try {
      const initialPath = formData.userDataDir || defaultProfilePath;
      const result = (await window.electronAPI.dialog.selectFolder(initialPath)) as { filePaths: string[] };
      if (result && result.filePaths && result.filePaths.length > 0) {
        setFormData((prev) => ({ ...prev, userDataDir: result.filePaths[0] }));
      }
    } catch (error) {
      console.error("Failed to select folder:", error);
      alert("Failed to open folder dialog. Please check console for details.");
    }
  };

  const handleSelectBrowser = async () => {
    try {
      const result = (await window.electronAPI.dialog.selectBrowserExecutable()) as { filePaths: string[] };
      if (result && result.filePaths && result.filePaths.length > 0) {
        setFormData((prev) => ({ ...prev, browserPath: result.filePaths[0] }));
      }
    } catch (error) {
      console.error("Failed to select browser:", error);
      alert("Failed to open browser selection dialog. Please check console for details.");
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Tag className="w-4 h-4 text-primary-500" />
          Profile Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder="My Profile"
          required
        />
      </div>

      {/* Browser Path Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Globe className="w-4 h-4 text-primary-500" />
          Browser Executable Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.browserPath}
            onChange={(e) => setFormData({ ...formData, browserPath: e.target.value })}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
            placeholder={defaultChromePath || "Chrome executable path"}
          />
          <button
            type="button"
            onClick={handleSelectBrowser}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap"
            title="Browse for browser executable"
          >
            <Globe className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Auto-detected: {defaultChromePath || "Not found - please select manually"}
        </p>

        {/* Small selectable browser tags (from settings store) */}
        {browserPaths && browserPaths.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {browserPaths.map((bp) => {
              const isSelected = bp.path === formData.browserPath;
              return (
                <button
                  type="button"
                  key={bp.id}
                  onClick={() => setFormData((prev) => ({ ...prev, browserPath: bp.path }))}
                  title={bp.path}
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border transition-colors ${
                    isSelected
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span className="max-w-[12rem] truncate">{bp.name || bp.path}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Path Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Folder className="w-4 h-4 text-primary-500" />
          Profile Data Path
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.userDataDir}
            onChange={(e) => setFormData({ ...formData, userDataDir: e.target.value })}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
            placeholder={defaultProfilePath || "Leave empty for default app folder"}
          />
          <button
            type="button"
            onClick={handleSelectFolder}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap"
            title="Browse folder"
          >
            <Folder className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Default: {defaultProfilePath || "Loading..."}</p>
      </div>

      {/* User Agent Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <RefreshCw className="w-4 h-4 text-primary-500" />
          User Agent
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            rows={2}
            value={formData.userAgent}
            onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none font-mono text-xs"
            placeholder="Leave empty for default browser user agent"
          />
          <button
            type="button"
            onClick={generateRandomUserAgent}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium whitespace-nowrap"
            title="Generate random user agent"
          >
            <RefreshCw className="w-4 h-4" />
            Random
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Random user agent auto-generated for new profiles. Click "Random" to regenerate.
        </p>
      </div>

      {/* Credit Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <DollarSign className="w-4 h-4 text-green-500" />
          Credit Remaining
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.creditRemaining}
          onChange={(e) => setFormData({ ...formData, creditRemaining: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder="0.00"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Set the initial credit balance for this profile</p>
      </div>

      {/* Tags Field */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Tag className="w-4 h-4 text-purple-500" />
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            placeholder="Enter a tag and press Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {/* Display Tags */}
        {formData.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : isEditMode ? (
            "Update Profile"
          ) : (
            "Create Profile"
          )}
        </button>
      </div>
    </form>
  );
}
