import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (strategy: string, usp: string) => void;
  initialStrategy?: string;
  initialUsp?: string;
}

const StrategyModal: React.FC<Props> = ({ open, onClose, onSave, initialStrategy = '', initialUsp = '' }) => {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [usp, setUsp] = useState(initialUsp);

  useEffect(() => {
    if (open) {
      setStrategy(initialStrategy);
      setUsp(initialUsp);
    }
  }, [open, initialStrategy, initialUsp]);

  const handleSave = () => {
    onSave(strategy, usp);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Strategy & Goals</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Define your channel's direction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Channel Strategy
            </label>
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
              rows={8}
              placeholder="Describe your channel strategy, content themes, target audience, and approach..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Unique Selling Proposition (USP)
            </label>
            <textarea
              value={usp}
              onChange={(e) => setUsp(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
              rows={5}
              placeholder="What makes your channel unique? Why should viewers subscribe to your channel instead of others?"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Save className="w-4 h-4" />
            Save Strategy
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;
