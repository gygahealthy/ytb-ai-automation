import { Clock } from "lucide-react";

interface RotationIntervalProps {
  rotationIntervalMinutes: number;
  onChange: (minutes: number) => void;
}

export default function RotationInterval({ rotationIntervalMinutes, onChange }: RotationIntervalProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 flex flex-col gap-4 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rotation Interval</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Time between rotations</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Minutes</label>
          <input
            type="number"
            min={1}
            max={1440}
            value={rotationIntervalMinutes}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:border-green-400 dark:focus:ring-green-900/30 transition-all"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Range: 1–1440 minutes (24 hours)</div>
      </div>
    </div>
  );
}
