import { useState } from "react";
import { Play, StopCircle, Plus } from "lucide-react";
import clsx from "clsx";
import electronApi from "../utils/electronApi";

interface AutomationTask {
  id: string;
  name: string;
  status: "running" | "stopped" | "completed" | "failed";
  progress: number;
}

export default function AutomationPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([
    { id: "1", name: "VEO3 Profile Creation", status: "running", progress: 65 },
    { id: "2", name: "Data Scraping Task", status: "completed", progress: 100 },
    { id: "3", name: "Form Automation", status: "stopped", progress: 0 },
  ]);

  const handleStart = async (id: string) => {
    try {
      const res = await electronApi.automation.start(id);
      if (!res || res.success === false) {
        console.warn('automation.start failed', res);
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'running', progress: t.progress > 0 ? t.progress : 1 } : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async (id: string) => {
    try {
      const res = await electronApi.automation.stop(id);
      if (!res || res.success === false) {
        console.warn('automation.stop failed', res);
        return;
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'stopped' } : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: AutomationTask["status"]) => {
    switch (status) {
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your automation tasks</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">{task.name}</h3>
                  <span className={clsx("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(task.status))}>
                    {task.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {task.status === "running" ? (
                    <button onClick={() => handleStop(task.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <StopCircle className="w-5 h-5" />
                    </button>
                  ) : (
                    <button onClick={() => handleStart(task.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {task.status === "running" && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

