import React from 'react';
import { Info } from 'lucide-react';

const VariablesHint: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">Using Variables in Prompts</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
            Add dynamic variables to your prompts using the{' '}
            <code className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              [VARIABLE_NAME]
            </code>{' '}
            syntax. These will automatically generate input fields in the user interface, allowing for flexible and reusable prompt templates.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full shadow-sm border border-purple-200 dark:border-purple-500/30">
              Example: [CHANNEL_NAME]
            </span>
            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full shadow-sm border border-blue-200 dark:border-blue-500/30">
              Example: [VIDEO_URL]
            </span>
            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full shadow-sm border border-emerald-200 dark:border-emerald-500/30">
              Example: [TOPIC]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablesHint;
