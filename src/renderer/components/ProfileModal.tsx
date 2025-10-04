import { DollarSign, Folder, Globe, Plus, RefreshCw, Tag, User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Profile {
  id: string;
  name: string;
  browserPath?: string;
  userDataDir: string;
  userAgent?: string;
  creditRemaining: number;
  tags?: string[];
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
  userDataDir: string;
  userAgent: string;
  creditRemaining: number;
  tags: string[];
}

export default function ProfileModal({ isOpen, isEditMode, editingProfile, onClose, onSave }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [defaultProfilePath, setDefaultProfilePath] = useState("");
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    userDataDir: "",
    userAgent: "",
    creditRemaining: 0,
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  // Get default profile path on mount
  useEffect(() => {
    const getDefaultPath = async () => {
      try {
        const path = (await window.electronAPI.dialog.getDefaultProfilePath()) as string;
        setDefaultProfilePath(path);
      } catch (error) {
        console.error("Failed to get default profile path:", error);
      }
    };
    getDefaultPath();
  }, []);

  // Update form data when editingProfile changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingProfile) {
        setFormData({
          name: editingProfile.name,
          userDataDir: editingProfile.userDataDir,
          userAgent: editingProfile.userAgent || "",
          creditRemaining: editingProfile.creditRemaining,
          tags: editingProfile.tags || [],
        });
      } else {
        // Generate random user agent only for new profiles
        const generateInitialUserAgent = async () => {
          try {
            const generatedUA = (await window.electronAPI.dialog.generateUserAgent()) as string;
            console.log("Auto-generated User Agent:", generatedUA);
            setFormData({
              name: "",
              userDataDir: "",
              userAgent: generatedUA,
              creditRemaining: 0,
              tags: [],
            });
          } catch (error) {
            console.error("Failed to generate initial user agent:", error);
            setFormData({
              name: "",
              userDataDir: "",
              userAgent: "",
              creditRemaining: 0,
              tags: [],
            });
          }
        };
        generateInitialUserAgent();
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
      userDataDir: "",
      userAgent: "",
      creditRemaining: 0,
      tags: [],
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Profile Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="My Profile"
              required
            />
          </div>

          {/* Profile Path Field */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary-500" />
              Profile Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.userDataDir}
                onChange={(e) => setFormData({ ...formData, userDataDir: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder={defaultProfilePath || "Leave empty for default app folder"}
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary-500" />
              User Agent
            </label>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={formData.userAgent}
                onChange={(e) => setFormData({ ...formData, userAgent: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                placeholder="Leave empty for default browser user agent"
              />
              <button
                type="button"
                onClick={generateRandomUserAgent}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium whitespace-nowrap"
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Credit Remaining
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.creditRemaining}
              onChange={(e) => setFormData({ ...formData, creditRemaining: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="0.00"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Set the initial credit balance for this profile
            </p>
          </div>

          {/* Tags Field */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
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
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Enter a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
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
