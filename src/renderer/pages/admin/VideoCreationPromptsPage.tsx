import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import electronApi from '../../ipc';
import { useConfirm } from '../../hooks/useConfirm';
import AdminPromptTable, { PromptRow } from '../../components/admin/AdminPromptTable';
import PromptModal from '../../components/admin/PromptModal';
import VariablesHint from '../../components/admin/VariablesHint';

interface MasterPrompt {
  id?: number;
  provider: string;
  promptKind: string;
  promptTemplate: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

const VideoCreationPromptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromptRow | undefined>(undefined);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
  const result = await electronApi.masterPrompts.getByKind('video_creation');
      if (result.success) {
        setPrompts(result.data);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
  const confirmFn = useConfirm();
  if (!(await confirmFn({ message: 'Are you sure you want to delete this prompt?' }))) return;
  const result = await electronApi.masterPrompts.deletePrompt(id);
      if (result.success) {
        await loadPrompts();
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const openAddModal = () => { setEditing({ provider: 'veo3', promptKind: 'video_creation', description: '', promptTemplate: '' }); setModalOpen(true); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="w-full px-6 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">AI Video Creation Prompts</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Configure master prompts for video generation</p>
            </div>
          </div>

          <VariablesHint />
        </div>

        <div className="flex items-center justify-end mb-4">
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:shadow-md transition-all">
            <Plus className="w-4 h-4" /> Add New Prompt
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div>
            <AdminPromptTable
              prompts={prompts as PromptRow[]}
              onEdit={(row) => { setEditing(row); setModalOpen(true); }}
              onDelete={async (id) => { await handleDelete(id); }}
              onToggleActive={async (id, active) => {
                try {
                  await electronApi.masterPrompts.updatePrompt(id, { isActive: active } as any);
                  await loadPrompts();
                } catch (err) { console.error(err); }
              }}
              onArchive={async (id) => {
                const prompt = prompts.find(p => p.id === id);
                const isArchived = (prompt as any)?.archived;
                const action = isArchived ? 'unarchive' : 'archive';
                if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this prompt?`)) return;
                try {
                  await electronApi.masterPrompts.updatePrompt(id, { archived: !isArchived } as any);
                  await loadPrompts();
                } catch (err) { console.error(err); }
              }}
            />

            <PromptModal
              open={modalOpen}
              initial={editing}
              onClose={() => { setModalOpen(false); setEditing(undefined); }}
              onSave={async (p) => {
                setModalOpen(false);
                try {
                  if (p.id) {
                    await electronApi.masterPrompts.updatePrompt(p.id, p as any);
                  } else {
                    await electronApi.masterPrompts.createPrompt(p as any);
                  }
                  await loadPrompts();
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCreationPromptsPage;
