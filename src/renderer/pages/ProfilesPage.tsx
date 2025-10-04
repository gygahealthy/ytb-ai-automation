import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface Profile {
  id: string;
  name: string;
  browser: string;
  proxy?: string;
  createdAt: string;
}

export default function ProfilesPage() {
  const [profiles] = useState<Profile[]>([
    {
      id: "1",
      name: "Profile 1",
      browser: "Chrome",
      proxy: "192.168.1.1:8080",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Profile 2",
      browser: "Chrome",
      createdAt: "2024-01-16",
    },
    {
      id: "3",
      name: "Profile 3",
      browser: "Chrome",
      proxy: "192.168.1.2:8080",
      createdAt: "2024-01-17",
    },
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profiles</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your browser profiles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">{profile.name.charAt(0)}</span>
              </div>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-2">{profile.name}</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Browser</span>
                <span className="font-medium">{profile.browser}</span>
              </div>
              {profile.proxy && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Proxy</span>
                  <span className="font-medium font-mono text-xs">{profile.proxy}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created</span>
                <span className="font-medium">{profile.createdAt}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

