// Lightweight, safe wrapper for accessing electronAPI at runtime.
// Falls back to generic invoke channel when direct objects are not available.

const hasWindow = () => {
  try {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  } catch {
    return false;
  }
};

const hasInvoke = () => {
  try {
    return hasWindow() && typeof (window as any).electronAPI.invoke === 'function';
  } catch {
    return false;
  }
};

async function safeCall(fn: () => Promise<any>) {
  try {
    const res = await fn();
    return res;
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function invoke(channel: string, ...args: any[]) {
  if (!hasWindow()) return { success: false, error: 'ipc-not-available' };
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke(channel, ...args));
  // last-ditch: if an invoke-like function exists directly on electronAPI
  if (typeof (window as any).electronAPI.invoke === 'function') return safeCall(() => (window as any).electronAPI.invoke(channel, ...args));
  return { success: false, error: 'ipc-not-available' };
}

const profile = {
  getAll: () => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.profile && typeof (window as any).electronAPI.profile.getAll === 'function')
      return safeCall(() => (window as any).electronAPI.profile.getAll());
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('profile:getAll'));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  create: (data: any) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.profile && typeof (window as any).electronAPI.profile.create === 'function')
      return safeCall(() => (window as any).electronAPI.profile.create(data));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('profile:create', data));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  update: (id: string, data: any) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.profile && typeof (window as any).electronAPI.profile.update === 'function')
      return safeCall(() => (window as any).electronAPI.profile.update(id, data));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('profile:update', id, data));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  delete: (id: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.profile && typeof (window as any).electronAPI.profile.delete === 'function')
      return safeCall(() => (window as any).electronAPI.profile.delete(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('profile:delete', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  login: (id: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.profile && typeof (window as any).electronAPI.profile.login === 'function')
      return safeCall(() => (window as any).electronAPI.profile.login(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('profile:login', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
};

const automation = {
  start: (taskId: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.automation && typeof (window as any).electronAPI.automation.start === 'function')
      return safeCall(() => (window as any).electronAPI.automation.start(taskId));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('automation:start', taskId));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  stop: (taskId: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.automation && typeof (window as any).electronAPI.automation.stop === 'function')
      return safeCall(() => (window as any).electronAPI.automation.stop(taskId));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('automation:stop', taskId));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
};

const masterPrompts = {
  getAll: () => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.getAll === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.getAll());
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getAll'));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  getById: (id: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.getById === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.getById(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getById', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  getByProvider: (provider: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.getByProvider === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.getByProvider(provider));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getByProvider', provider));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  getByKind: (kind: string) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.getByKind === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.getByKind(kind));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getByKind', kind));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  createPrompt: (prompt: any) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.create === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.create(prompt));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:create', prompt));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  updatePrompt: (id: number, prompt: any) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.update === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.update(id, prompt));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:update', id, prompt));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  deletePrompt: (id: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.delete === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.delete(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:delete', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  archivePrompt: (id: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.masterPrompts && typeof (window as any).electronAPI.masterPrompts.archive === 'function')
      return safeCall(() => (window as any).electronAPI.masterPrompts.archive(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:archive', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
};

const promptHistory = {
  getByPromptId: (promptId: number, limit?: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.getByPromptId === 'function')
      return safeCall(() => (window as any).electronAPI.promptHistory.getByPromptId(promptId, limit));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('prompt-history:getByPromptId', { promptId, limit }));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  getById: (id: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.getById === 'function')
      return safeCall(() => (window as any).electronAPI.promptHistory.getById(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('prompt-history:getById', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  create: (data: any) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.create === 'function')
      return safeCall(() => (window as any).electronAPI.promptHistory.create(data));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('prompt-history:create', data));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  delete: (id: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.delete === 'function')
      return safeCall(() => (window as any).electronAPI.promptHistory.delete(id));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('prompt-history:delete', id));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
  deleteByPromptId: (promptId: number) => {
    if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
    if ((window as any).electronAPI.promptHistory && typeof (window as any).electronAPI.promptHistory.deleteByPromptId === 'function')
      return safeCall(() => (window as any).electronAPI.promptHistory.deleteByPromptId(promptId));
    if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('prompt-history:deleteByPromptId', promptId));
    return Promise.resolve({ success: false, error: 'ipc-not-available' });
  },
};

export default { invoke, profile, automation, masterPrompts, promptHistory };
