import { hasWindow, hasInvoke, safeCall, invoke } from './invoke';

const getByPromptId = (promptId: number, limit?: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.getByPromptId === 'function')
    return safeCall(() => (window as any).electronAPI.promptHistory.getByPromptId(promptId, limit));
  if (hasInvoke()) return invoke('prompt-history:getByPromptId', { promptId, limit });
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const getById = (id: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.getById === 'function')
    return safeCall(() => (window as any).electronAPI.promptHistory.getById(id));
  if (hasInvoke()) return invoke('prompt-history:getById', id);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const create = (data: any) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.create === 'function')
    return safeCall(() => (window as any).electronAPI.promptHistory.create(data));
  if (hasInvoke()) return invoke('prompt-history:create', data);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const del = (id: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.delete === 'function')
    return safeCall(() => (window as any).electronAPI.promptHistory.delete(id));
  if (hasInvoke()) return invoke('prompt-history:delete', id);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const deleteByPromptId = (promptId: number) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.deleteByPromptId === 'function')
    return safeCall(() => (window as any).electronAPI.promptHistory.deleteByPromptId(promptId));
  if (hasInvoke()) return invoke('prompt-history:deleteByPromptId', promptId);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

export default { getByPromptId, getById, create, delete: del, deleteByPromptId };
