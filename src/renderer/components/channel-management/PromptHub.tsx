import React from 'react';
import { Zap, Plus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  channelId: string;
  assignedPromptsCount: number;
}

const PromptHub: React.FC<Props> = ({ channelId, assignedPromptsCount }) => {
  const navigate = useNavigate();

  const promptTypes = [
    { name: 'Script Topic', kind: 'topic', color: 'bg-blue-500' },
    { name: 'Video Script', kind: 'script', color: 'bg-purple-500' },
    { name: 'Title Ideas', kind: 'title', color: 'bg-green-500' },
    { name: 'AI Scripts', kind: 'ai_script', color: 'bg-yellow-500' },
    { name: 'Assemble Clips', kind: 'clips', color: 'bg-pink-500' },
    { name: 'Audio Files', kind: 'audio', color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prompt & Script Hub</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{assignedPromptsCount} prompts configured</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/prompts?channelId=${channelId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <span>View All</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {promptTypes.map((prompt) => (
            <button
              key={prompt.kind}
              onClick={() => navigate(`/prompts/edit?channelId=${channelId}&kind=${prompt.kind}`)}
              className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl p-4 text-left transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md group"
            >
              <div className={`w-3 h-3 ${prompt.color} rounded-full mb-2.5`}></div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{prompt.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Configure prompt</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(`/prompts/new?channelId=${channelId}`)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-xl py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Prompt</span>
        </button>
      </div>
    </div>
  );
};

export default PromptHub;
