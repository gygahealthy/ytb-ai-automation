import { Activity, PlayCircle, Users, Clock } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string;
  icon: typeof Activity;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={clsx("p-3 rounded-lg", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to VEO3 Automation Control Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Tasks" value="3" icon={Activity} color="bg-blue-500" />
        <StatCard title="Total Automations" value="24" icon={PlayCircle} color="bg-green-500" />
        <StatCard title="Profiles" value="12" icon={Users} color="bg-purple-500" />
        <StatCard title="Avg. Runtime" value="2.5m" icon={Clock} color="bg-orange-500" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium">Automation Task #{i}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed successfully</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{i * 5} minutes ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

