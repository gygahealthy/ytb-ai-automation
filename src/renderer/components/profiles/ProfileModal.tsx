import { Cookie, DollarSign, Folder, Globe, Plus, RefreshCw, Tag, User, X } from "lucide-react";
import { useEffect, useState } from "react";

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

interface ProfileModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  editingProfile: Profile | null;
  onClose: () => void;
  onSave: (data: ProfileFormData) => Promise<void>;
}

export interface ProfileFormData {
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent: string;
  creditRemaining: number;
  tags: string[];
  cookies?: string;
}

export default function ProfileModal({ isOpen, isEditMode, editingProfile, onClose, onSave }: ProfileModalProps) {
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
    cookies: "",
  });
  const [tagInput, setTagInput] = useState("");

  // Get default profile path and Chrome path on mount
  useEffect(() => {
    const getDefaults = async () => {
      try {
        const profilePath = (await window.electronAPI.dialog.getDefaultProfilePath()) as string;
        setDefaultProfilePath(profilePath);
        
        const chromePath = (await window.electronAPI.dialog.getDefaultChromePath()) as string;
        setDefaultChromePath(chromePath);
      } catch (error) {
        console.error("Failed to get default paths:", error);
      }
    };
    getDefaults();
  }, []);

  // Update form data when editingProfile changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingProfile) {
        setFormData({
          name: editingProfile.name,
          browserPath: editingProfile.browserPath || "",
          userDataDir: editingProfile.userDataDir,
          userAgent: editingProfile.userAgent || "",
          creditRemaining: editingProfile.creditRemaining,
          tags: editingProfile.tags || [],
          cookies: editingProfile.cookies || "",
        });
      } else {
        // Generate random user agent and set default Chrome path for new profiles
        const generateInitialData = async () => {
          try {
            const generatedUA = (await window.electronAPI.dialog.generateUserAgent()) as string;
            const chromePath = (await window.electronAPI.dialog.getDefaultChromePath()) as string;
            console.log("Auto-generated User Agent:", generatedUA);
            console.log("Default Chrome Path:", chromePath);
            setFormData({
              name: "",
              browserPath: chromePath,
              userDataDir: "",
              userAgent: generatedUA,
              creditRemaining: 0,
              tags: [],
              cookies: "",
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
              cookies: "",
            });
          }
        };
        generateInitialData();
      }
      setTagInput("");
    }
  }, [isOpen, editingProfile]);

  const generateRandomUserAgent = async () => {
    try {
      // Generate random user agent via IPC
      const generatedUA = (await window.electronAPI.dialog.generateUserAgent()) as string;
      console.log("Generated User Agent:", generatedUA);
      setFormData((prev) => ({ ...prev, userAgent: generatedUA }));
    } catch (error) {
      console.error("Failed to generate user agent:", error);
      // Fallback user agent
      const fallbackUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      setFormData((prev) => ({
        ...prev,
        userAgent: fallbackUA,
      }));
    }
  };

  const handleSelectFolder = async () => {
    try {
      console.log("Opening folder dialog...");
      // Use current path or default path as initial directory
      const initialPath = formData.userDataDir || defaultProfilePath;
      const result = (await window.electronAPI.dialog.selectFolder(initialPath)) as { filePaths: string[] };
      console.log("Dialog result:", result);
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
      console.log("Opening browser executable dialog...");
      const result = (await window.electronAPI.dialog.selectBrowserExecutable()) as { filePaths: string[] };
      console.log("Dialog result:", result);
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
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      browserPath: "",
      userDataDir: "",
      userAgent: "",
      creditRemaining: 0,
      tags: [],
      cookies: "",
    });
    setTagInput("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <User className="w-7 h-7" />
            {isEditMode ? "Edit Profile" : "Create New Profile"}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4 text-primary-500" />
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
                className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium whitespace-nowrap"
                title="Browse for browser executable"
              >
                <Globe className="w-4 h-4" />
                Browse
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Auto-detected: {defaultChromePath || "Not found - please select manually"}
            </p>
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
                className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium whitespace-nowrap"
                title="Browse folder"
              >
                <Folder className="w-4 h-4" />
                Browse
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Folder className="w-3 h-3" />
              Default: {defaultProfilePath || "Loading..."}
            </p>
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
                className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium whitespace-nowrap"
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
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Set the initial credit balance for this profile
            </p>
          </div>

          {/* Cookies Field */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Cookie className="w-4 h-4 text-orange-500" />
              Cookies (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.cookies}
              onChange={(e) => setFormData({ ...formData, cookies: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none font-mono text-xs"
              placeholder="name1=value1; name2=value2; name3=value3"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Cookie string in standard format. Usually auto-filled when logging in.
            </p>
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
                className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
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
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
      </div>
    </div>
  );
}
