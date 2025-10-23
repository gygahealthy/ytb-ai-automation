import { Settings } from "lucide-react";

interface WorkerLaunchSettingsProps {
  launchWorkerOnAppStart: boolean;
  onToggle: () => void;
}

export default function WorkerLaunchSettings({ launchWorkerOnAppStart, onToggle }: WorkerLaunchSettingsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 flex flex-col gap-4 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Worker Launch</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">On app start</p>
          </div>
        </div>

        <label className="inline-flex items-center cursor-pointer group">
          <input type="checkbox" checked={launchWorkerOnAppStart} onChange={onToggle} className="sr-only peer" />
          <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:border after:border-gray-300 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600 shadow-sm group-hover:shadow-md" />
        </label>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {launchWorkerOnAppStart ? "✓ Worker will launch when app starts" : "Worker won't launch on app start"}
      </p>
    </div>
  );
}
