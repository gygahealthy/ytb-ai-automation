import React from "react";

const StoryCreatePage: React.FC = () => {
  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Story Creator (Placeholder)</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">This is a placeholder page for the story creation flow used by prompt-based video creation. Implement story editor and step flow here.</p>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <p className="text-gray-500 dark:text-gray-400">Components to add:</p>
          <ul className="list-disc list-inside mt-3 text-gray-600 dark:text-gray-300">
            <li>Story outline editor</li>
            <li>Scene-by-scene prompt builder</li>
            <li>Global settings (profile, project, aspect ratio)</li>
            <li>Preview & export controls</li>
          </ul>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">Use this page as the base for the storyboard-first workflow. When ready, wire this into the prompt generation pipeline.</div>
        </div>
      </div>
    </div>
  );
};

export default StoryCreatePage;
