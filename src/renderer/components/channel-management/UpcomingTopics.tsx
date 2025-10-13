import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { ChannelTopic, CreateTopicInput } from '../../../main/modules/channel-management/youtube.types';
import { createTopic, deleteTopic } from '../../ipc/youtube';

interface Props {
  channelId: string;
  topics: ChannelTopic[];
  onUpdate: () => void;
}

const UpcomingTopics: React.FC<Props> = ({ channelId, topics, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;

    setSaving(true);
    try {
      const input: CreateTopicInput = {
        channelId,
        topicTitle: newTopicTitle,
        topicDescription: newTopicDesc,
        priority: 'medium',
        status: 'idea',
      };
      const response = await createTopic(input);
      if (response.success) {
        setNewTopicTitle('');
        setNewTopicDesc('');
        setIsAdding(false);
        onUpdate();
      } else {
        alert(response.error || 'Failed to create topic');
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic?')) return;

    try {
      const response = await deleteTopic(id);
      if (response.success) {
        onUpdate();
      } else {
        alert(response.error || 'Failed to delete topic');
      }
    } catch (err) {
      alert(String(err));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      idea: 'bg-gray-600',
      planned: 'bg-blue-600',
      in_progress: 'bg-purple-600',
      completed: 'bg-green-600',
      archived: 'bg-gray-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl flex flex-col h-full">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Topics</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{topics.length} topics planned</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            title="Add topic"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">{/* Added min-h-0 for proper flex behavior */}
        {isAdding && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="Topic title..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
            />
            <textarea
              value={newTopicDesc}
              onChange={(e) => setNewTopicDesc(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTopic}
                disabled={saving || !newTopicTitle.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
              >
                {saving ? 'Adding...' : 'Add Topic'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTopicTitle('');
                  setNewTopicDesc('');
                }}
                className="px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {topics.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">No upcoming topics yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Click the + button to add your first topic</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topics.map((topic) => (
              <div key={topic.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-2.5 h-2.5 ${getPriorityColor(topic.priority)} rounded-full`}></div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{topic.topicTitle}</span>
                    </div>
                    {topic.topicDescription && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2.5 leading-relaxed">{topic.topicDescription}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 ${getStatusBadge(topic.status)} text-white rounded-lg font-medium`}>
                        {topic.status.replace('_', ' ')}
                      </span>
                      {topic.targetDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{topic.targetDate}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Delete topic"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingTopics;
