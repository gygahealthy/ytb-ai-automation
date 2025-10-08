import React, { useState } from 'react';
import { Edit3, Trash2, Archive, CheckCircle2, XCircle } from 'lucide-react';

export interface PromptRow {
  id?: number;
  provider?: string;
  promptKind?: string;
  description?: string;
  promptTemplate?: string;
  createdAt?: string;
  tags?: string[];
  isActive?: boolean;
  archived?: boolean;
}

type Props = {
  prompts: PromptRow[];
  onEdit: (row: PromptRow) => void;
  onDelete: (id: number) => void;
  onToggleActive?: (id: number, active: boolean) => void;
  onArchive?: (id: number) => void;
};

const AdminPromptTable: React.FC<Props> = ({ prompts, onEdit, onDelete, onToggleActive, onArchive }) => {
  const [showArchived, setShowArchived] = useState(false);

  const providerBadge = (provider?: string) => {
    const key = (provider || '').toLowerCase();
    const map: Record<string, { label: string; classes: string }> = {
      youtube: { label: 'YouTube', classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
      tiktok: { label: 'TikTok', classes: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800' },
      veo3: { label: 'VEO3', classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
    };
    const info = map[key] || { label: provider || 'Unknown', classes: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${info.classes}`}>
        {info.label}
      </span>
    );
  };

  const kindBadge = (kind?: string) => (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-mono">
      {kind || 'N/A'}
    </span>
  );

  const filteredPrompts = prompts.filter(p => showArchived || !p.archived);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <input 
            type="checkbox" 
            checked={showArchived} 
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show archived
        </label>
      </div>

      {/* Prompt Cards */}
      <div className="space-y-3">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No prompts found
          </div>
        ) : (
          filteredPrompts.map((p, idx) => (
            <div
              key={p.id ?? idx}
              className={`group relative bg-white dark:bg-slate-800 rounded-lg border transition-all duration-200 hover:shadow-md ${
                p.archived 
                  ? 'border-slate-200 dark:border-slate-700 opacity-60' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {/* Card Content */}
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {providerBadge(p.provider)}
                    {kindBadge(p.promptKind)}
                    {p.archived && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
                        Archived
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons - Visible on hover */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => onEdit(p)}
                      title="Edit prompt"
                      className="p-1.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {p.id && (
                      <>
                        <button
                          onClick={() => onArchive && onArchive(p.id!)}
                          title={p.archived ? "Unarchive prompt" : "Archive prompt"}
                          className="p-1.5 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id!)}
                          title="Delete prompt"
                          className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {p.description || 'No description'}
                  </h3>
                  {p.promptTemplate && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/30 rounded px-2 py-1.5 mt-2 overflow-hidden">
                      <div className="line-clamp-2 break-words whitespace-pre-wrap">
                        {p.promptTemplate}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {(p.tags || []).length > 0 ? (
                      p.tags?.map((t) => (
                        <span 
                          key={t} 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">No tags</span>
                    )}
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={() => p.id && onToggleActive && onToggleActive(p.id, !(p.isActive ?? true))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      p.isActive ?? true
                        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.isActive ?? true ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPromptTable;
