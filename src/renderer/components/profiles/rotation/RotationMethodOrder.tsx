import { Cpu } from "lucide-react";

interface RotationMethodOrderProps {
  rotationMethodOrder: ("refreshCreds" | "rotateCookie" | "headless")[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export default function RotationMethodOrder({ rotationMethodOrder, onMoveUp, onMoveDown }: RotationMethodOrderProps) {
  const getMethodLabel = (method: string): string => {
    switch (method) {
      case "refreshCreds":
        return "Refresh Creds";
      case "rotateCookie":
        return "Rotate Cookie";
      case "headless":
        return "Headless";
      default:
        return method;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all duration-200 flex flex-col gap-4 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Method Priority</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Fallback order</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {rotationMethodOrder.map((method, index) => (
          <div
            key={`${method}-${index}`}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-xs shadow-sm">
                {index + 1}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{getMethodLabel(method)}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 ${
                  index === 0
                    ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm hover:shadow-md"
                }`}
              >
                ↑
              </button>
              <button
                onClick={() => onMoveDown(index)}
                disabled={index === rotationMethodOrder.length - 1}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 ${
                  index === rotationMethodOrder.length - 1
                    ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm hover:shadow-md"
                }`}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
