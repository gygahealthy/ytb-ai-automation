import React, { useState } from 'react';
import { FileText, Edit, Save, X } from 'lucide-react';
import { ChannelDeepDive, UpdateDeepDiveInput } from '../../../main/modules/channel-management/youtube.types';
import { upsertChannelDeepDive } from '../../ipc/youtube';

interface Props {
  channelId: string;
  deepDive?: ChannelDeepDive;
  onUpdate: () => void;
}

const StrategySection: React.FC<Props> = ({ channelId, deepDive, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [strategy, setStrategy] = useState(deepDive?.strategyMarkdown || '');
  const [usp, setUsp] = useState(deepDive?.uspMarkdown || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const input: UpdateDeepDiveInput = {
        strategyMarkdown: strategy,
        uspMarkdown: usp,
      };
      const response = await upsertChannelDeepDive(channelId, input);
      if (response.success) {
        setIsEditing(false);
        onUpdate();
      } else {
        alert(response.error || 'Failed to save');
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStrategy(deepDive?.strategyMarkdown || '');
    setUsp(deepDive?.uspMarkdown || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Strategy & Goals</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Define your content strategy</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
              title="Edit strategy"
            >
              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Channel Strategy</label>
              <textarea
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                rows={6}
                placeholder="Describe your channel strategy, content themes, and approach..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Unique Selling Proposition (USP)</label>
              <textarea
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                rows={4}
                placeholder="What makes your channel unique? Why should viewers subscribe?"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {strategy ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Strategy
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap pl-3.5">
                  {strategy}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">No strategy defined yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Click edit to add your content strategy</p>
              </div>
            )}
            
            {usp && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  USP
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap pl-3.5">
                  {usp}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategySection;
